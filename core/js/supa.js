// ═══════════════════════════════════
// supa.js — Supabase client and session state
// ═══════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'https://eihxvmzsfnpdaizggsvs.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHh2bXpzZm5wZGFpemdnc3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTc2OTMsImV4cCI6MjA4ODM3MzY5M30.edpoNia_4nGRwUBwVAFrKXgyB3SnhH_umU2mcNTBIco'

export const supabase = createClient(SUPA_URL, SUPA_KEY)

export let currentUser = null

export function setCurrentUser(u) {
  currentUser = u
  globalThis.currentUser = u
}
