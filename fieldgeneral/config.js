// FieldGeneral — shared config + helpers
// Your stack: Supabase (Postgres + Auth) on the front, deployed static on Vercel.
//
// SETUP: create a FieldGeneral Supabase project (Dashboard → New project),
// then paste its URL + anon key below (Settings → API). Until you do, the app
// runs in DEMO MODE (no login required, data lives in your browser) so you can
// see the whole flow today with zero wiring.

const SUPABASE_URL = 'YOUR_SUPABASE_URL'   // e.g. https://abcd1234.supabase.co
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY'

const DEMO = !SUPABASE_URL.startsWith('https://') || SUPABASE_URL.includes('YOUR_SUPABASE')

let supabase = null
if (!DEMO && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  })
}

// ---- Position groups (PRD: OL, DL, LB, DB, WR, RB, QB, ST) ----
const POSITION_GROUPS = {
  QB: { name: 'Quarterbacks', unit: 'Offense',       focus: 'footwork, core, mobility, arm care' },
  RB: { name: 'Running Backs', unit: 'Offense',      focus: 'power, speed, contact balance' },
  WR: { name: 'Wide Receivers', unit: 'Offense',     focus: 'speed, route quickness, conditioning' },
  OL: { name: 'Offensive Line', unit: 'Offense',     focus: 'strength, mass, anchor, leverage' },
  DL: { name: 'Defensive Line', unit: 'Defense',     focus: 'explosive get-off, hand strength' },
  LB: { name: 'Linebackers', unit: 'Defense',        focus: 'speed-strength, tackling, range' },
  DB: { name: 'Defensive Backs', unit: 'Defense',    focus: 'hips, change of direction, top speed' },
  ST: { name: 'Special Teams', unit: 'Special Teams', focus: 'leg strength, speed, consistency' }
}
const UNITS = ['Offense', 'Defense', 'Special Teams']

function groupsForUnit(unit) {
  return Object.keys(POSITION_GROUPS).filter(k => POSITION_GROUPS[k].unit === unit)
}

// Status colors for the accountability board
const STATUS = {
  green:  { color: '#22c55e', label: 'Bought in' },   // all 3 done
  yellow: { color: '#eab308', label: 'Partial' },     // 1-2 done
  red:    { color: '#ef4444', label: 'Slacking' }      // 0 done / no check-in
}

function checkinStatus(c) {
  if (!c) return 'red'
  const n = (c.lift_done ? 1 : 0) + (c.ate_right ? 1 : 0) + (c.film_watched ? 1 : 0)
  return n === 3 ? 'green' : n === 0 ? 'red' : 'yellow'
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const niceDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
const token = () => (crypto.randomUUID ? crypto.randomUUID() : 'p' + Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 16)

// ---- Child-safety guardrails (non-negotiable — surfaced in the UI + AI prompt) ----
const GUARDRAILS = [
  'No individualized calorie, macro, or diet targets for players — general healthy-habit guidance only.',
  'Any injury, pain, or health concern routes to the athletic trainer. The app never diagnoses or treats.',
  'No private adult–minor channel. Everything stays in team/group context and is parent-visible.',
  'Players never pay and never enter payment info. The coach is the customer.'
]

// ============================================================
//  LOCAL GENERATOR — works today with NO API key.
//  Builds a position-aware workout + a message in the coach's
//  voice. Upgrades automatically to real Claude AI once the
//  generate-daily Edge Function is deployed (see README).
// ============================================================
function localWorkout(group, focus) {
  const banks = {
    QB: [['Pocket footwork ladder', '4 rounds', '20 sec'], ['Med-ball rotational throw', '3', '8 each side'], ['Plank series', '3', '45 sec'], ['Band shoulder care', '2', '15'], ['Tempo runs', '6', '40 yds']],
    RB: [['Trap-bar deadlift', '4', '5'], ['Box jumps', '4', '4'], ['Sled push', '4', '15 yds'], ['Hanging leg raise', '3', '12'], ['Conditioning: gassers', '4', '—']],
    WR: [['Acceleration sprints', '6', '20 yds'], ['Single-leg RDL', '3', '8 each'], ['Lateral bounds', '3', '6 each'], ['Catch-on-the-move drill', '5', '6'], ['Tempo conditioning', '8', '60 yds']],
    OL: [['Back squat', '5', '5'], ['Bench press', '4', '6'], ['Bent-over row', '4', '8'], ['Hand-fight / mirror drill', '4', '20 sec'], ['Loaded carries', '3', '30 yds']],
    DL: [['Power clean', '5', '3'], ['Push press', '4', '5'], ['Get-off / first-step drill', '6', '5 yds'], ['Plate pinch grip', '3', '30 sec'], ['Prowler sprints', '4', '15 yds']],
    LB: [['Front squat', '4', '5'], ['Pull-ups', '4', 'max'], ['Lateral shuffle + tackle form', '4', '10 yds'], ['Med-ball slam', '3', '8'], ['Conditioning: 110s', '6', '—']],
    DB: [['Hip mobility flow', '2', '8'], ['Backpedal & break drill', '6', '10 yds'], ['Nordic curl', '3', '6'], ['Lateral plyo', '4', '6 each'], ['Top-speed flys', '6', '30 yds']],
    ST: [['Single-leg strength (split squat)', '4', '6 each'], ['Calf / ankle stiffness hops', '4', '10'], ['Core anti-rotation', '3', '10 each'], ['Operation-time tempo runs', '6', '40 yds'], ['Consistency reps (technique)', '3', '8']]
  }
  return (banks[group] || banks.LB).map(([name, sets, reps]) => ({ name, sets, reps }))
}

function localMessage({ coachName, teamName, group, vibe, signOff, examples }) {
  const g = POSITION_GROUPS[group]
  const v = (vibe || '').trim()
  const opener = v ? `${v}.` : `Today we get 1% better.`
  const styleHint = (examples && examples[0]) ? '' : ''
  return [
    `${g.name} — ${opener}`,
    `We're locking in on ${g.focus}. Knock out today's lift, eat clean (real food, plenty of water), and get your film in. Small wins stack into Friday nights.`,
    `Tap your check-ins when each one's done so I can see who's bought in. ${signOff || (coachName ? `— Coach ${coachName.split(' ').pop()}` : '— Coach')}`
  ].join('\n\n')
}

function localNutrition() {
  return 'Build your plate around real food: a palm of protein, a fist of carbs, plenty of colorful veggies, and water all day. (General habits only — no calorie targets. Questions about injuries or eating go to the athletic trainer.)'
}

// Try the real Claude Edge Function first; fall back to the local generator.
async function generateDaily({ coachName, teamName, group, vibe, signOff, examples, toneNotes }) {
  if (!DEMO && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily', {
        body: { coachName, teamName, group, focus: POSITION_GROUPS[group].focus, vibe, signOff, examples, toneNotes, guardrails: GUARDRAILS }
      })
      if (!error && data && data.message) return { ...data, source: 'claude' }
    } catch (e) { /* fall through to local */ }
  }
  return {
    message: localMessage({ coachName, teamName, group, vibe, signOff, examples }),
    workout: localWorkout(group, POSITION_GROUPS[group].focus),
    nutrition: localNutrition(),
    source: 'local'
  }
}

// ============================================================
//  DATA LAYER — same API in DEMO (localStorage) and LIVE (Supabase).
//  Pages only ever call db.*  so nothing changes when you wire keys.
// ============================================================
const _ls = {
  read() { try { return JSON.parse(localStorage.getItem('fg_demo')) || {} } catch (e) { return {} } },
  write(s) { localStorage.setItem('fg_demo', JSON.stringify(s)) }
}

const db = {
  demo: DEMO,

  // ---- Auth ----
  async signUp(email, password, fullName, teamName) {
    if (DEMO) {
      const s = _ls.read()
      s.coach = { id: 'demo-coach', email, full_name: fullName, team_name: teamName }
      _ls.write(s); return s.coach
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const id = data.user.id
    await supabase.from('coaches').upsert({ id, email, full_name: fullName, team_name: teamName })
    return { id, email, full_name: fullName, team_name: teamName }
  },
  async signIn(email, password) {
    if (DEMO) { const s = _ls.read(); return s.coach || null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return this.currentCoach()
  },
  async signOut() {
    if (DEMO) return
    await supabase.auth.signOut()
  },
  async currentCoach() {
    if (DEMO) { return _ls.read().coach || null }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    let { data } = await supabase.from('coaches').select('*').eq('id', user.id).single()
    if (!data) { await supabase.from('coaches').upsert({ id: user.id, email: user.email }); data = { id: user.id, email: user.email } }
    return data
  },

  // ---- Voice ----
  async getVoice(coachId) {
    if (DEMO) { return _ls.read().voice || null }
    const { data } = await supabase.from('voice_profiles').select('*').eq('coach_id', coachId).single()
    return data
  },
  async saveVoice(coachId, v) {
    if (DEMO) { const s = _ls.read(); s.voice = v; _ls.write(s); return v }
    await supabase.from('voice_profiles').upsert({ coach_id: coachId, ...v, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
    return v
  },

  // ---- Players ----
  async getPlayers(coachId) {
    if (DEMO) { return _ls.read().players || [] }
    const { data } = await supabase.from('players').select('*').eq('coach_id', coachId).order('full_name')
    return data || []
  },
  async addPlayer(coachId, p) {
    const row = { full_name: p.full_name, position: p.position, position_group: p.position, parent_contact: p.parent_contact || '', access_token: token() }
    if (DEMO) { const s = _ls.read(); s.players = s.players || []; row.id = token(); s.players.push(row); _ls.write(s); return row }
    const { data, error } = await supabase.from('players').insert({ coach_id: coachId, ...row }).select().single()
    if (error) throw error
    return data
  },
  async removePlayer(id) {
    if (DEMO) { const s = _ls.read(); s.players = (s.players || []).filter(p => p.id !== id); _ls.write(s); return }
    await supabase.from('players').delete().eq('id', id)
  },

  // ---- Daily messages ----
  async getMessage(coachId, date, group) {
    if (DEMO) { return (_ls.read().messages || {})[date + '|' + group] || null }
    const { data } = await supabase.from('daily_messages').select('*').eq('coach_id', coachId).eq('for_date', date).eq('position_group', group).single()
    return data
  },
  async saveMessage(coachId, date, group, m) {
    const row = { for_date: date, position_group: group, message_text: m.message, workout: m.workout, nutrition: m.nutrition, status: m.status || 'draft', source: m.source }
    if (DEMO) { const s = _ls.read(); s.messages = s.messages || {}; s.messages[date + '|' + group] = row; _ls.write(s); return row }
    await supabase.from('daily_messages').upsert({ coach_id: coachId, ...row }, { onConflict: 'coach_id,for_date,position_group' })
    return row
  },

  // ---- Check-ins ----
  async getCheckins(coachId, date) {
    if (DEMO) {
      const s = _ls.read(); const out = {}
      ;(s.players || []).forEach(p => { out[p.id] = (s.checkins || {})[p.id + '|' + date] || null })
      return out
    }
    const players = await this.getPlayers(coachId)
    const ids = players.map(p => p.id)
    const { data } = await supabase.from('checkins').select('*').in('player_id', ids).eq('for_date', date)
    const out = {}; players.forEach(p => out[p.id] = null)
    ;(data || []).forEach(c => out[c.player_id] = c)
    return out
  },
  async getCheckin(playerId, date) {
    if (DEMO) { return (_ls.read().checkins || {})[playerId + '|' + date] || null }
    const { data } = await supabase.from('checkins').select('*').eq('player_id', playerId).eq('for_date', date).single()
    return data
  },
  async setCheckin(playerId, date, c) {
    const row = { player_id: playerId, for_date: date, ...c, updated_at: new Date().toISOString() }
    if (DEMO) { const s = _ls.read(); s.checkins = s.checkins || {}; s.checkins[playerId + '|' + date] = row; _ls.write(s); return row }
    await supabase.from('checkins').upsert(row, { onConflict: 'player_id,for_date' })
    return row
  },

  // ---- Player lookup by token (for player.html) ----
  async getPlayerByToken(tok) {
    if (DEMO) {
      const s = _ls.read(); const p = (s.players || []).find(x => x.access_token === tok)
      if (!p) return null
      return { player: p, coach: s.coach }
    }
    const { data: p } = await supabase.from('players').select('*').eq('access_token', tok).single()
    if (!p) return null
    const { data: coach } = await supabase.from('coaches').select('full_name, team_name').eq('id', p.coach_id).single()
    return { player: p, coach }
  },
  async getMessageForGroup(coachId, date, group) { return this.getMessage(coachId, date, group) }
}
