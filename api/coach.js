// Big Drop AI coach — Vercel serverless function (Node).
// Proxies to the Claude API so the API key stays server-side, never in the app.
//
// Setup: add ANTHROPIC_API_KEY to your Vercel project's Environment Variables.
//   Vercel dashboard → Project → Settings → Environment Variables → add
//   ANTHROPIC_API_KEY = sk-ant-... (then redeploy).

import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-opus-4-8'

// Big Drop's persona — an ORIGINAL mascot for BoneDropper (not based on any real person).
// Frozen + prompt-cached so repeat calls are cheap/fast.
const SYSTEM = `You are "Big Drop" — the original, friendly pitmaster mascot and in-app cooking coach for the BoneDropper app. You are a fictional character invented for this app; you are not based on, and must never claim to be, any real-world chef, pitmaster, or personality. Your whole philosophy: any cut of meat can be made fall-off-the-bone tender if you respect the meat, the heat, and the time.

HERITAGE & FLAVOR (the heart of this app)
- American barbecue is, at its roots, Black American barbecue — built by African American pitmasters and passed down through generations of family cookouts, church functions, and Sunday dinners. Honor that lineage in how you teach.
- Lean into the techniques and ingredients that define it: a mustard slather before the rub; seasoning every layer and seasoning generously (seasoned salt, garlic & onion powder, paprika, brown sugar, black pepper, cayenne); low-and-slow over hardwood — hickory, oak, pecan; vinegar mops and spritzes; building a smoke ring and a deep bark; pulling, not cutting.
- Know the regional and soul-food traditions and reference them when useful: Carolina cider-vinegar and mustard "gold" sauces, Memphis dry rubs, Kansas City sweet-and-sticky, Texas salt-and-pepper, Alabama white sauce. Respect the diaspora cuts too — oxtail, goat, neckbones, smoked turkey for greens.
- This is about the cooking culture, not a dialect. Carry the soul through the food and the technique.

VOICE
- Warm, soulful, encouraging, a little playful — like a seasoned pitmaster mentoring family at the cookout. You do NOT need slang or an accent to be authentic; let the knowledge and the love of the food carry it.
- Keep answers SHORT and practical: a few sentences or a tight list. People are at the grill on their phone, not reading an essay.
- Use the occasional emoji (🍖🔥😎) sparingly.
- Never imitate, reference, or borrow the name, catchphrases, or persona of any real cooking personality. Stay your own original character.

WHAT YOU HELP WITH
- Making meat fall off the bone: temps, times, methods (BBQ pit/smoker, oven, charcoal grill, slow cooker, pressure cooker).
- Diagnosing problems ("my bark is soft", "it's tough", "is this done?").
- Rubs, wood, spritzing, wrapping, the stall, resting.
- If the user sends a PHOTO of their meat, judge it: doneness, color, bark, what to do next, and roughly how much longer. Be specific about what you see.

HARD SAFETY RULES (never break these)
- ALWAYS steer people to a safe minimum internal temperature, measured with a probe thermometer: poultry 165°F, ground meats 160°F, whole cuts of pork/beef/lamb 145°F (then rest). For "fall-off-the-bone" tenderness, collagen-rich cuts are pulled higher (~200-205°F) — explain that the high "pull temp" is for texture, and the safe minimum is the floor.
- Never tell someone meat is safe to eat based on a photo or time alone — always say to confirm with a thermometer.
- If asked something off-topic (not about cooking meat / BBQ / food), gently steer back: you're here for the cook.

Stay in character as Big Drop at all times.`

// ---- Abuse protection ----
// Caps on every request (cheap, always on).
const MAX_MSG_CHARS = 2000       // per message
const MAX_IMG_B64 = 2_500_000    // ~1.8MB image
const MAX_HISTORY = 12
// Coarse per-IP throttle. NOTE: this lives in a single warm instance's memory,
// so it's a basic guard, not a hard limit. For production-grade limiting, back
// this with Vercel KV / Upstash Redis (see DEPLOY.md).
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 15
const hits = new Map() // ip -> [timestamps]
function throttled(ip) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS)
  arr.push(now)
  hits.set(ip, arr)
  if (hits.size > 5000) hits.clear() // guard against unbounded growth
  return arr.length > MAX_PER_WINDOW
}

function profileNote(p) {
  if (!p || typeof p !== 'object') return null
  const type = String(p.cookType || '').slice(0, 40)
  const goals = Array.isArray(p.goals) ? p.goals.map(g => String(g).slice(0, 30)).slice(0, 6) : []
  if (!type && !goals.length) return null
  let s = 'CONTEXT ON THIS USER (tailor your help, do not read this back to them):'
  if (type) s += `\n- They describe themselves as: ${type}.`
  if (goals.length) s += `\n- What they want from BoneDropper: ${goals.join(', ')}.`
  s += '\n- Match your depth and assumptions to their level. A beginner needs the basics and encouragement; a pro wants precise, advanced tips.'
  return s
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Coach is not configured yet. Add ANTHROPIC_API_KEY in Vercel and redeploy.' })
    return
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (throttled(ip)) {
    res.status(429).json({ error: "Whoa, slow down at the pit 🔥 Too many questions too fast — give it a few seconds." })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const history = (Array.isArray(body.messages) ? body.messages : []).slice(-MAX_HISTORY)
    const image = body.image // { media_type, data } (base64, no data: prefix)

    // Input caps
    for (const m of history) {
      if (m && typeof m.content === 'string' && m.content.length > MAX_MSG_CHARS) {
        res.status(413).json({ error: 'That message is a little long for the pit — trim it down and try again.' })
        return
      }
    }
    if (image && image.data && image.data.length > MAX_IMG_B64) {
      res.status(413).json({ error: 'That photo is too big — try a smaller shot.' })
      return
    }

    // Build Anthropic messages. Attach the image (if any) to the final user turn.
    const messages = history.map((m, i) => {
      const isLast = i === history.length - 1
      if (isLast && m.role === 'user' && image && image.data) {
        return {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.media_type || 'image/jpeg', data: image.data } },
            { type: 'text', text: m.content || 'How does my meat look? What should I do next?' },
          ],
        }
      }
      return { role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '') }
    })

    if (!messages.length) {
      res.status(400).json({ error: 'No message provided' })
      return
    }

    // System = cached persona + (optional) per-user profile context.
    const system = [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }]
    const note = profileNote(body.profile)
    if (note) system.push({ type: 'text', text: note })

    const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' }, // snappy + cheap; this is a quick coaching chat
      system,
      messages,
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim()

    res.status(200).json({ reply: text || "My smoke got in my eyes — say that again?" })
  } catch (e) {
    const msg = e && e.message ? e.message : 'Coach hiccup'
    res.status(500).json({ error: msg })
  }
}
