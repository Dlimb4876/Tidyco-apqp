// Product Management Page
// Orchestrator for products portal (list, trends, families)

async function initProductManagement() {
  // Initialize families data if not already loaded
  if (typeof familiesDataInit === 'function' && !familiesState.loaded) {
    await familiesDataInit();
  }
}

function renderProductManagement() {
  // Initialize families data on first render
  initProductManagement();

  const html = renderProductsPortalHTML();

  // Schedule setup after render
  setTimeout(() => {
    renderProductsPortalSetup();
  }, 100);

  return html;
}
