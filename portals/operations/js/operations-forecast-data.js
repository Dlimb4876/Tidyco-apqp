// =============================================================
// operations-forecast-data.js - Operations forecast opportunities
// Depends on: auth.js, realtime.js (subscriptions wired by operations-dashboard.js)
// =============================================================

const OPS_FORECAST_TABLE = 'operations_forecast_opportunities';
const OPS_FORECAST_FALLBACK_KEY = 'opsForecastRows';
const OPS_FORECAST_ACTIVE_STATUSES = ['identified', 'quoted', 'negotiation', 'won', 'active'];

function opsForecastToNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function opsForecastClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function opsForecastNormStatus(status) {
  const raw = (status || '').toString().trim().toLowerCase();
  return raw || 'identified';
}

function opsForecastParseDate(raw) {
  if (!raw) return null;
  const d = new Date(String(raw) + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function opsForecastNormalizeRow(row) {
  return {
    id: row.id || ('tmp_' + Math.random().toString(36).slice(2, 8)),
    title: (row.title || '').toString().trim(),
    owner: (row.owner || '').toString().trim(),
    status: opsForecastNormStatus(row.status),
    work_area: (row.work_area || '').toString().trim() || 'Unassigned',
    start_date: row.start_date || '',
    due_date: row.due_date || '',
    total_hours: opsForecastToNumber(row.total_hours, 0),
    probability_pct: opsForecastClamp(opsForecastToNumber(row.probability_pct, 0), 0, 100),
    notes: (row.notes || '').toString().trim(),
    user_id: row.user_id || null,
    created_by_name: (row.created_by_name || '').toString(),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

function opsForecastIsActiveStatus(status) {
  return OPS_FORECAST_ACTIVE_STATUSES.includes(opsForecastNormStatus(status));
}

function opsForecastBuildWeightedMatrix(monthKeys, rows) {
  const matrix = {};
  const safeRows = Array.isArray(rows) ? rows : [];

  monthKeys.forEach(key => {
    matrix[key] = { _total: 0 };
  });

  safeRows.forEach(row => {
    if (!opsForecastIsActiveStatus(row.status)) return;

    const start = opsForecastParseDate(row.start_date);
    const end = opsForecastParseDate(row.due_date);
    if (!start || !end || start > end) return;

    const totalHours = Math.max(0, opsForecastToNumber(row.total_hours, 0));
    const probability = opsForecastClamp(opsForecastToNumber(row.probability_pct, 0), 0, 100) / 100;
    const weightedTotalHours = totalHours * probability;
    if (weightedTotalHours <= 0) return;

    const totalDays = Math.max(1, ((end - start) / 86400000) + 1);
    const workArea = (row.work_area || 'Unassigned').toString();

    monthKeys.forEach(key => {
      const parts = key.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      if (!year || !month) return;

      const mStart = new Date(year, month - 1, 1);
      const mEnd = new Date(year, month, 0);

      const overlapStart = start > mStart ? start : mStart;
      const overlapEnd = end < mEnd ? end : mEnd;
      if (overlapStart > overlapEnd) return;

      const overlapDays = ((overlapEnd - overlapStart) / 86400000) + 1;
      const monthHours = weightedTotalHours * (overlapDays / totalDays);

      if (!matrix[key][workArea]) matrix[key][workArea] = 0;
      matrix[key][workArea] += monthHours;
      matrix[key]._total += monthHours;
    });
  });

  return matrix;
}

window.opsForecastManager = {
  state: {
    rows: [],
    ready: false,
    mode: 'remote',
    lastError: ''
  },

  _publishChange() {
    document.dispatchEvent(new CustomEvent('opsForecastChanged'));
  },

  _loadFallbackRows() {
    try {
      const raw = localStorage.getItem(OPS_FORECAST_FALLBACK_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      this.state.rows = Array.isArray(parsed) ? parsed.map(opsForecastNormalizeRow) : [];
      this.state.mode = 'local';
    } catch (err) {
      this.state.rows = [];
      this.state.mode = 'local';
      console.warn('Could not read local forecast fallback:', err && err.message ? err.message : err);
    }
  },

  _saveFallbackRows() {
    try {
      localStorage.setItem(OPS_FORECAST_FALLBACK_KEY, JSON.stringify(this.state.rows));
    } catch (err) {
      console.warn('Could not save local forecast fallback:', err && err.message ? err.message : err);
    }
  },

  async reload() {
    if (!currentUser || !supa) {
      this._loadFallbackRows();
      this.state.ready = true;
      this._publishChange();
      return this.state.rows;
    }

    try {
      const { data, error } = await supa
        .from(OPS_FORECAST_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.state.rows = Array.isArray(data) ? data.map(opsForecastNormalizeRow) : [];
      this.state.ready = true;
      this.state.mode = 'remote';
      this.state.lastError = '';
      this._publishChange();
      return this.state.rows;
    } catch (err) {
      this.state.lastError = err && err.message ? err.message : String(err);
      this._loadFallbackRows();
      this.state.ready = true;
      this._publishChange();
      return this.state.rows;
    }
  },

  async init() {
    return this.reload();
  },

  getRows() {
    return Array.isArray(this.state.rows) ? this.state.rows : [];
  },

  getActiveRows() {
    return this.getRows().filter(row => opsForecastIsActiveStatus(row.status));
  },

  async upsertOpportunity(payload) {
    const normalized = opsForecastNormalizeRow(payload || {});
    const nowIso = new Date().toISOString();
    normalized.updated_at = nowIso;

    const idx = this.state.rows.findIndex(row => row.id === normalized.id);
    if (idx >= 0) {
      this.state.rows[idx] = { ...this.state.rows[idx], ...normalized };
    } else {
      this.state.rows.unshift(normalized);
    }

    this._publishChange();

    if (!currentUser || !supa) {
      this._saveFallbackRows();
      return normalized;
    }

    const payloadForDb = {
      title: normalized.title,
      owner: normalized.owner,
      status: normalized.status,
      work_area: normalized.work_area,
      start_date: normalized.start_date || null,
      due_date: normalized.due_date || null,
      total_hours: normalized.total_hours,
      probability_pct: normalized.probability_pct,
      notes: normalized.notes,
      updated_at: nowIso,
      user_id: currentUser.id,
      created_by_name: currentUser.email || ''
    };

    try {
      if (normalized.id && !String(normalized.id).startsWith('tmp_')) {
        const { data, error } = await supa
          .from(OPS_FORECAST_TABLE)
          .update(payloadForDb)
          .eq('id', normalized.id)
          .select()
          .single();
        if (error) throw error;

        const updateIndex = this.state.rows.findIndex(row => row.id === normalized.id);
        if (updateIndex >= 0 && data) this.state.rows[updateIndex] = opsForecastNormalizeRow(data);
      } else {
        payloadForDb.created_at = nowIso;
        const { data, error } = await supa
          .from(OPS_FORECAST_TABLE)
          .insert([payloadForDb])
          .select()
          .single();
        if (error) throw error;

        if (data) {
          const tempIndex = this.state.rows.findIndex(row => row.id === normalized.id);
          if (tempIndex >= 0) this.state.rows[tempIndex] = opsForecastNormalizeRow(data);
        }
      }

      this.state.mode = 'remote';
      this.state.lastError = '';
      this._publishChange();
      return normalized;
    } catch (err) {
      this.state.lastError = err && err.message ? err.message : String(err);
      this.state.mode = 'local';
      this._saveFallbackRows();
      this._publishChange();
      return normalized;
    }
  },

  async deleteOpportunity(id) {
    const before = this.state.rows;
    this.state.rows = before.filter(row => row.id !== id);
    this._publishChange();

    if (!currentUser || !supa) {
      this._saveFallbackRows();
      return true;
    }

    try {
      if (!String(id).startsWith('tmp_')) {
        const { error } = await supa.from(OPS_FORECAST_TABLE).delete().eq('id', id);
        if (error) throw error;
      }

      this.state.mode = 'remote';
      this.state.lastError = '';
      this._publishChange();
      return true;
    } catch (err) {
      this.state.rows = before;
      this.state.mode = 'local';
      this.state.lastError = err && err.message ? err.message : String(err);
      this._saveFallbackRows();
      this._publishChange();
      return false;
    }
  }
};

window.opsForecastBuildWeightedMatrix = opsForecastBuildWeightedMatrix;
window.opsForecastIsActiveStatus = opsForecastIsActiveStatus;
