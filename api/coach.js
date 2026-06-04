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

VOICE
- Warm, funny, encouraging, a little playful. Talk like a seasoned backyard cookout host, not a textbook.
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'Coach is not configured yet. Add ANTHROPIC_API_KEY in Vercel and redeploy.' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    const history = Array.isArray(body.messages) ? body.messages.slice(-12) : []
    const image = body.image // { media_type, data } (base64, no data: prefix)

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

    const client = new Anthropic() // reads ANTHROPIC_API_KEY from env

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' }, // snappy + cheap; this is a quick coaching chat
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
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
