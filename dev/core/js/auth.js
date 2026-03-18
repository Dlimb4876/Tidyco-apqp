// ═══════════════════════════════════
// auth.js — Supabase authentication
// Depends on: state.js (currentUser), db.js (launchApp via app.js)
// ═══════════════════════════════════

const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco';
const supa     = supabase.createClient(SUPA_URL, SUPA_KEY);
let   currentUser = null;

async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');
  const err      = document.getElementById('loginErr');
  err.style.display = 'none';
  if (!email || !password) { showLoginErr('Please enter your email and password.'); return; }
  if (!email.endsWith('@tidyco.co.uk')) { showLoginErr('Please use your @tidyco.co.uk email address.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = 'Sign in';
  if (error) { showLoginErr(error.message); return; }
  currentUser = data.user;
  // Load role from profiles table; default to 'editor' if no profile row found
  try {
    const { data: profile } = await supa
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();
    currentUserRole = profile?.role || 'editor';
  } catch (_) {
    currentUserRole = 'editor';
  }
  launchApp();
}

function showLoginErr(msg) {
  const e = document.getElementById('loginErr');
  e.textContent = msg; e.style.display = 'block';
}

async function doLogout() {
  await supa.auth.signOut();
  currentUser = null;
  currentUserRole = null;
  db = { projects: [] }; progId = null;
  document.getElementById('appShell').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}
