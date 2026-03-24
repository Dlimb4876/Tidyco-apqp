(function() {
  function normalizeTopicPath(path) {
    return String(path || "")
      .replace(/^content\//, "")
      .replace(/^\/+/, "")
      .replace(/\.md$/i, "")
      .trim();
  }

  function isExternalHref(href) {
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href);
  }

  function isBlockedProtocol(href) {
    return /^(?:javascript|data|vbscript):/i.test(href);
  }

  function resolveRelativePath(basePath, relativePath) {
    const baseParts = normalizeTopicPath(basePath).split("/").filter(Boolean);
    if (baseParts.length) baseParts.pop();

    const relParts = String(relativePath || "").split("/");
    for (let i = 0; i < relParts.length; i += 1) {
      const part = relParts[i].trim();
      if (!part || part === ".") continue;
      if (part === "..") {
        if (baseParts.length) baseParts.pop();
      } else {
        baseParts.push(part);
      }
    }

    return baseParts.join("/");
  }

  function toWikiHref(rawHref, topicPath) {
    const href = String(rawHref || "").trim();
    if (!href) return "#";
    if (isBlockedProtocol(href)) return "#";
    if (isExternalHref(href)) return href;

    let pathPart = href;
    const hashIndex = href.indexOf("#");
    if (hashIndex >= 0) {
      pathPart = href.slice(0, hashIndex);
    }

    if (!pathPart) {
      return "#" + normalizeTopicPath(topicPath);
    }

    let resolvedPath = "";
    if (pathPart.startsWith("../") || pathPart.startsWith("./")) {
      resolvedPath = resolveRelativePath(topicPath, pathPart);
    } else if (pathPart.startsWith("/")) {
      return pathPart;
    } else if (pathPart.includes("/")) {
      resolvedPath = normalizeTopicPath(pathPart);
    } else if (/\.md$/i.test(pathPart)) {
      resolvedPath = resolveRelativePath(topicPath, pathPart);
    } else {
      resolvedPath = normalizeTopicPath(pathPart);
    }

    resolvedPath = normalizeTopicPath(resolvedPath);
    if (!resolvedPath) return "#";

    return "#" + resolvedPath;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInline(text, topicPath) {
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, label, href) {
      return '<a href="' + escapeHtml(toWikiHref(href, topicPath)) + '">' + label + '</a>';
    });
    return out;
  }

  function markdownToHtml(markdown, options) {
    const lines = String(markdown || "").split(/\r?\n/);
    const topicPath = options && options.topicPath ? options.topicPath : "";
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
          html.push("<tr>" + cells.map(function(c) { return "<th>" + renderInline(c, topicPath) + "</th>"; }).join("") + "</tr>");
          html.push("</thead><tbody>");
        } else {
          if (html[html.length - 1] !== "</thead><tbody>" && !html.join("").includes("<tbody>")) {
            html.push("<tbody>");
          }
          html.push("<tr>" + cells.map(function(c) { return "<td>" + renderInline(c, topicPath) + "</td>"; }).join("") + "</tr>");
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
        html.push("<h" + level + ">" + renderInline(headingMatch[2], topicPath) + "</h" + level + ">");
        continue;
      }

      const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
      if (bulletMatch) {
        if (!inList) {
          html.push("<ul>");
          inList = true;
        }
        html.push("<li>" + renderInline(bulletMatch[1], topicPath) + "</li>");
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

      html.push("<p>" + renderInline(line, topicPath) + "</p>");
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
