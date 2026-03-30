// ═══════════════════════════════════
// supa.js — Supabase client and session state
// ═══════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { SUPA_URL, SUPA_KEY } from './config.public.js'

export const supabase = createClient(SUPA_URL, SUPA_KEY)

export let currentUser = null

export function setCurrentUser(u) {
  currentUser = u
  globalThis.currentUser = u
}
