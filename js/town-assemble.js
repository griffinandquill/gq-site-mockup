/* Assemble-in chrome for the Quillhaven town square. The scene itself is drawn by hero-scene.js. */
(function () {
  var SCENE_W = 384;
  var SCENE_H = 216;
  var LIVE = {
    scan: "Scanning the town square",
    ground: "Placing the ground",
    buildings: "Placing buildings",
    props: "Placing props",
    folk: "Townsfolk walking in",
    ui: "Placing the sign",
    done: "Quillhaven, built tile by tile"
  };

  function attach(section, handlers) {
    var stage = section.querySelector(".town-square-stage");
    var copy = section.querySelector(".town-square-copy");
    var root = document.createElement("div");
    root.className = "town-assemble";
    root.hidden = true;

    var draw = document.createElement("canvas");
    draw.className = "town-assemble-draw";
    draw.setAttribute("aria-hidden", "true");

    var live = document.createElement("p");
    live.className = "town-assemble-live";
    live.setAttribute("aria-live", "polite");

    var readout = document.createElement("p");
    readout.className = "town-assemble-readout";
    readout.setAttribute("aria-hidden", "true");
    readout.textContent = "Scanning...";

    var skip = document.createElement("button");
    skip.type = "button";
    skip.className = "town-assemble-skip";
    skip.textContent = "Skip";

    var badge = document.createElement("div");
    badge.className = "town-assemble-badge";
    badge.hidden = true;

    var badgeText = document.createElement("p");
    badgeText.textContent = "Quillhaven, built tile by tile";

    var replay = document.createElement("button");
    replay.type = "button";
    replay.className = "town-assemble-replay";
    replay.textContent = "Replay";

    badge.appendChild(badgeText);
    badge.appendChild(replay);
    root.appendChild(draw);
    root.appendChild(live);
    root.appendChild(readout);
    root.appendChild(skip);
    root.appendChild(badge);
    section.appendChild(root);

    var narrowQuery = window.matchMedia("(max-width: 640px)");

    function placeBadge() {
      var narrow = narrowQuery.matches;
      if (narrow && copy && badge.parentNode !== copy) copy.insertBefore(badge, copy.firstChild);
      else if (!narrow && badge.parentNode !== root) root.appendChild(badge);
    }

    placeBadge();

    var layout = null;
    var layoutWidth = -1;
    var layoutHeight = -1;
    var layoutDpr = 0;
    var lastPhase = "";
    var lastMark = "";
    var flashUntil = 0;
    var ctx = draw.getContext("2d");

    function playLink() {
      return copy ? copy.querySelector("a") : null;
    }

    function setPlayHidden(hidden) {
      var play = playLink();
      if (!play) return;
      if (hidden) {
        play.setAttribute("tabindex", "-1");
        play.setAttribute("aria-hidden", "true");
      } else {
        play.removeAttribute("tabindex");
        play.removeAttribute("aria-hidden");
      }
    }

    function ensureLayout() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = section.clientWidth;
      var h = section.clientHeight;
      if (layout && w === layoutWidth && h === layoutHeight && dpr === layoutDpr) return layout;
      layoutWidth = w;
      layoutHeight = h;
      layoutDpr = dpr;
      if (!w || !h || !stage) {
        layout = null;
        return null;
      }
      var sectionRect = section.getBoundingClientRect();
      var stageRect = stage.getBoundingClientRect();
      var picture = stage.querySelector(".town-square-canvas");
      var pictureRect = picture ? picture.getBoundingClientRect() : stageRect;
      var scale = pictureRect.width / SCENE_W || 1;
      var visLeft = Math.max(pictureRect.left, stageRect.left);
      var visTop = Math.max(pictureRect.top, stageRect.top);
      var visRight = Math.min(pictureRect.right, stageRect.right);
      var visBottom = Math.min(pictureRect.bottom, stageRect.bottom);
      layout = {
        dpr: dpr,
        scale: scale,
        ox: pictureRect.left - sectionRect.left,
        oy: pictureRect.top - sectionRect.top,
        stageLeft: stageRect.left - sectionRect.left,
        stageTop: stageRect.top - sectionRect.top,
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
        scanLeft: visLeft - sectionRect.left,
        scanTop: visTop - sectionRect.top,
        scanWidth: Math.max(0, visRight - visLeft),
        scanHeight: Math.max(0, visBottom - visTop)
      };
      var bw = Math.max(1, Math.round(w * dpr));
      var bh = Math.max(1, Math.round(h * dpr));
      if (draw.width !== bw || draw.height !== bh) {
        draw.width = bw;
        draw.height = bh;
        ctx = draw.getContext("2d");
      }
      return layout;
    }

    function visibleBox(box, lay) {
      var visTop = -lay.oy / lay.scale;
      var visLeft = -lay.ox / lay.scale;
      var visRight = visLeft + lay.stageWidth / lay.scale;
      var visBottom = visTop + lay.stageHeight / lay.scale;
      var x1 = Math.max(box.x, visLeft);
      var y1 = Math.max(box.y, visTop);
      var x2 = Math.min(box.x + box.w, visRight);
      var y2 = Math.min(box.y + box.h, visBottom);
      if (x2 - x1 < 4 || y2 - y1 < 4) return null;
      return {
        x: lay.ox + x1 * lay.scale,
        y: lay.oy + y1 * lay.scale,
        w: (x2 - x1) * lay.scale,
        h: (y2 - y1) * lay.scale
      };
    }

    function growBox(box) {
      var x = box.x;
      var y = box.y;
      var w = box.w;
      var h = box.h;
      if (w < 20) {
        x -= (20 - w) / 2;
        w = 20;
      }
      if (h < 20) {
        y -= (20 - h) / 2;
        h = 20;
      }
      return { x: x, y: y, w: w, h: h };
    }

    function strokeBox(context, box, hot) {
      context.fillStyle = hot ? "rgba(47, 107, 255, 0.24)" : "rgba(47, 107, 255, 0.12)";
      context.strokeStyle = "#2f6bff";
      context.lineWidth = 1.5;
      context.fillRect(box.x, box.y, box.w, box.h);
      context.strokeRect(box.x + 0.5, box.y + 0.5, Math.max(0, box.w - 1), Math.max(0, box.h - 1));
      var size = 6;
      var corners = [
        [box.x, box.y],
        [box.x + box.w, box.y],
        [box.x, box.y + box.h],
        [box.x + box.w, box.y + box.h]
      ];
      context.fillStyle = "#faf6ea";
      var i;
      for (i = 0; i < corners.length; i += 1) {
        var px = corners[i][0] - size / 2;
        var py = corners[i][1] - size / 2;
        context.fillRect(px, py, size, size);
        context.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);
      }
    }

    function connector(context, x1, y1, x2, y2) {
      var midY = y1 + (y2 - y1) * 0.45;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x1, midY);
      context.lineTo(x2, midY);
      context.lineTo(x2, y2);
      context.strokeStyle = "#2f6bff";
      context.lineWidth = 1.5;
      context.stroke();
    }

    function paintOverlay(state) {
      if (!ctx) return;
      var lay = ensureLayout();
      if (!lay) return;
      ctx.setTransform(lay.dpr, 0, 0, lay.dpr, 0, 0);
      ctx.clearRect(0, 0, layoutWidth, layoutHeight);
      if (state.phase === "scan" && state.scan >= 0) {
        var edge = lay.scanLeft + state.scan * lay.scanWidth;
        var trail = Math.max(lay.scanLeft, edge - lay.scanWidth * 0.28);
        var grad = ctx.createLinearGradient(trail, 0, edge, 0);
        grad.addColorStop(0, "rgba(47, 107, 255, 0)");
        grad.addColorStop(1, "rgba(47, 107, 255, 0.28)");
        ctx.fillStyle = grad;
        ctx.fillRect(trail, lay.scanTop, Math.max(0, edge - trail), lay.scanHeight);
        ctx.strokeStyle = "rgba(31, 42, 68, 0.16)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        var gx;
        for (gx = lay.scanLeft; gx <= lay.scanLeft + lay.scanWidth; gx += 32) {
          ctx.moveTo(gx + 0.5, lay.scanTop);
          ctx.lineTo(gx + 0.5, lay.scanTop + lay.scanHeight);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(250, 246, 234, 0.92)";
        ctx.fillRect(edge, lay.scanTop, 2, lay.scanHeight);
      }
      var now = performance.now();
      if (state.mark !== lastMark) {
        lastMark = state.mark;
        flashUntil = now + 180;
      }
      var hot = now < flashUntil;
      var anchorX = readout.offsetLeft + readout.offsetWidth * 0.5;
      var anchorY = readout.offsetTop + readout.offsetHeight * 0.5;
      if (state.box) {
        var mapped = visibleBox(state.box, lay);
        if (mapped) {
          var grown = growBox(mapped);
          if (readout.offsetWidth > 0) {
            connector(ctx, anchorX, anchorY, grown.x + grown.w / 2, grown.y + grown.h / 2);
          }
          strokeBox(ctx, grown, hot);
        }
      }
      if (state.ui && copy) {
        var sectionRect = section.getBoundingClientRect();
        var copyRect = copy.getBoundingClientRect();
        var uiBox = growBox({
          x: copyRect.left - sectionRect.left - 4,
          y: copyRect.top - sectionRect.top - 4,
          w: copyRect.width + 8,
          h: copyRect.height + 8
        });
        if (readout.offsetWidth > 0) {
          connector(ctx, anchorX, anchorY, uiBox.x + uiBox.w / 2, uiBox.y);
        }
        strokeBox(ctx, uiBox, true);
      }
    }

    function sync(state) {
      if (!state) return;
      if (state.phase === "off") {
        root.hidden = true;
        section.classList.remove("is-assembling", "is-ui");
        section.setAttribute("data-assemble", "static");
        setPlayHidden(false);
        lastPhase = "off";
        return;
      }
      if (state.phase !== lastPhase) {
        section.setAttribute("data-assemble", state.phase);
        section.classList.toggle("is-assembling", state.phase !== "done");
        section.classList.toggle("is-ui", state.phase === "ui");
        setPlayHidden(state.phase !== "ui" && state.phase !== "done");
        if (LIVE[state.phase]) live.textContent = LIVE[state.phase];
        lastPhase = state.phase;
      }
      root.hidden = false;
      if (state.phase === "done") {
        skip.hidden = true;
        readout.hidden = true;
        draw.hidden = true;
        badge.hidden = false;
        return;
      }
      badge.hidden = true;
      skip.hidden = false;
      readout.hidden = state.phase === "ui";
      draw.hidden = false;
      var text = state.phase === "scan" ? "Scanning..." : "pieces " + state.placed + "/" + state.total;
      if (readout.textContent !== text) readout.textContent = text;
      paintOverlay(state);
    }

    function onResize() {
      layout = null;
      layoutWidth = -1;
      placeBadge();
    }

    skip.addEventListener("click", function () {
      if (handlers && handlers.onSkip) handlers.onSkip();
    });
    replay.addEventListener("click", function () {
      if (handlers && handlers.onReplay) handlers.onReplay();
    });
    window.addEventListener("resize", onResize);
    if (narrowQuery.addEventListener) narrowQuery.addEventListener("change", onResize);

    return {
      sync: sync,
      destroy: function () {
        window.removeEventListener("resize", onResize);
        if (narrowQuery.removeEventListener) narrowQuery.removeEventListener("change", onResize);
        if (badge.parentNode) badge.parentNode.removeChild(badge);
        if (root.parentNode) root.parentNode.removeChild(root);
        section.classList.remove("is-assembling", "is-ui");
        setPlayHidden(false);
      }
    };
  }

  window.TownAssemble = { attach: attach };
})();
