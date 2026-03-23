(function() {
  function scoreResult(item, query) {
    const q = query.toLowerCase();
    const title = (item.title || "").toLowerCase();
    const headings = (item.headings || []).join(" ").toLowerCase();
    const keywords = (item.keywords || []).join(" ").toLowerCase();
    const excerpt = (item.excerpt || "").toLowerCase();

    if (title === q) return 100;
    if (title.includes(q)) return 80;
    if (headings.includes(q)) return 60;
    if (keywords.includes(q)) return 40;
    if (excerpt.includes(q)) return 20;
    return 0;
  }

  function search(index, query) {
    const q = String(query || "").trim();
    if (!q) return [];

    return index
      .map(function(item) {
        return {
          item: item,
          score: scoreResult(item, q)
        };
      })
      .filter(function(entry) { return entry.score > 0; })
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 20);
  }

  function renderResults(entries) {
    const panel = document.getElementById("wikiSearchResults");
    if (!panel) return;

    if (!entries.length) {
      panel.innerHTML = "<p>No matching topics found.</p>";
      panel.hidden = false;
      return;
    }

    panel.hidden = false;
    panel.innerHTML = entries.map(function(entry) {
      const item = entry.item;
      const hashPath = item.path.replace(/^content\//, "").replace(/\.md$/, "");
      return '<a href="#' + hashPath + '"><strong>' + item.title + '</strong><br><small>' + (item.excerpt || "") + '</small></a>';
    }).join("");
  }

  window.wikiSearch = {
    search: search,
    renderResults: renderResults
  };
})();
