// Product Management Page
// Orchestrator for products portal (list, trends, families)

function renderProductManagement() {
  const html = renderProductsPortalHTML();

  // Schedule setup after render
  setTimeout(() => {
    renderProductsPortalSetup();
  }, 100);

  return html;
}
