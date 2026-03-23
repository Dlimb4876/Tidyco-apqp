// ═══════════════════════════════════════════════════════════════
// network.js — Network connectivity detection
// Shows browser online/offline + Supabase health check
// Depends on: db.js (supa), bottombar element
// ═══════════════════════════════════════════════════════════════

let isSupabaseHealthy = true;
let networkCheckInterval = null;

/**
 * Check if Supabase is reachable with a minimal query
 */
async function checkSupabaseHealth() {
  try {
    const { error } = await supa
      .from('teams')
      .select('id', { count: 'exact' })
      .limit(1);

    isSupabaseHealthy = !error;
  } catch (e) {
    isSupabaseHealthy = false;
  }
  updateNetworkStatus();
}

/**
 * Update bottombar network indicator based on browser + Supabase state
 */
function updateNetworkStatus() {
  const el = document.getElementById('bottombarNetwork');
  if (!el) return;

  // Offline: No internet at all
  if (!navigator.onLine) {
    el.className = 'bottombar-status offline';
    el.textContent = '📡 offline';
    el.title = 'No internet connection — changes will sync when reconnected';
    return;
  }

  // Reconnecting: Internet OK but Supabase unreachable
  if (!isSupabaseHealthy) {
    el.className = 'bottombar-status offline';
    el.textContent = '⚠️ reconnecting…';
    el.title = 'Internet OK but unable to reach Supabase — retrying…';
    return;
  }

  // Online: Everything good
  el.className = 'bottombar-status';
  el.textContent = '📡 online';
  el.title = 'Connected to Supabase';
}

/**
 * Start network detection: browser API + periodic Supabase health checks
 */
function setupNetworkDetection() {
  // Initial status check
  updateNetworkStatus();

  // Browser online/offline events (instant feedback)
  window.addEventListener('online', () => {
    isSupabaseHealthy = true;
    updateNetworkStatus();
    // Immediately check Supabase when coming back online
    checkSupabaseHealth();
  });

  window.addEventListener('offline', updateNetworkStatus);

  // Periodic Supabase health check (every 30 seconds)
  // Only if browser thinks we're online
  if (networkCheckInterval) clearInterval(networkCheckInterval);
  networkCheckInterval = setInterval(() => {
    if (navigator.onLine) {
      checkSupabaseHealth();
    }
  }, 30000);
}

/**
 * Stop network detection (cleanup)
 */
function teardownNetworkDetection() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
  window.removeEventListener('online', updateNetworkStatus);
  window.removeEventListener('offline', updateNetworkStatus);
}
