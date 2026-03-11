// Product Management Page
function renderProductManagement() {
  const html = renderProductsPortalHTML();

  // Schedule setup after render
  setTimeout(() => {
    renderProductsPortalSetup();
  }, 100);

  return html;
}
