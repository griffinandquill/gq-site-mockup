(function () {
  var root = document.querySelector(".store-layout");
  if (!root) return;

  var form = document.querySelector("#store-tools");
  var search = document.querySelector("#store-search");
  var results = document.querySelector("#store-results");
  var heading = document.querySelector("#results-heading");
  var list = document.querySelector("#store-list");
  var status = document.querySelector("#store-status");
  var dialog = document.querySelector("#store-dialog");
  var dialogTitle = document.querySelector("#store-dialog-title");
  var dialogBody = document.querySelector("#store-dialog-body");
  var unitSection = document.querySelector("#unit-section");
  var simSection = document.querySelector("#simulations");
  var unitTiles = Array.prototype.slice.call(document.querySelectorAll("#unit-quests .quest-tile"));
  var simTiles = Array.prototype.slice.call(document.querySelectorAll("#sim-quests .quest-tile"));
  var tiles = unitTiles.concat(simTiles);
  var subjectIds = {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var catalog = null;
  var loadState = "loading";
  var TPT_FALLBACK = "https://www.teacherspayteachers.com/store/griffin-quill";
  var lastOpener = null;

  unitTiles.forEach(function (tile) {
    subjectIds[tile.getAttribute("data-subject")] = true;
  });

  function tptStore() {
    return catalog && catalog.tptStoreUrl ? catalog.tptStoreUrl : TPT_FALLBACK;
  }

  function money(value) {
    var amount = Number(value);
    if (!isFinite(amount)) return "";
    if (Math.round(amount) === amount) return "$" + String(amount);
    return "$" + amount.toFixed(2);
  }

  function subjectName(id) {
    var match = unitTiles.filter(function (tile) {
      return tile.getAttribute("data-subject") === id;
    })[0];
    if (!match) return id || "";
    var node = match.querySelector(".quest-name");
    return node ? node.textContent : id;
  }

  function readRoute() {
    var params = new URLSearchParams(location.search);
    var hash = "";
    try {
      hash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    } catch (error) {
      hash = (location.hash || "").replace(/^#/, "");
    }
    var q = (params.get("q") || "").replace(/\s+/g, " ").trim();
    var kind = "";
    var subject = "";
    if (hash === "simulations") {
      kind = "simulation";
    } else if (hash.indexOf("sim-") === 0 && subjectIds[hash.slice(4)]) {
      subject = hash.slice(4);
      kind = "simulation";
    } else if (subjectIds[hash]) {
      subject = hash;
      kind = "unit";
    } else {
      var asked = params.get("kind");
      if (asked === "unit" || asked === "simulation") kind = asked;
      else kind = "all";
    }
    return { q: q, kind: kind, subject: subject, hash: hash };
  }

  function buildUrl(route) {
    var params = new URLSearchParams();
    if (route.q) params.set("q", route.q);
    if (route.kind && route.kind !== "all") params.set("kind", route.kind);
    var searchPart = params.toString();
    return "store.html" + (searchPart ? "?" + searchPart : "") + (route.hash ? "#" + route.hash : "");
  }

  function items() {
    return catalog && Array.isArray(catalog.items) ? catalog.items : [];
  }

  function haystack(item) {
    return [
      item.title,
      item.summary,
      item.description,
      item.grades,
      item.kind,
      subjectName(item.subject),
      (item.included || []).join(" ")
    ].join(" ").toLowerCase();
  }

  function matching(route) {
    return items().filter(function (item) {
      if (!item || !item.title || !item.subject) return false;
      if (item.kind !== "unit" && item.kind !== "simulation") return false;
      if (route.kind !== "all" && item.kind !== route.kind) return false;
      if (route.subject && item.subject !== route.subject) return false;
      if (route.q && haystack(item).indexOf(route.q.toLowerCase()) === -1) return false;
      return true;
    });
  }

  function countFor(subject, kind) {
    return items().filter(function (item) {
      return item && item.subject === subject && item.kind === kind;
    }).length;
  }

  function badgeText(count, kind) {
    if (!count) return "Coming soon";
    if (kind === "simulation") return count === 1 ? "1 simulation" : count + " simulations";
    return count === 1 ? "1 unit" : count + " units";
  }

  function paintTiles(route) {
    tiles.forEach(function (tile) {
      var subject = tile.getAttribute("data-subject");
      var kind = tile.getAttribute("data-kind");
      var pressed = route.subject === subject && route.kind === kind && !route.q;
      tile.setAttribute("aria-pressed", pressed ? "true" : "false");
      var badge = tile.querySelector("[data-badge]");
      if (!badge) return;
      if (loadState !== "ready") {
        badge.textContent = "";
        return;
      }
      badge.textContent = badgeText(countFor(subject, kind), kind);
    });
  }

  function syncForm(route) {
    if (search && document.activeElement !== search && search.value !== route.q) search.value = route.q;
    var radio = form.querySelector('input[name="kind"][value="' + route.kind + '"]');
    if (radio) radio.checked = true;
  }

  function resultsHeading(route) {
    if (route.q) return "Search results";
    var name = subjectName(route.subject);
    if (route.subject && route.kind === "simulation") return name + " simulations";
    if (route.subject) return name + " units";
    if (route.kind === "simulation") return "Simulations";
    return "Units";
  }

  function externalLink(href, label) {
    var link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    var hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = " (opens in a new tab)";
    link.appendChild(hidden);
    return link;
  }

  function emptyNote(sentence) {
    var box = document.createElement("div");
    box.className = "store-empty";
    var paragraph = document.createElement("p");
    if (sentence === "soon") {
      paragraph.appendChild(document.createTextNode("Coming soon, "));
      paragraph.appendChild(externalLink(tptStore(), "follow our TPT store"));
      paragraph.appendChild(document.createTextNode("."));
    } else {
      paragraph.appendChild(document.createTextNode("No matches for that search. "));
      paragraph.appendChild(externalLink(tptStore(), "Follow our TPT store"));
      paragraph.appendChild(document.createTextNode("."));
    }
    box.appendChild(paragraph);
    return box;
  }

  function fillCard(item) {
    var article = document.createElement("article");
    article.className = "unit-card";
    article.id = "item-" + item.id;

    var open = document.createElement("button");
    open.type = "button";
    open.className = "unit-card-open";
    open.setAttribute("aria-haspopup", "dialog");
    open.setAttribute("aria-controls", "store-dialog");

    if (item.cover) {
      var image = document.createElement("img");
      image.src = item.cover;
      image.alt = item.coverAlt || item.title;
      image.width = 800;
      image.height = 800;
      open.appendChild(image);
    }

    var title = document.createElement("h3");
    title.textContent = item.title;
    open.appendChild(title);

    var grades = document.createElement("p");
    grades.className = "unit-grades";
    grades.textContent = "Grades " + item.grades;
    open.appendChild(grades);

    var includes = document.createElement("ul");
    includes.className = "unit-includes";
    (item.included || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      includes.appendChild(li);
    });
    open.appendChild(includes);

    var price = document.createElement("p");
    price.className = "unit-price";
    price.textContent = money(item.price);
    open.appendChild(price);

    var cue = document.createElement("span");
    cue.className = "unit-open-cue";
    cue.textContent = "View details";
    open.appendChild(cue);

    open.addEventListener("click", function () {
      openDialog(item, open);
    });
    article.appendChild(open);

    var buy = externalLink(item.tptUrl || tptStore(), "Buy on TPT");
    buy.classList.add("btn", "btn-primary");
    article.appendChild(buy);
    return article;
  }

  function renderList(route) {
    var active = !!(route.q || route.subject || route.kind !== "all");
    list.replaceChildren();
    if (!active) {
      results.hidden = true;
      if (status) status.textContent = "";
      return;
    }
    results.hidden = false;
    heading.textContent = resultsHeading(route);
    if (loadState === "loading") {
      var waiting = document.createElement("p");
      waiting.className = "store-waiting";
      waiting.textContent = "Loading the store board.";
      list.appendChild(waiting);
      if (status) status.textContent = "Loading the store board.";
      return;
    }
    if (loadState === "error") {
      list.appendChild(emptyNote("soon"));
      if (status) status.textContent = "The store list did not load. Follow our TPT store.";
      return;
    }
    var found = matching(route);
    if (!found.length) {
      list.appendChild(emptyNote(route.q ? "search" : "soon"));
      if (status) {
        status.textContent = route.q
          ? "No matches for that search."
          : resultsHeading(route) + ". Coming soon, follow our TPT store.";
      }
      return;
    }
    var grid = document.createElement("div");
    grid.className = "unit-grid";
    found.forEach(function (item) {
      grid.appendChild(fillCard(item));
    });
    list.appendChild(grid);
    if (status) {
      var noun = found.length === 1 ? "item" : "items";
      status.textContent = resultsHeading(route) + ". " + found.length + " " + noun + ".";
    }
  }

  var scrollKey = "";

  function maybeScroll(route) {
    var active = !!(route.q || route.subject || route.kind !== "all");
    if (!active || results.hidden || document.activeElement === search) return;
    var key = route.kind + "|" + route.subject + "|" + route.q + "|" + loadState;
    if (key === scrollKey) return;
    scrollKey = key;
    results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }

  function render() {
    var route = readRoute();
    syncForm(route);
    paintTiles(route);
    var unitsOnly = route.kind === "unit" && !route.subject && !route.q;
    var simsOnly = (route.kind === "simulation" && !route.subject && !route.q) || route.hash === "simulations";
    if (unitSection) unitSection.hidden = simsOnly;
    if (simSection) simSection.hidden = unitsOnly;
    root.dataset.mode = route.q ? "search" : route.kind === "simulation" ? "sim" : route.subject || route.kind === "unit" ? "unit" : "browse";
    renderList(route);
    maybeScroll(route);
  }

  function previewNodes(item) {
    var shots = item.previews && item.previews.length
      ? item.previews
      : item.cover
        ? [{ src: item.cover, alt: item.coverAlt || item.title }]
        : [];
    var gallery = document.createElement("div");
    gallery.className = "store-gallery";
    shots.forEach(function (shot) {
      if (!shot || !shot.src) return;
      var image = document.createElement("img");
      image.src = shot.src;
      image.alt = shot.alt || item.title;
      gallery.appendChild(image);
    });
    return gallery;
  }

  function openDialog(item, opener) {
    lastOpener = opener || null;
    dialogTitle.textContent = item.title;
    dialogBody.replaceChildren();
    dialogBody.appendChild(previewNodes(item));

    String(item.description || item.summary || "").split(/\n\n+/).forEach(function (part) {
      var text = part.trim();
      if (!text) return;
      var paragraph = document.createElement("p");
      paragraph.textContent = text;
      dialogBody.appendChild(paragraph);
    });

    var meta = document.createElement("p");
    meta.className = "unit-grades";
    meta.textContent = "Grades " + item.grades;
    dialogBody.appendChild(meta);

    var includes = document.createElement("ul");
    includes.className = "unit-includes";
    (item.included || []).forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      includes.appendChild(li);
    });
    dialogBody.appendChild(includes);

    var price = document.createElement("p");
    price.className = "unit-price";
    price.textContent = money(item.price);
    dialogBody.appendChild(price);

    var buy = externalLink(item.tptUrl || tptStore(), "Buy on TPT");
    buy.classList.add("btn", "btn-primary");
    dialogBody.appendChild(buy);

    if (typeof dialog.showModal === "function" && !dialog.open) dialog.showModal();
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  document.querySelector("#store-dialog-close").addEventListener("click", closeDialog);
  dialog.addEventListener("close", function () {
    if (lastOpener && typeof lastOpener.focus === "function") lastOpener.focus();
  });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeDialog();
  });

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function () {
      tile.classList.remove("is-press");
      void tile.offsetWidth;
      tile.classList.add("is-press");
      var subject = tile.getAttribute("data-subject");
      var kind = tile.getAttribute("data-kind");
      var hash = kind === "simulation" ? "sim-" + subject : subject;
      history.pushState({ store: 1 }, "", buildUrl({ q: "", kind: "", hash: hash }));
      render();
    });
  });

  function moveTiles(event, group) {
    var keys = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1, Home: "home", End: "end" };
    if (!Object.prototype.hasOwnProperty.call(keys, event.key)) return;
    var current = group.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    var columns = 1;
    var template = window.getComputedStyle(group[0].parentElement).gridTemplateColumns;
    if (template && template !== "none") columns = template.split(" ").length;
    var next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = group.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = current + keys[event.key];
    else next = current + keys[event.key] * columns;
    if (next < 0) next = 0;
    if (next > group.length - 1) next = group.length - 1;
    group[next].focus();
  }

  document.querySelector("#unit-quests").addEventListener("keydown", function (event) {
    moveTiles(event, unitTiles);
  });
  document.querySelector("#sim-quests").addEventListener("keydown", function (event) {
    moveTiles(event, simTiles);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  search.addEventListener("input", function () {
    var kind = readRoute().kind;
    var q = search.value.replace(/\s+/g, " ").trim();
    history.replaceState({ store: 1 }, "", buildUrl({
      q: q,
      kind: kind === "all" ? "" : kind,
      hash: ""
    }));
    render();
  });

  form.addEventListener("change", function (event) {
    var input = event.target;
    if (!input || input.name !== "kind") return;
    var q = search.value.replace(/\s+/g, " ").trim();
    var kind = input.value;
    history.pushState({ store: 1 }, "", buildUrl({
      q: q,
      kind: kind === "all" ? "" : kind,
      hash: kind === "simulation" ? "simulations" : ""
    }));
    render();
  });

  window.addEventListener("popstate", render);
  window.addEventListener("hashchange", render);

  render();
  var link = document.querySelector('link[rel="store"]');
  var url = link ? link.getAttribute("href") : "data/store.json";
  fetch(url).then(function (response) {
    if (!response.ok) throw new Error("store");
    return response.json();
  }).then(function (data) {
    catalog = data || {};
    loadState = "ready";
    render();
  }).catch(function () {
    loadState = "error";
    render();
  });
})();
