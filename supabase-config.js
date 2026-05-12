// PrivateBlast — Supabase Configuration
// Update SUPABASE_URL and SUPABASE_KEY with your project credentials from:
// Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://dqvdzvfwpzqrymqbirhj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdmR6dmZ3cHpxcnltcWJpcmhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzgxMDksImV4cCI6MjA5NDExNDEwOX0.WZkxRs_1hTIf3MRK2uFXBJZWRgigZfc9Uby3gqrQFsU'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Role definitions — matches onboarding prototypes
const ROLES = {
  entertainer_f: {
    icon: '💃', name: 'Female Entertainer', privacy: 'private',
    groups: [
      { label: '👑 VIP', color: '#ffd700' },
      { label: '💜 Regulars', color: '#b496ff' },
      { label: '🎯 Prospects', color: '#ff6eb4' },
      { label: '😒 Cheap', color: '#545468' },
      { label: '✨ New', color: '#64ffda' }
    ]
  },
  entertainer_m: {
    icon: '🕺', name: 'Male Entertainer', privacy: 'private',
    groups: [
      { label: '👑 VIP', color: '#ffd700' },
      { label: '🎉 Bachelorette', color: '#ff6eb4' },
      { label: '🔒 Private Events', color: '#b496ff' },
      { label: '🔄 Regulars', color: '#64ffda' }
    ]
  },
  companion: {
    icon: '👠', name: 'Personal Escort / Companion', privacy: 'private',
    groups: [
      { label: '👑 VIP', color: '#ffd700' },
      { label: '🔄 Regulars', color: '#b496ff' },
      { label: '✨ New Clients', color: '#64ffda' },
      { label: '⚠️ Watch List', color: '#ff4d6d' }
    ]
  },
  wellness: {
    icon: '💆', name: 'Private Wellness Provider', privacy: 'private',
    groups: [
      { label: '👑 VIP', color: '#ffd700' },
      { label: '🔄 Regulars', color: '#b496ff' },
      { label: '✨ New Clients', color: '#64ffda' },
      { label: '😴 Lapsed', color: '#545468' }
    ]
  },
  creator: {
    icon: '📱', name: 'Content Creator', privacy: 'selective',
    groups: [
      { label: '❤️ Fans', color: '#ff6eb4' },
      { label: '💳 Subscribers', color: '#b496ff' },
      { label: '🐳 Whale Spenders', color: '#ffd700' },
      { label: '🆓 Free Tier', color: '#545468' }
    ]
  },
  dj: {
    icon: '🎧', name: 'DJ / Artist', privacy: 'selective',
    groups: [
      { label: '🔥 Day Ones', color: '#ff6eb4' },
      { label: '🎉 Event Fans', color: '#b496ff' },
      { label: '🏢 Booking Agents', color: '#ffd700' },
      { label: '🆕 New Connects', color: '#64ffda' }
    ]
  },
  host: {
    icon: '🍾', name: 'VIP Host / Bottle Girl', privacy: 'selective',
    groups: [
      { label: '💸 Big Tippers', color: '#ffd700' },
      { label: '💼 Corporate', color: '#b496ff' },
      { label: '🎂 Birthdays', color: '#ff6eb4' },
      { label: '🔄 Regulars', color: '#64ffda' }
    ]
  },
  talent: {
    icon: '💼', name: 'Talent Manager / Agent', privacy: 'selective',
    groups: [
      { label: '⭐ Talent', color: '#ffd700' },
      { label: '🏛️ Venues', color: '#64ffda' },
      { label: '🤝 Clients', color: '#b496ff' },
      { label: '🎯 Prospects', color: '#ff6eb4' }
    ]
  },
  club: {
    icon: '🏛️', name: 'Club Owner / Manager', privacy: 'open',
    groups: [
      { label: '💼 Staff', color: '#64ffda' },
      { label: '🎧 DJs', color: '#b496ff' },
      { label: '💃 Performers', color: '#ff6eb4' },
      { label: '🍾 VIP Clients', color: '#ffd700' },
      { label: '🚪 Security', color: '#545468' }
    ]
  }
}

const PLANS = {
  free:     { icon: '🆓', name: 'Free',     price: 0,     label: 'Free Plan' },
  basic:    { icon: '💜', name: 'Basic',    price: 9.99,  label: 'Basic — $9.99/mo' },
  vip:      { icon: '👑', name: 'VIP',      price: 19.99, label: 'VIP — $19.99/mo' },
  business: { icon: '🏛️', name: 'Business', price: 49.99, label: 'Business — $49.99/mo' }
}

const PLAN_LIMITS = {
  free:     { contacts: 10, groups: 3, profiles: 1, media: ['text'], scheduling: false, tipjar: false, blacklist: false, club: false, reports: ['current'] },
  basic:    { contacts: 100, groups: Infinity, profiles: 2, media: ['text','image'], scheduling: true, tipjar: 'basic', blacklist: false, club: false, reports: ['current','weekly','monthly'] },
  vip:      { contacts: Infinity, groups: Infinity, profiles: 3, media: ['text','image','video','voice'], scheduling: true, tipjar: 'full', blacklist: true, club: false, reports: ['current','weekly','monthly','yearly'] },
  business: { contacts: Infinity, groups: Infinity, profiles: Infinity, media: ['text','image','video','voice'], scheduling: true, tipjar: 'full', blacklist: true, club: true, reports: ['current','weekly','monthly','yearly'] }
}

// Generate referral code: firstname + 4 random digits
function generateReferralCode(fullName) {
  const first = (fullName || 'user').split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
  const digits = Math.floor(1000 + Math.random() * 9000)
  return first + digits
}

// Get current user and profile
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

async function getSubscription(userId) {
  const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single()
  return data
}

// Check if feature is allowed for a given plan
function canAccess(plan, feature) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  return limits[feature]
}

// Show upgrade prompt modal
function showUpgradeModal(featureName, requiredPlan) {
  const existing = document.getElementById('upgradeModal')
  if (existing) existing.remove()

  const planInfo = PLANS[requiredPlan] || PLANS.basic
  const modal = document.createElement('div')
  modal.id = 'upgradeModal'
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.84);backdrop-filter:blur(12px);z-index:500;display:flex;align-items:flex-end;justify-content:center'
  modal.innerHTML = `
    <div style="background:#0b0b17;border:1px solid rgba(255,255,255,.055);border-radius:22px 22px 0 0;width:100%;max-width:430px;padding:26px;padding-bottom:44px">
      <div style="width:38px;height:4px;border-radius:2px;background:rgba(255,255,255,.055);margin:0 auto 20px"></div>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:36px;margin-bottom:10px">🔒</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:300;margin-bottom:6px">${featureName}</div>
        <div style="font-size:11px;color:#545468;line-height:1.6">This feature requires the <span style="color:#b496ff">${planInfo.label}</span> or higher.</div>
      </div>
      <div style="background:rgba(180,150,255,.07);border:1px solid rgba(180,150,255,.2);border-radius:13px;padding:14px;margin-bottom:14px">
        <div style="font-size:10px;color:#545468;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Get it FREE instead</div>
        <div style="font-size:12px;color:#b496ff">Refer 5 friends on ${planInfo.name} plan and upgrade at no cost. Keep them active and stay upgraded every month.</div>
      </div>
      <button onclick="window.location.href='billing.html'" style="width:100%;padding:15px;border-radius:12px;background:linear-gradient(135deg,#b496ff,#ff6eb4);border:none;color:#fff;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;margin-bottom:10px">Upgrade Now ↗</button>
      <button onclick="document.getElementById('upgradeModal').remove()" style="width:100%;padding:13px;border-radius:12px;background:transparent;border:1px solid rgba(255,255,255,.055);color:#545468;font-family:'DM Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;cursor:pointer">Maybe Later</button>
    </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}
