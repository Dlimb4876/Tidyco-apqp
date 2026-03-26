// ═══════════════════════════════════
// me-hub-auth.js — Supabase auth for ME Department Hub
// ═══════════════════════════════════

const HUB_SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co';
const HUB_SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco';

const hubSupa = supabase.createClient(HUB_SUPA_URL, HUB_SUPA_KEY);
let hubCurrentUser = null;

// ─────────────────────────────────────────────────────────────
// BOOT — check existing session then wire up login form
// ─────────────────────────────────────────────────────────────
async function hubAuthBoot() {
  const { data: { session } } = await hubSupa.auth.getSession();
  if (session) {
    hubCurrentUser = session.user;
    // Also set global for data layer access
    if (typeof window.hubCurrentUser !== 'undefined') {
      window.hubCurrentUser = session.user;
    }
    hubShowApp();
  } else {
    hubShowLogin();
  }
}

function hubShowLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
}

function hubShowApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  const nameEl = document.getElementById('hubUserName');
  if (nameEl && hubCurrentUser) {
    nameEl.textContent = hubCurrentUser.email;
  }
  hubAppInit();
}

// ─────────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');

  errEl.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { data, error } = await hubSupa.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Sign In';

  if (error) {
    errEl.textContent = error.message;
    errEl.classList.remove('hidden');
    return;
  }

  hubCurrentUser = data.user;
  // Also set global for data layer access
  if (typeof window.hubCurrentUser !== 'undefined') {
    window.hubCurrentUser = data.user;
  }
  hubShowApp();
});

// ─────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────
async function hubSignOut() {
  await hubSupa.auth.signOut();
  hubCurrentUser = null;
  hubShowLogin();
}

// Boot
hubAuthBoot();
