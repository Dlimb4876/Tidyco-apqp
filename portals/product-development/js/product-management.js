import { renderProductsPortalHTML, renderProductsPortalSetup } from './product-management/js/products.js';

// ── Product Management Portal Bridge ───────────────────────
export function renderProductManagement() {
  const html = renderProductsPortalHTML();

  // Schedule setup after render
  setTimeout(() => {
    renderProductsPortalSetup();
  }, 100);

  return html;
}
