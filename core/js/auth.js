import { resetGlobalState } from './state.js';
import { launchApp } from './app.js';
import { db, progId } from './state.js';

export const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co';
export const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco';
export const supa     = supabase.createClient(SUPA_URL, SUPA_KEY);
export let   currentUser = null;
export function setCurrentUser(val) { currentUser = val; }

export async function doLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');
  const err      = document.getElementById('loginErr');
  err.style.display = 'none';
  if (!email || !password) { showLoginErr('Please enter your email and password.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = 'Sign in';
  if (error) { showLoginErr(error.message); return; }
  currentUser = data.user;
  launchApp();
}

function showLoginErr(msg) {
  const e = document.getElementById('loginErr');
  e.textContent = msg; e.style.display = 'block';
}

export async function doLogout() {
  await supa.auth.signOut();
  currentUser = null;
  // Note: These will need to be updated via state.js setters or re-assigned if exported as let
  // For now, we assume we can re-assign them if they are imported as let (which they aren't, they are read-only)
  // We'll need to fix this in state.js or provide a resetState function.
  // UPDATE: ES6 imports are read-only live bindings.
  resetGlobalState(); 
  document.getElementById('appShell').style.display   = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPassword').value = '';
}
