(function() {
  function buildNav(areas, activePath) {
    const nav = document.getElementById("wikiNav");
    if (!nav) return;

    const parts = String(activePath || "").split("/");
    const activeArea = parts[0] || "";

    nav.innerHTML = areas.map(function(area) {
      const openAttr = area.id === activeArea ? " open" : "";
      const items = (area.topics || []).map(function(topic) {
        const path = area.id + "/" + topic.file;
        const activeClass = path === activePath ? "is-active" : "";
        return '<a class="' + activeClass + '" href="#' + path + '">' + topic.title + '</a>';
      }).join("");

      return '<details' + openAttr + '><summary>' + area.icon + ' ' + area.title + '</summary>' + items + '</details>';
    }).join("");
  }

  function toggleSidebar() {
    const nav = document.getElementById("wikiNav");
    const toggle = document.getElementById("wikiSidebarToggle");
    if (!nav || !toggle) return;

    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  window.wikiNav = {
    buildNav: buildNav,
    toggleSidebar: toggleSidebar
  };
})();
