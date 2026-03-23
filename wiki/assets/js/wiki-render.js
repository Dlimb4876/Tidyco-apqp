(function() {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInline(text) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    return out;
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown || "").split(/\r?\n/);
    const html = [];
    let inList = false;
    let inCode = false;
    let inTable = false;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      if (line.trim().startsWith("```")) {
        if (!inCode) {
          inCode = true;
          html.push("<pre><code>");
        } else {
          inCode = false;
          html.push("</code></pre>");
        }
        continue;
      }

      if (inCode) {
        html.push(escapeHtml(line) + "\n");
        continue;
      }

      if (/^\|.*\|$/.test(line.trim())) {
        if (!inTable) {
          inTable = true;
          html.push("<table>");
        }

        const cells = line.split("|").slice(1, -1).map(function(cell) {
          return cell.trim();
        });

        const isDivider = cells.every(function(cell) {
          return /^:?-{3,}:?$/.test(cell);
        });

        if (isDivider) {
          continue;
        }

        const prevLine = i > 0 ? lines[i - 1] : "";
        const isHeader = /^\|.*\|$/.test(prevLine.trim()) && /\|\s*:?-{3,}:?\s*\|/.test(line.trim()) === false && html[html.length - 1] !== "</thead>";

        if (isHeader && html[html.length - 2] !== "<thead>") {
          html.push("<thead>");
          html.push("<tr>" + cells.map(function(c) { return "<th>" + renderInline(c) + "</th>"; }).join("") + "</tr>");
          html.push("</thead><tbody>");
        } else {
          if (html[html.length - 1] !== "</thead><tbody>" && !html.join("").includes("<tbody>")) {
            html.push("<tbody>");
          }
          html.push("<tr>" + cells.map(function(c) { return "<td>" + renderInline(c) + "</td>"; }).join("") + "</tr>");
        }

        const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
        if (!/^\|.*\|$/.test(nextLine.trim())) {
          if (html[html.length - 1] !== "</tbody>") html.push("</tbody>");
          html.push("</table>");
          inTable = false;
        }
        continue;
      }

      if (inTable) {
        html.push("</tbody></table>");
        inTable = false;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        if (inList) {
          html.push("</ul>");
          inList = false;
        }
        const level = headingMatch[1].length;
        html.push("<h" + level + ">" + renderInline(headingMatch[2]) + "</h" + level + ">");
        continue;
      }

      const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
      if (bulletMatch) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push("<li>" + renderInline(bulletMatch[1]) + "</li>");
        continue;
      }

      if (inList) {
        html.push("</ul>");
        inList = false;
      }

      if (!line.trim()) {
        html.push("");
        continue;
      }

      html.push("<p>" + renderInline(line) + "</p>");
    }

    if (inList) html.push("</ul>");
    if (inCode) html.push("</code></pre>");
    if (inTable) html.push("</tbody></table>");

    return html.join("\n");
  }

  window.wikiRender = {
    markdownToHtml: markdownToHtml
  };
})();
