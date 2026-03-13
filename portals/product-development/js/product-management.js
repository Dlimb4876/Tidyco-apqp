// Product Management Page
// Orchestrator for products portal (list, trends, families)

function renderProductManagement() {
  const html = renderProductsPortalHTML();

  // Use double-rAF to run setup after DOM is committed, avoiding the
  // race condition where a re-render within a fixed timeout would replace
  // the DOM before setup could attach event listeners and populate tabs.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderProductsPortalSetup();
    });
  });

  return html;
}
