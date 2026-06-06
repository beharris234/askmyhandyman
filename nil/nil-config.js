/* ============================================================
   NILocal — shared config, data layer & helpers
   Local-first NIL marketplace: local businesses meet campus athletes.
   ------------------------------------------------------------
   This file works in TWO modes:
     1) SUPABASE MODE  — set SUPABASE_URL + SUPABASE_KEY below and run
        nil-schema.sql in your Supabase project. Signups & the athlete
        directory then read/write to a real database.
     2) DEMO MODE      — leave credentials blank. The app still works:
        seed athletes show in the directory, and signups are saved to
        the browser (localStorage) so you can demo and export them.
   ============================================================ */

/* ---- 1. Supabase credentials (optional) -------------------- */
const SUPABASE_URL = ''   // e.g. 'https://xxxx.supabase.co'
const SUPABASE_KEY = ''   // your project's anon/public key

/* ---- 2. Create client only if configured ------------------- */
let sb = null
try {
  if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  }
} catch (e) { sb = null }

const NIL = {
  configured: !!sb,

  /* Sports we support at launch (wedge = women's + Olympic + mid-major) */
  sports: [
    'Volleyball','Softball','Soccer','Basketball (W)','Basketball (M)',
    'Track & Field','Swimming & Diving','Gymnastics','Baseball','Football',
    'Tennis','Golf','Wrestling','Lacrosse','Cross Country','Rowing','Other'
  ],

  /* Deal types a local business can book */
  dealTypes: [
    'Social media post','In-store appearance','Autograph signing',
    'Camp / clinic coaching','Product seeding','Shoutout / story',
    'Event hosting','Photo / video shoot'
  ],

  /* ---- Seed directory (shown in DEMO mode + as fallback) ---- */
  seedAthletes: [
    { name:'Maya Robinson', sport:'Volleyball', school:'State U', city:'Springfield', followers:18400, rate:150, bio:'Outside hitter. Two-time all-conference. Loves repping local food spots.', deals:['Social media post','In-store appearance'], verified:true },
    { name:'Jordan Ellis', sport:'Track & Field', school:'State U', city:'Springfield', followers:9200, rate:90, bio:'400m sprinter. Building a fitness brand, open to gym & nutrition partners.', deals:['Social media post','Shoutout / story'], verified:true },
    { name:'Tasha Nguyen', sport:'Soccer', school:'River College', city:'Springfield', followers:31200, rate:220, bio:'Midfielder + content creator. Strong engagement with local families.', deals:['Social media post','Camp / clinic coaching','Event hosting'], verified:true },
    { name:'Marcus Bell', sport:'Basketball (M)', school:'State U', city:'Springfield', followers:54800, rate:400, bio:'Starting guard. Big reach on game days, great for grand openings.', deals:['In-store appearance','Autograph signing','Social media post'], verified:false },
    { name:'Priya Shah', sport:'Gymnastics', school:'River College', city:'Springfield', followers:27600, rate:180, bio:'All-around. Viral floor routines — fun, family-friendly brand fit.', deals:['Social media post','Product seeding'], verified:true },
    { name:'Diego Ramirez', sport:'Baseball', school:'State U', city:'Springfield', followers:7400, rate:75, bio:'Pitcher. Hometown kid, happy to do clinics for local youth leagues.', deals:['Camp / clinic coaching','Autograph signing'], verified:false },
    { name:'Kayla Foster', sport:'Softball', school:'River College', city:'Springfield', followers:12100, rate:110, bio:'Catcher & team captain. Reliable, on-time, business-minded.', deals:['Social media post','In-store appearance','Shoutout / story'], verified:true },
    { name:'Andre Wilson', sport:'Swimming & Diving', school:'State U', city:'Springfield', followers:6100, rate:60, bio:'Distance freestyle. Early-stage, eager for first partnerships.', deals:['Shoutout / story','Product seeding'], verified:false }
  ],

  /* ---- Submit an athlete signup ----------------------------- */
  async submitAthlete(rec) {
    rec = { ...rec, created_at: new Date().toISOString() }
    if (sb) {
      const { error } = await sb.from('nil_athletes').insert([rec])
      if (error) throw error
      return { mode:'supabase' }
    }
    this._localPush('nil_demo_athletes', rec)
    return { mode:'local' }
  },

  /* ---- Submit a business signup ----------------------------- */
  async submitBusiness(rec) {
    rec = { ...rec, created_at: new Date().toISOString() }
    if (sb) {
      const { error } = await sb.from('nil_businesses').insert([rec])
      if (error) throw error
      return { mode:'supabase' }
    }
    this._localPush('nil_demo_businesses', rec)
    return { mode:'local' }
  },

  /* ---- Load athletes for the directory ---------------------- */
  async loadAthletes() {
    if (sb) {
      const { data, error } = await sb
        .from('nil_athletes')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending:false })
      if (!error && data && data.length) return data
    }
    // Demo mode: seed + any locally-submitted (approved-by-default) athletes
    const local = this._localGet('nil_demo_athletes')
    return [...this.seedAthletes, ...local]
  },

  /* ---- localStorage helpers (demo mode) -------------------- */
  _localPush(key, rec) {
    const arr = this._localGet(key); arr.push(rec)
    try { localStorage.setItem(key, JSON.stringify(arr)) } catch (e) {}
  },
  _localGet(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]') } catch (e) { return [] }
  },

  /* ---- Export local signups to CSV (for early manual phase) - */
  exportCSV(key) {
    const rows = this._localGet(key)
    if (!rows.length) { alert('No saved signups yet on this device.'); return }
    const cols = [...new Set(rows.flatMap(r => Object.keys(r)))]
    const esc = v => '"' + String(v ?? '').replace(/"/g,'""') + '"'
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = key + '-' + new Date().toISOString().slice(0,10) + '.csv'
    a.click()
  },

  fmtFollowers(n) {
    n = Number(n) || 0
    if (n >= 1000) return (n/1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
    return String(n)
  }
}

window.NIL = NIL
