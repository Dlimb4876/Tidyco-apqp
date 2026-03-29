// ═══════════════════════════════════
// auth.js — Supabase authentication
// Depends on: state.js (auth state), db.js (launchApp via app.js)
// ═══════════════════════════════════

import { supabase, currentUser, setCurrentUser } from './supa.js'
import {
  appState,
  setDb,
  currentUserRole,
  setCurrentUserRole,
  setCurrentUserPermissions,
  setCurrentUserTeams
} from './state.js'

export { supabase, currentUser, setCurrentUser }

export async function authLoadEffectivePermissions(userId, roleSlug) {
  const baseline = typeof getRoleBaselinePermissions === 'function'
    ? getRoleBaselinePermissions(roleSlug)
    : {}
  const resolved = { ...baseline }
  const assignedTeamIds = []

  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)

    if (!membershipsError && Array.isArray(memberships) && memberships.length > 0) {
      memberships
        .map(row => row.team_id)
        .filter(Boolean)
        .forEach(teamId => {
          if (!assignedTeamIds.includes(teamId)) assignedTeamIds.push(teamId)
        })
    }

    if (assignedTeamIds.length > 0) {
      const { data: grants, error: grantsError } = await supabase
        .from('team_permissions')
        .select('permission, allowed')
        .in('team_id', assignedTeamIds)

      if (!grantsError && Array.isArray(grants)) {
        grants.forEach(grant => {
          const key = typeof normalizePermissionKey === 'function'
            ? normalizePermissionKey(grant.permission)
            : grant.permission
          if (key) {
            resolved[key] = !!grant.allowed
          }
        })
      }
    }
  } catch (_) {
    // Keep baseline-only permissions if team tables are not yet available.
  }

  setCurrentUserPermissions(resolved)
  setCurrentUserTeams(assignedTeamIds)
}

export async function doLogin(launchApp) {
  const email = document.getElementById('loginEmail').value.trim()
  const password = document.getElementById('loginPassword').value
  const btn = document.getElementById('loginBtn')
  const err = document.getElementById('loginErr')
  err.style.display = 'none'
  if (!email || !password) { showLoginErr('Please enter your email and password.'); return }
  if (!email.endsWith('@tidyco.co.uk')) { showLoginErr('Please use your @tidyco.co.uk email address.'); return }
  btn.disabled = true
  btn.textContent = 'Signing in…'
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  btn.disabled = false
  btn.textContent = 'Sign in'
  if (error) { showLoginErr(error.message); return }
  setCurrentUser(data.user)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    setCurrentUserRole(profile?.role || 'editor')
  } catch (_) {
    setCurrentUserRole('editor')
  }

  await authLoadEffectivePermissions(data.user.id, currentUserRole)
  if (typeof launchApp === 'function') await launchApp()
}

export function showLoginErr(msg) {
  const e = document.getElementById('loginErr')
  e.textContent = msg
  e.style.display = 'block'
}

export async function doLogout() {
  setCurrentUser(null)
  setCurrentUserRole(null)
  setCurrentUserPermissions({})
  setCurrentUserTeams([])
  await supabase.auth.signOut()
  setDb({ projects: [] })
  appState.progId = null
  document.getElementById('appShell').style.display = 'none'
  document.getElementById('loginScreen').style.display = 'flex'
  document.getElementById('loginPassword').value = ''
}

supabase.auth.onAuthStateChange((event, _session) => {
  if (event === 'SIGNED_OUT' && currentUser !== null) {
    doLogout()
  }
})
