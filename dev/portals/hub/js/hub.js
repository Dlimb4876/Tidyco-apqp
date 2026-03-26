// js/features/hub.js

const HUB_FAVOURITES_STORAGE_PREFIX = 'tidyco_favourites_v1_';
const HUB_MAX_PAGE_FAVOURITES = 4;
const HUB_MAX_PRODUCT_FAVOURITES = 4;

const HUB_FAVOURITE_PAGES = {
  capacity: { label: 'Capacity', icon: '📊' },
  'capacity::production': { label: 'Capacity - Production', icon: '🚂' },
  'capacity::me': { label: 'Capacity - ME', icon: '🧑‍🔧' },
  'capacity::projects': { label: 'Capacity - Projects', icon: '📅' },
  'product-development': { label: 'Product Development', icon: '🚀' },
  'product-development::npi': { label: 'NPI Projects', icon: '📋' },
  'product-development::product-management': { label: 'Product Management', icon: '📦' },
  'product-development::product-family-db': { label: 'Product Families', icon: '🏢' },
  'product-development::parts-database': { label: 'Parts Database', icon: '🔩' },
  production: { label: 'Production', icon: '🏭' },
  'production::scheduling': { label: 'Production - Schedule', icon: '📅' },
  'production::by-product': { label: 'Production - Plan by Product', icon: '📋' },
  'production::by-unit': { label: 'Production - Plan by Work Area', icon: '🏭' },
  operations: { label: 'Operations', icon: '🛰️' },
  mcs: { label: 'Manufacturing Change', icon: '🔧' },
  'action-centre': { label: 'My Actions', icon: '✅' },
  feedback: { label: 'Feedback & Bugs', icon: '💬' }
};

function hubGetCurrentUserEmailForFavourites() {
  const email = (typeof currentUser !== 'undefined' && currentUser && currentUser.email)
    ? String(currentUser.email).trim().toLowerCase()
    : 'anonymous';
  return email || 'anonymous';
}

function hubGetFavouritesStorageKey() {
  return HUB_FAVOURITES_STORAGE_PREFIX + hubGetCurrentUserEmailForFavourites();
}

function hubDefaultFavourites() {
  return {
    version: 1,
    pages: [],
    products: [],
    updatedAt: new Date().toISOString()
  };
}

function hubNormaliseFavourites(raw) {
  const clean = hubDefaultFavourites();
  if (!raw || typeof raw !== 'object') return clean;

  if (Array.isArray(raw.pages)) {
    const pageSet = new Set();
    raw.pages.forEach((id) => {
      const key = String(id || '').trim();
      if (!key || !HUB_FAVOURITE_PAGES[key]) return;
      pageSet.add(key);
    });
    clean.pages = Array.from(pageSet).slice(0, HUB_MAX_PAGE_FAVOURITES);
  }

  if (Array.isArray(raw.products)) {
    const productSet = new Set();
    raw.products.forEach((id) => {
      const key = String(id || '').trim();
      if (!key) return;
      productSet.add(key);
    });
    clean.products = Array.from(productSet).slice(0, HUB_MAX_PRODUCT_FAVOURITES);
  }

  clean.updatedAt = raw.updatedAt || clean.updatedAt;
  return clean;
}

function hubLoadFavourites() {
  try {
    const raw = localStorage.getItem(hubGetFavouritesStorageKey());
    if (!raw) return hubDefaultFavourites();
    return hubNormaliseFavourites(JSON.parse(raw));
  } catch (err) {
    return hubDefaultFavourites();
  }
}

function hubSaveFavourites(next) {
  const clean = hubNormaliseFavourites({
    ...next,
    updatedAt: new Date().toISOString()
  });
  try {
    localStorage.setItem(hubGetFavouritesStorageKey(), JSON.stringify(clean));
  } catch (err) {
    // Ignore quota/storage access failures and keep the UI usable.
  }
  return clean;
}

function hubGetFavouriteProducts() {
  const products = typeof productsDataGetAll === 'function' ? (productsDataGetAll() || []) : [];
  const byId = new Map(products.map((p) => [String(p.id), p]));
  const favourites = hubLoadFavourites();
  const items = [];
  const staleIds = [];

  favourites.products.forEach((id) => {
    const product = byId.get(String(id));
    if (!product) {
      staleIds.push(id);
      return;
    }
    items.push(product);
  });

  if (staleIds.length > 0) {
    const staleSet = new Set(staleIds.map((x) => String(x)));
    const kept = favourites.products.filter((id) => !staleSet.has(String(id)));
    hubSaveFavourites({ ...favourites, products: kept });
  }

  return items;
}

function hubIsPageFavourite(section) {
  return hubLoadFavourites().pages.includes(section);
}

function hubIsProductFavourite(productId) {
  return hubLoadFavourites().products.includes(String(productId || ''));
}

function hubTogglePageFavourite(section, evt) {
  if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
  if (!HUB_FAVOURITE_PAGES[section]) return;

  const favourites = hubLoadFavourites();
  const set = new Set(favourites.pages);
  if (set.has(section)) set.delete(section);
  else set.add(section);

  const pages = Array.from(set).slice(0, HUB_MAX_PAGE_FAVOURITES);
  hubSaveFavourites({ ...favourites, pages });
  if (typeof render === 'function') render();
}

function hubToggleProductFavourite(productId, evt) {
  if (evt && typeof evt.stopPropagation === 'function') evt.stopPropagation();
  const key = String(productId || '').trim();
  if (!key) return;

  const favourites = hubLoadFavourites();
  const set = new Set(favourites.products);
  if (set.has(key)) set.delete(key);
  else set.add(key);

  const products = Array.from(set).slice(0, HUB_MAX_PRODUCT_FAVOURITES);
  hubSaveFavourites({ ...favourites, products });
  if (typeof render === 'function') render();
}

function hubOpenFavouriteProduct(productId) {
  const key = String(productId || '').trim();
  if (!key) return;

  const project = typeof findProjectByProductId === 'function'
    ? findProjectByProductId(key)
    : (Array.isArray(db?.projects) ? db.projects.find((p) => String(p.product_id || '') === key) : null);

  if (project && npi && npi.dashboard && typeof npi.dashboard.openProjectOrRender === 'function') {
    npi.dashboard.openProjectOrRender(project.id);
    return;
  }

  if (typeof setProductDevelopmentTab === 'function') {
    setProductDevelopmentTab('npi');
  }
  if (typeof navigate === 'function') navigate('product-development');
}

function hubOpenFavouritePage(pageKey) {
  if (!HUB_FAVOURITE_PAGES[pageKey]) return;
  if (typeof canViewPageKey === 'function' && !canViewPageKey(pageKey)) return;

  if (pageKey.startsWith('capacity::')) {
    const tab = pageKey.split('::')[1] || 'root';
    if (currentSection !== 'capacity' && typeof navigate === 'function') {
      navigate('capacity');
    }
    if (typeof setCapacityTab === 'function') {
      setCapacityTab(tab);
      return;
    }
    if (typeof navigate === 'function') navigate('capacity');
    return;
  }

  if (pageKey.startsWith('product-development::')) {
    const tab = pageKey.split('::')[1] || 'root';
    if (currentSection !== 'product-development' && typeof navigate === 'function') {
      navigate('product-development');
    }
    if (typeof setProductDevelopmentTab === 'function') {
      setProductDevelopmentTab(tab);
      return;
    }
    if (typeof navigate === 'function') navigate('product-development');
    return;
  }

  if (pageKey.startsWith('production::')) {
    const tab = pageKey.split('::')[1] || 'root';
    if (currentSection !== 'production' && typeof navigate === 'function') {
      navigate('production');
    }
    if (typeof setProductionTab === 'function') {
      setProductionTab(tab);
      return;
    }
    if (typeof navigate === 'function') navigate('production');
    return;
  }

  if (typeof navigate === 'function') navigate(pageKey);
}

function renderHubFavouritesPanel() {
  const favourites = hubLoadFavourites();
  const pageItems = favourites.pages
    .map((section) => {
      const meta = HUB_FAVOURITE_PAGES[section];
      if (!meta) return '';
      if (typeof canViewPageKey === 'function' && !canViewPageKey(section)) return '';
      return `<button class="hub-fav-page" onclick="hubOpenFavouritePage('${section}')" title="Open ${esc(meta.label)}">${meta.icon} ${esc(meta.label)}</button>`;
    })
    .filter(Boolean)
    .join('');

  const productItems = hubGetFavouriteProducts();
  const productHtml = productItems
    .map((product) => {
      const name = product.name || 'Unnamed Product';
      const status = product.status || 'Tender';
      const hasProject = typeof findProjectByProductId === 'function' ? !!findProjectByProductId(product.id) : false;
      return `<button class="hub-fav-product" onclick="hubOpenFavouriteProduct('${esc(product.id)}')" title="Open ${esc(name)} in NPI">
        <span class="hub-fav-product-name">${esc(name)}</span>
        <span class="hub-fav-product-meta">${esc(status)}${hasProject ? ' · NPI' : ''}</span>
      </button>`;
    })
    .join('');

  if (!pageItems && !productHtml) {
    return `<div class="hub-favs-panel">
      <div class="hub-favs-head">⭐ My Favourites</div>
      <div class="hub-favs-empty">No favourites yet. Star pages or NPI products for quick access.</div>
    </div>`;
  }

  return `<div class="hub-favs-panel">
    <div class="hub-favs-head">⭐ My Favourites</div>
    ${pageItems ? `<div class="hub-favs-lane"><div class="hub-favs-lane-title">Pages</div><div class="hub-favs-pages">${pageItems}</div></div>` : ''}
    ${productHtml ? `<div class="hub-favs-lane"><div class="hub-favs-lane-title">NPI Products</div><div class="hub-favs-products">${productHtml}</div></div>` : ''}
  </div>`;
}

function renderHubCard(section, icon, title, meta) {
  if (typeof canViewPageKey === 'function' && !canViewPageKey(section)) return '';
  const isFav = hubIsPageFavourite(section);
  return `<div class="proj-card hub-card" onclick="navigate('${section}')">
    <button
      class="hub-fav-toggle${isFav ? ' is-active' : ''}"
      type="button"
      title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
      onclick="hubTogglePageFavourite('${section}', event)">
      ${isFav ? '★' : '☆'}
    </button>
    <div class="hub-card-content">
      <div class="hub-icon">${icon}</div>
      <div class="proj-card-name">${title}</div>
      <div class="proj-card-meta">${meta}</div>
    </div>
  </div>`;
}

window.hubIsProductFavourite = hubIsProductFavourite;
window.hubToggleProductFavourite = hubToggleProductFavourite;
window.hubTogglePageFavourite = hubTogglePageFavourite;
window.hubOpenFavouritePage = hubOpenFavouritePage;
window.hubOpenFavouriteProduct = hubOpenFavouriteProduct;

// ─────────────────────────────────────────────────────────────
// Hub widget helpers
// ─────────────────────────────────────────────────────────────

// Triggered after renderHub() paints the DOM so the action widget can
// load data without blocking the initial paint.
function hubInit() {
  if (typeof actionCentreLoad === 'function' && !actionCentreLoading && !actionCentreData) {
    actionCentreLoad();
  }
}

// Builds the "logged in as / my actions summary" widget shown at the top
// of the hub portal. Gracefully degrades when action data is not yet loaded.
function renderHubActionWidget() {
  const name = typeof actionCentreGetMyName === 'function'
    ? actionCentreGetMyName()
    : (typeof currentUser !== 'undefined' && currentUser
        ? (typeof emailToDisplayName === 'function' ? emailToDisplayName(currentUser.email) : currentUser.email)
        : '');

  let summaryHTML = '';
  let pendingApprovalCount = 0;

  if (actionCentreLoading) {
    summaryHTML = `<span class="hub-widget-loading">Loading actions…</span>`;
  } else if (actionCentreData && !actionCentreData.error) {
    const { actions = [], pfmea = [], risks = [], mcsApprovals = [] } = actionCentreData;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const totalOpen =
      actions.filter(a => a.status !== 'Closed').length +
      pfmea.length +
      risks.filter(r => r.status !== 'Closed').length;

    const totalOverdue =
      actions.filter(a => a.due_date && a.status !== 'Closed' && new Date(a.due_date) < today).length +
      pfmea.filter(p => p.action_due && new Date(p.action_due) < today).length;

    pendingApprovalCount = mcsApprovals.length;

    summaryHTML = `
      <div class="hub-widget-stats">
        <div class="hub-widget-stat">
          <span class="hub-widget-num">${totalOpen}</span>
          <span class="hub-widget-label">open</span>
        </div>
        <div class="hub-widget-stat">
          <span class="hub-widget-num${totalOverdue > 0 ? ' hub-widget-overdue' : ''}">${totalOverdue}</span>
          <span class="hub-widget-label">overdue</span>
        </div>
        ${pendingApprovalCount > 0 ? `
        <div class="hub-widget-stat">
          <span class="hub-widget-num hub-widget-pending">${pendingApprovalCount}</span>
          <span class="hub-widget-label">pending approval</span>
        </div>` : ''}
      </div>`;
  }

  return `
    <div class="hub-widget">
      <div class="hub-widget-user">
        <span class="hub-widget-avatar">👤</span>
        <div class="hub-widget-user-text">
          <div class="hub-widget-greeting">Logged in as</div>
          <div class="hub-widget-name">${esc(name)}</div>
        </div>
      </div>
      ${summaryHTML ? `<div class="hub-widget-sep"></div><div class="hub-widget-summary">${summaryHTML}</div>` : ''}
      <div class="hub-widget-cta">
        <button class="btn btn-primary btn-sm" onclick="navigate('action-centre')">✅ My Actions →</button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────
// Hub render
// ─────────────────────────────────────────────────────────────

function renderHub() {
  const cards = [
    renderHubCard('capacity', '📊', 'CAPACITY', 'Load Capacity Planning'),
    renderHubCard('product-development', '🚀', 'PRODUCT DEVELOPMENT', 'NPI & Product Management'),
    renderHubCard('production', '🏭', 'PRODUCTION', 'Batch Scheduling & Planning'),
    renderHubCard('operations', '🛰️', 'OPERATIONS DASHBOARD', 'Unified overview of all operations, metrics, and risks'),
    renderHubCard('mcs', '🔧', 'MANUFACTURING CHANGE', 'Engineering Change Requests & Approvals')
  ].filter(Boolean).join('');

  return `
    <div class="proj-home hub-home">
      ${renderHubActionWidget()}
      ${renderHubFavouritesPanel()}

      <div class="proj-home-header">
        <div>
          <div class="proj-home-title">Tidyco Operations Portal</div>
          <div class="proj-home-sub">Quality Planning, Production & Operations Control</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="showGuide('hub')" title="User Guide">❓ Guide</button>
      </div>

      <div class="proj-cards hub-grid">
        ${cards || `<div class="hub-favs-empty">No portal shortcuts are available for your current permissions.</div>`}
      </div>
    </div>`;
}
