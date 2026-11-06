(function () {
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

  var points = {
    origin: { x: 18, y: 64 },
    river: { x: 40, y: 34 },
    tower: { x: 70, y: 70 },
    rope: { x: 62, y: 16 },
    highroad: { x: 84, y: 28 },
    mark: { x: 86, y: 50 },
    descend: { x: 84, y: 84 }
  };

  var states = {
    start: {
      text: "A lamp burns over an unfinished chart. Two paths leave the first star. Pick one.",
      chosen: [],
      open: [
        ["origin", "river"],
        ["origin", "tower"]
      ],
      visible: ["origin", "river", "tower"],
      choices: [
        { id: "river", label: "Choose: cross the river" },
        { id: "tower", label: "Choose: climb the tower" }
      ]
    },
    river: {
      text: "You cross the river at the ford. The chart marks the near bank as behind you, and the current runs west. Follow the ferry rope, or take the high road.",
      chosen: [["origin", "river"]],
      open: [
        ["river", "rope"],
        ["river", "highroad"]
      ],
      visible: ["origin", "river", "rope", "highroad"],
      choices: [
        { id: "rope", label: "Choose: follow the rope" },
        { id: "highroad", label: "Choose: take the high road" }
      ]
    },
    tower: {
      text: "You climb the tower. From the top the river is one gold line, and the ford is the bend that points west. Mark that bend on the chart, or climb down and cross it yourself.",
      chosen: [["origin", "tower"]],
      open: [
        ["tower", "mark"],
        ["tower", "descend"]
      ],
      visible: ["origin", "tower", "mark", "descend"],
      choices: [
        { id: "mark", label: "Choose: mark the ford" },
        { id: "descend", label: "Choose: climb down" }
      ]
    },
    rope: {
      text: "The ferry rope holds. You reach the far landing with the chart still dry. The low path is now the one the chart remembers.",
      chosen: [
        ["origin", "river"],
        ["river", "rope"]
      ],
      open: [],
      visible: ["origin", "river", "rope"],
      choices: []
    },
    highroad: {
      text: "The high road is longer, and you can see the ford you did not take. The chart keeps the ridge. The river stays a line you only looked down on.",
      chosen: [
        ["origin", "river"],
        ["river", "highroad"]
      ],
      open: [],
      visible: ["origin", "river", "highroad"],
      choices: []
    },
    mark: {
      text: "You mark the ford from above. The chart shows the crossing, and your boots are still dry. You have not crossed it yet.",
      chosen: [
        ["origin", "tower"],
        ["tower", "mark"]
      ],
      open: [],
      visible: ["origin", "tower", "mark"],
      choices: []
    },
    descend: {
      text: "You climb down and cross the ford you saw from the tower. The chart now holds both the high view and the cold water.",
      chosen: [
        ["origin", "tower"],
        ["tower", "descend"]
      ],
      open: [],
      visible: ["origin", "tower", "descend"],
      choices: []
    }
  };

  function random(seed) {
    var value = seed >>> 0;
    return function () {
      value = (value + 0x6d2b79f5) >>> 0;
      var t = Math.imul(value ^ (value >>> 15), 1 | value);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function curve(fromId, toId) {
    var from = points[fromId];
    var to = points[toId];
    var mx = (from.x + to.x) / 2;
    var my = (from.y + to.y) / 2;
    var bend = (to.x - from.x) * 0.18;
    return "M " + from.x + " " + from.y + " Q " + (mx - (to.y - from.y) * 0.22) + " " + (my + bend) + " " + to.x + " " + to.y;
  }

  function addPath(d, className) {
    var path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("pathLength", "1");
    path.setAttribute("fill", "none");
    path.setAttribute("class", className);
    return path;
  }

  function paintWeb() {
    var roll = random(20261106);
    var stars = [];
    var i;
    for (i = 0; i < 36; i += 1) {
      stars.push({ x: 8 + roll() * 84, y: 8 + roll() * 84, r: roll() > 0.82 ? 0.9 : 0.45 });
    }
    stars.forEach(function (star, index) {
      var dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", star.x.toFixed(2));
      dot.setAttribute("cy", star.y.toFixed(2));
      dot.setAttribute("r", String(star.r));
      dot.setAttribute("class", "chart-web-star");
      web.appendChild(dot);
      if (index === 0) return;
      var previous = stars[index - 1];
      if (Math.hypot(star.x - previous.x, star.y - previous.y) > 28) return;
      web.appendChild(addPath(
        "M " + previous.x.toFixed(2) + " " + previous.y.toFixed(2) + " L " + star.x.toFixed(2) + " " + star.y.toFixed(2),
        "chart-web-line"
      ));
    });
  }

  function paint(stateId, moveFocus) {
    var state = states[stateId];
    if (!state) return;
    sheet.setAttribute("data-chart-state", stateId);
    story.textContent = state.text;
    routes.textContent = "";
    nodes.textContent = "";
    choices.textContent = "";

    function drawGroup(pairs, className) {
      pairs.forEach(function (pair) {
        var path = addPath(curve(pair[0], pair[1]), "chart-route " + className);
        routes.appendChild(path);
        if (reduceMotion) {
          path.classList.add("is-drawn");
          return;
        }
        window.requestAnimationFrame(function () {
          path.classList.add("is-drawn");
        });
      });
    }

    drawGroup(state.chosen, "is-chosen");
    drawGroup(state.open, "is-open");

    state.visible.forEach(function (id) {
      var point = points[id];
      var dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", String(point.x));
      dot.setAttribute("cy", String(point.y));
      dot.setAttribute("r", id === "origin" ? "1.7" : "1.35");
      dot.setAttribute("class", "chart-node");
      dot.setAttribute("data-node", id);
      nodes.appendChild(dot);
    });

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

  function placeButtons() {
    var stageBox = stage.getBoundingClientRect();
    if (!stageBox.width || !stageBox.height) return;
    var pad = 8;
    var viewWidth = document.documentElement.clientWidth;
    Array.prototype.forEach.call(choices.querySelectorAll(".chart-choice"), function (button) {
      var dot = nodes.querySelector('[data-node="' + button.dataset.node + '"]');
      if (!dot) return;
      button.style.maxWidth = "";
      var room = Math.max(44, Math.floor(stageBox.width - pad * 2));
      if (button.getBoundingClientRect().width > room) button.style.maxWidth = room + "px";
      var buttonBox = button.getBoundingClientRect();
      var halfW = buttonBox.width / 2;
      var halfH = buttonBox.height / 2;
      var dotBox = dot.getBoundingClientRect();
      var left = dotBox.left + dotBox.width / 2 - stageBox.left;
      var top = dotBox.top + dotBox.height / 2 - stageBox.top;
      var minLeft = pad + halfW;
      var maxLeft = stageBox.width - pad - halfW;
      var minTop = pad + halfH;
      var maxTop = stageBox.height - pad - halfH;
      left = maxLeft < minLeft ? stageBox.width / 2 : Math.min(maxLeft, Math.max(minLeft, left));
      top = maxTop < minTop ? stageBox.height / 2 : Math.min(maxTop, Math.max(minTop, top));
      var minCenter = pad + halfW - stageBox.left;
      var maxCenter = viewWidth - pad - halfW - stageBox.left;
      if (maxCenter >= minCenter) left = Math.min(maxCenter, Math.max(minCenter, left));
      button.style.left = left + "px";
      button.style.top = top + "px";
      var painted = button.getBoundingClientRect();
      var rightLimit = Math.min(stageBox.right, viewWidth) - pad;
      var leftLimit = Math.max(stageBox.left, pad);
      var dx = 0;
      var dy = 0;
      if (painted.right > rightLimit) dx -= painted.right - rightLimit;
      if (painted.left + dx < leftLimit) dx += leftLimit - painted.left;
      if (painted.bottom > stageBox.bottom - pad) dy -= painted.bottom - (stageBox.bottom - pad);
      if (painted.top + dy < stageBox.top + pad) dy += stageBox.top + pad - painted.top;
      if (dx || dy) {
        button.style.left = (left + dx) + "px";
        button.style.top = (top + dy) + "px";
      }
    });
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

  window.addEventListener("resize", placeButtons);
  window.addEventListener("load", placeButtons);
  if (window.ResizeObserver) new ResizeObserver(placeButtons).observe(stage);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeButtons);
  paintWeb();
  paint("start", false);
})();
