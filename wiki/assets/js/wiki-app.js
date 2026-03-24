(function() {
  const state = {
    areas: [],
    searchIndex: []
  };

  async function fetchJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Failed to load: " + path);
    return response.json();
  }

  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Failed to load: " + path);
    return response.text();
  }

  function getHashPath() {
    const raw = window.location.hash.replace(/^#/, "").trim();
    return raw || "getting-started/00-overview";
  }

  function getWikiBasePath() {
    const marker = "/wiki/";
    const path = String(window.location.pathname || "");
    const markerIndex = path.toLowerCase().indexOf(marker);
    if (markerIndex === -1) return "./";
    return path.slice(0, markerIndex + marker.length);
  }

  function toContentPath(hashPath) {
    return getWikiBasePath() + "content/" + hashPath + ".md";
  }

  async function renderCurrentTopic() {
    const hashPath = getHashPath();
    const contentEl = document.getElementById("wikiContent");
    if (!contentEl) return;

    try {
      const markdown = await fetchText(toContentPath(hashPath));
      contentEl.innerHTML = window.wikiRender.markdownToHtml(markdown);
      if (window.wikiNav) window.wikiNav.buildNav(state.areas, hashPath);
    } catch (error) {
      contentEl.innerHTML = "<h2>Topic not found</h2><p>Could not load <code>" + hashPath + "</code>.</p>";
    }
  }

  function wireSearch() {
    const input = document.getElementById("wikiSearch");
    const clearBtn = document.getElementById("wikiClearSearch");
    const panel = document.getElementById("wikiSearchResults");
    if (!input || !clearBtn || !panel) return;

    input.addEventListener("input", function() {
      const query = input.value;
      if (!query.trim()) {
        panel.hidden = true;
        panel.innerHTML = "";
        return;
      }
      const results = window.wikiSearch.search(state.searchIndex, query);
      window.wikiSearch.renderResults(results);
    });

    clearBtn.addEventListener("click", function() {
      input.value = "";
      panel.hidden = true;
      panel.innerHTML = "";
      input.focus();
    });

    panel.addEventListener("click", function(e) {
      if (e.target.closest("a")) {
        input.value = "";
        panel.hidden = true;
        panel.innerHTML = "";
      }
    });
  }

  function wireSidebarToggle() {
    const toggle = document.getElementById("wikiSidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function() {
      window.wikiNav.toggleSidebar();
    });
  }

  async function bootstrap() {
    const basePath = getWikiBasePath();
    state.areas = await fetchJson(basePath + "content/_meta/areas.json");
    state.searchIndex = await fetchJson(basePath + "content/_meta/search-index.json");

    wireSearch();
    wireSidebarToggle();

    await renderCurrentTopic();
    window.addEventListener("hashchange", renderCurrentTopic);
  }

  bootstrap().catch(function(error) {
    const contentEl = document.getElementById("wikiContent");
    if (contentEl) {
      contentEl.innerHTML = "<h2>Wiki bootstrap failed</h2><pre><code>" + String(error && error.message || error) + "</code></pre>";
    }
  });
})();
