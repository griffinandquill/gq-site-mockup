(function () {
  // Fixed local sample. No network, no cookies, no storage. Not Forge, not live AI.
  var sheet = document.getElementById("story-chart");
  var svg = document.getElementById("chart-svg");
  var web = document.getElementById("chart-web");
  var routes = document.getElementById("chart-routes");
  var nodes = document.getElementById("chart-nodes");
  var choices = document.getElementById("chart-choices");
  var story = document.getElementById("chart-story");
  var reset = document.getElementById("chart-reset");
  var stage = document.getElementById("chart-stage");
  if (!sheet || !svg || !web || !routes || !nodes || !choices || !story || !reset || !stage) return;

  var SVG_NS = "http://www.w3.org/2000/svg";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Story stars, as fractions of the stage (x across, y down).
  var points = {
    origin: { x: 0.14, y: 0.62 },
    tower: { x: 0.37, y: 0.26 },
    ford: { x: 0.41, y: 0.8 },
    mark: { x: 0.64, y: 0.1 },
    descend: { x: 0.88, y: 0.36 },
    steep: { x: 0.66, y: 0.6 },
    gentle: { x: 0.9, y: 0.86 }
  };

  // Every route on the chart. All are drawn faintly so the whole map is visible.
  var edges = [
    ["origin", "tower"],
    ["origin", "ford"],
    ["tower", "mark"],
    ["tower", "descend"],
    ["ford", "steep"],
    ["ford", "gentle"]
  ];

  var states = {
    start: {
      text: "Your chart shows a river between you and the old tower. The key says a dashed line marks a ford, where the water runs shallow. Trust the chart now, or climb the tower to check it first?",
      path: ["origin"],
      choices: [
        { id: "ford", label: "Choose: cross at the ford" },
        { id: "tower", label: "Choose: climb the tower first" }
      ]
    },
    ford: {
      text: "You wade in where the chart draws the dashed line. The water reaches your knees, not your chest, so the key was right. Past the bank the trail splits. One trail crosses contour lines packed close together. The other crosses lines spaced wide apart.",
      path: ["origin", "ford"],
      choices: [
        { id: "steep", label: "Choose: take the close-lined trail" },
        { id: "gentle", label: "Choose: take the wide-lined trail" }
      ]
    },
    steep: {
      text: "Contour lines packed close together mean steep ground, and the trail climbs hard. You reach the ridge fast and out of breath. Inference checked: close lines, steep slope.",
      path: ["origin", "ford", "steep"],
      choices: []
    },
    gentle: {
      text: "Contour lines spaced wide apart mean gentle ground. The trail is longer but easy on your legs. Inference checked: wide lines, gentle slope.",
      path: ["origin", "ford", "gentle"],
      choices: []
    },
    tower: {
      text: "From the top you compare the chart to the land. Where the chart draws the dashed line, the river below is pale and rippled. That is a second clue that the water is shallow. Note what you saw, or climb down and test it.",
      path: ["origin", "tower"],
      choices: [
        { id: "mark", label: "Choose: note the clue on the chart" },
        { id: "descend", label: "Choose: climb down and cross" }
      ]
    },
    mark: {
      text: "You ink a note beside the dashed line: pale, rippled water, seen from the tower. The next reader gets your evidence too. You have not crossed yet.",
      path: ["origin", "tower", "mark"],
      choices: []
    },
    descend: {
      text: "You cross where the chart and the ripples agree. The water stays at your knees. Two clues pointed the same way, and the inference held.",
      path: ["origin", "tower", "descend"],
      choices: []
    }
  };

  var current = "start";
  var size = { w: 0, h: 0 };

  function random(seed) {
    var value = seed >>> 0;
    return function () {
      value = (value + 0x6d2b79f5) >>> 0;
      var t = Math.imul(value ^ (value >>> 15), 1 | value);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function px(id) {
    var point = points[id];
    return { x: point.x * size.w, y: point.y * size.h };
  }

  function control(a, b) {
    var bend = 0.18;
    return { x: (a.x + b.x) / 2 - (b.y - a.y) * bend, y: (a.y + b.y) / 2 + (b.x - a.x) * bend };
  }

  function curve(fromId, toId) {
    var a = px(fromId);
    var b = px(toId);
    var c = control(a, b);
    return "M " + a.x.toFixed(1) + " " + a.y.toFixed(1) +
      " Q " + c.x.toFixed(1) + " " + c.y.toFixed(1) +
      " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
  }

  // Points part way along a route, so each route reads as a string of stars.
  function along(fromId, toId, t) {
    var a = px(fromId);
    var b = px(toId);
    var c = control(a, b);
    var u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
  }

  function make(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function edgeKey(a, b) { return a + ">" + b; }

  // Background constellation: seeded stars joined to their nearest neighbour.
  function paintWeb() {
    web.textContent = "";
    var roll = random(20261106);
    var count = Math.round(Math.min(90, Math.max(40, (size.w * size.h) / 3200)));
    var stars = [];
    var i;
    for (i = 0; i < count; i += 1) {
      stars.push({ x: (0.02 + roll() * 0.96) * size.w, y: (0.03 + roll() * 0.94) * size.h, big: roll() > 0.85 });
    }
    var reach = Math.max(size.w, size.h) * 0.16;
    stars.forEach(function (star, index) {
      var best = null;
      var bestDist = Infinity;
      for (var j = 0; j < index; j += 1) {
        var d = Math.hypot(star.x - stars[j].x, star.y - stars[j].y);
        if (d < bestDist) { bestDist = d; best = stars[j]; }
      }
      if (best && bestDist < reach) {
        web.appendChild(make("line", {
          x1: star.x.toFixed(1), y1: star.y.toFixed(1), x2: best.x.toFixed(1), y2: best.y.toFixed(1),
          "class": "chart-web-line"
        }));
      }
    });
    stars.forEach(function (star) {
      web.appendChild(make("circle", {
        cx: star.x.toFixed(1), cy: star.y.toFixed(1), r: star.big ? "1.6" : "0.9",
        "class": "chart-web-star" + (star.big ? " is-bright" : "")
      }));
    });
  }

  function paintRoutes(state, animate) {
    routes.textContent = "";
    nodes.textContent = "";
    var chosen = {};
    for (var i = 1; i < state.path.length; i += 1) chosen[edgeKey(state.path[i - 1], state.path[i])] = true;
    var here = state.path[state.path.length - 1];
    var open = {};
    state.choices.forEach(function (choice) { open[edgeKey(here, choice.id)] = true; });

    edges.forEach(function (edge) {
      var key = edgeKey(edge[0], edge[1]);
      var cls = "chart-route " + (chosen[key] ? "is-chosen" : open[key] ? "is-open" : "is-faint");
      var path = make("path", { d: curve(edge[0], edge[1]), pathLength: "1", fill: "none", "class": cls });
      routes.appendChild(path);
      [0.25, 0.5, 0.75].forEach(function (t, n) {
        var p = along(edge[0], edge[1], t);
        routes.appendChild(make("circle", {
          cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: n === 1 ? "2.2" : "1.6",
          "class": "chart-route-star" + (chosen[key] ? " is-lit" : open[key] ? " is-open" : "")
        }));
      });
      if (!chosen[key] || reduceMotion || !animate) {
        path.classList.add("is-drawn");
        return;
      }
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { path.classList.add("is-drawn"); });
      });
    });

    var reached = {};
    state.path.forEach(function (id) { reached[id] = true; });
    var targets = {};
    state.choices.forEach(function (choice) { targets[choice.id] = true; });

    Object.keys(points).forEach(function (id) {
      var p = px(id);
      var cls = "chart-node" + (reached[id] ? " is-reached" : targets[id] ? " is-target" : " is-dim");
      if (id === here) cls += " is-here";
      if (targets[id]) {
        nodes.appendChild(make("circle", { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: "9", "class": "chart-ring" }));
      }
      nodes.appendChild(make("circle", {
        cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: id === "origin" || id === here ? "5" : "4",
        "class": cls, "data-node": id
      }));
    });
  }

  function measure() {
    var box = stage.getBoundingClientRect();
    size.w = Math.max(1, Math.round(box.width));
    size.h = Math.max(1, Math.round(box.height));
    svg.setAttribute("viewBox", "0 0 " + size.w + " " + size.h);
  }

  function paint(stateId, moveFocus) {
    var state = states[stateId];
    if (!state) return;
    current = stateId;
    sheet.setAttribute("data-chart-state", stateId);
    story.textContent = state.text;
    measure();
    paintRoutes(state, true);

    choices.textContent = "";
    state.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chart-choice";
      button.dataset.node = choice.id;
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        paint(choice.id, true);
      });
      choices.appendChild(button);
    });

    placeButtons();
    if (!moveFocus) return;
    var focusTarget = choices.querySelector(".chart-choice") || reset;
    focusTarget.focus();
  }

  function clamp(value, min, max) {
    if (max < min) return (min + max) / 2;
    return Math.min(max, Math.max(min, value));
  }

  // Place each choice next to its target star, then keep it inside both the
  // stage and the viewport. Each edge is clamped on its own.
  function placeButtons() {
    var stageBox = stage.getBoundingClientRect();
    if (!stageBox.width || !stageBox.height) return;
    var pad = 8;
    var gap = 14;
    var viewWidth = document.documentElement.clientWidth;
    // Usable box in stage coordinates.
    var minX = Math.max(0, -stageBox.left) + pad;
    var maxX = Math.min(stageBox.width, viewWidth - stageBox.left) - pad;
    var minY = pad;
    var maxY = stageBox.height - pad;
    var placed = [];

    Array.prototype.forEach.call(choices.querySelectorAll(".chart-choice"), function (button) {
      var id = button.dataset.node;
      if (!points[id]) return;
      button.style.maxWidth = "";
      var room = Math.max(44, Math.floor(maxX - minX));
      if (button.offsetWidth > room) button.style.maxWidth = room + "px";
      var w = button.offsetWidth;
      var h = button.offsetHeight;
      var star = px(id);
      // Sit above the star in the lower half, below it in the upper half.
      var below = points[id].y < 0.5;
      var cx = star.x;
      var cy = below ? star.y + gap + h / 2 : star.y - gap - h / 2;

      var left = clamp(cx - w / 2, minX, maxX - w);
      var top = clamp(cy - h / 2, minY, maxY - h);

      // Keep two choices from covering each other.
      placed.forEach(function (other) {
        var overlapX = left < other.left + other.w + 6 && left + w + 6 > other.left;
        var overlapY = top < other.top + other.h + 6 && top + h + 6 > other.top;
        if (!overlapX || !overlapY) return;
        var down = other.top + other.h + 6;
        var up = other.top - h - 6;
        top = down + h <= maxY ? down : clamp(up, minY, maxY - h);
      });

      button.style.left = left + "px";
      button.style.top = top + "px";
      button.dataset.side = below ? "below" : "above";
      placed.push({ left: left, top: top, w: w, h: h });
    });
  }

  function redraw() {
    measure();
    paintWeb();
    paintRoutes(states[current], false);
    placeButtons();
  }

  choices.addEventListener("keydown", function (event) {
    var buttons = Array.prototype.slice.call(choices.querySelectorAll(".chart-choice"));
    var index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    var next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
    else return;
    event.preventDefault();
    buttons[next].focus();
  });

  reset.addEventListener("click", function () {
    paint("start", true);
  });

  var pending = 0;
  function schedule() {
    if (pending) return;
    pending = window.requestAnimationFrame(function () {
      pending = 0;
      var box = stage.getBoundingClientRect();
      if (Math.round(box.width) !== size.w || Math.round(box.height) !== size.h) redraw();
      else placeButtons();
    });
  }

  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeButtons);
  measure();
  paintWeb();
  paint("start", false);
})();
