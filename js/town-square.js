(function () {
  var canvas = document.querySelector(".town-square-canvas");
  if (!canvas || !canvas.getContext) return;
  var stage = canvas.parentNode;
  if (!stage) return;

  var WORLD_W = 480;
  var WORLD_H = 220;
  var LOOP = 24;
  var world = document.createElement("canvas");
  world.width = WORLD_W;
  world.height = WORLD_H;
  var wctx = world.getContext("2d");
  var view = canvas.getContext("2d");
  if (!wctx || !view) return;

  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reducedQuery.matches;
  var sheets = null;
  var onScreen = false;
  var raf = 0;
  var elapsed = 0;
  var lastStamp = 0;
  var frames = 0;
  var started = false;

  var folk = [
    {
      row: 0,
      robe: "#1f2a44",
      trim: "#faf6ea",
      keys: [
        { t: 0, x: 72, y: 206, face: 1, chat: 1 },
        { t: 4.5, x: 72, y: 206, face: 1 },
        { t: 10, x: 168, y: 206, face: 1 },
        { t: 14, x: 146, y: 198, face: 1, chat: 1 },
        { t: 18, x: 146, y: 198, face: -1 },
        { t: 24, x: 72, y: 206, face: 1 }
      ]
    },
    {
      row: 1,
      robe: "#faf6ea",
      trim: "#7a2e2e",
      keys: [
        { t: 0, x: 104, y: 206, face: -1, chat: 1 },
        { t: 4.5, x: 104, y: 206, face: 1 },
        { t: 11, x: 196, y: 206, face: 1 },
        { t: 14, x: 174, y: 198, face: -1, chat: 1 },
        { t: 18, x: 174, y: 198, face: 1 },
        { t: 24, x: 104, y: 206, face: -1 }
      ]
    },
    {
      row: 2,
      robe: "#2f6b3a",
      trim: "#faf6ea",
      keys: [
        { t: 0, x: 150, y: 218, face: 1 },
        { t: 9, x: 390, y: 218, face: 1 },
        { t: 11, x: 390, y: 218, face: -1 },
        { t: 22, x: 150, y: 218, face: -1 },
        { t: 24, x: 150, y: 218, face: 1 }
      ]
    },
    {
      row: 3,
      robe: "#7a2e2e",
      trim: "#faf6ea",
      keys: [
        { t: 0, x: 292, y: 204 },
        { t: 6, x: 332, y: 204, chat: 1 },
        { t: 11, x: 332, y: 204 },
        { t: 18, x: 268, y: 196 },
        { t: 24, x: 292, y: 204 }
      ]
    },
    {
      row: 4,
      robe: "#b8860b",
      trim: "#1f2a44",
      keys: [
        { t: 0, x: 348, y: 206 },
        { t: 6, x: 368, y: 206, chat: 1 },
        { t: 11, x: 368, y: 206 },
        { t: 20, x: 392, y: 206 },
        { t: 24, x: 348, y: 206 }
      ]
    },
    {
      row: 5,
      robe: "#2b2b2b",
      trim: "#c4a46a",
      keys: [
        { t: 0, x: 436, y: 218, face: -1 },
        { t: 10, x: 462, y: 218, face: 1 },
        { t: 12, x: 462, y: 218, face: -1 },
        { t: 24, x: 436, y: 218, face: -1 }
      ]
    }
  ];

  function box(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function sample(keys, time) {
    var tt = time % LOOP;
    if (tt < 0) tt += LOOP;
    var index = 0;
    var step;
    for (step = 0; step < keys.length - 1; step += 1) {
      if (keys[step + 1].t <= tt) index = step + 1;
    }
    var from = keys[index];
    var to = keys[index + 1] || from;
    var span = to.t - from.t;
    var progress = span > 0 ? (tt - from.t) / span : 0;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    var moving = Math.abs(to.x - from.x) > 0.5 || Math.abs(to.y - from.y) > 0.5;
    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      face: moving ? (to.x >= from.x ? 1 : -1) : (from.face || -1),
      pose: moving ? "walk" : "idle",
      chat: !moving && from.chat ? 1 : 0
    };
  }

  function blit(ctx, id, x, foot, frame, row) {
    if (!sheets || !sheets[id] || !sheets[id].image) return false;
    var sprite = sheets[id];
    var count = sprite.frames || 1;
    var index = count > 1 ? frame % count : 0;
    var sy = (row || 0) * sprite.h;
    if (sy + sprite.h > sprite.image.height) sy = 0;
    ctx.drawImage(sprite.image, index * sprite.w, sy, sprite.w, sprite.h, x, foot - sprite.h, sprite.w, sprite.h);
    return true;
  }

  function drawAcademy(ctx, x, foot) {
    if (blit(ctx, "academy", x, foot, 0, 0)) return;
    var top = foot - 92;
    box(ctx, x + 8, top + 28, 28, 64, "#d7c4a3");
    box(ctx, x + 92, top + 28, 28, 64, "#d7c4a3");
    box(ctx, x + 28, top + 40, 72, 52, "#cbbd9a");
    box(ctx, x + 8, top + 16, 28, 14, "#7a2e2e");
    box(ctx, x + 92, top + 16, 28, 14, "#7a2e2e");
    box(ctx, x + 16, top + 8, 12, 10, "#1f2a44");
    box(ctx, x + 100, top + 8, 12, 10, "#1f2a44");
    box(ctx, x + 18, top, 8, 10, "#b8860b");
    box(ctx, x + 36, top + 28, 56, 10, "#7a2e2e");
    box(ctx, x + 44, top + 20, 40, 10, "#8d3a3a");
    box(ctx, x + 52, foot - 28, 24, 28, "#1f2a44");
    box(ctx, x + 58, foot - 22, 12, 16, "#141c30");
    box(ctx, x + 16, top + 36, 12, 14, "#e6c15a");
    box(ctx, x + 100, top + 36, 12, 14, "#e6c15a");
    box(ctx, x + 40, top + 52, 14, 12, "#e6c15a");
    box(ctx, x + 74, top + 52, 14, 12, "#e6c15a");
    box(ctx, x + 20, foot - 6, 88, 6, "#8d7b62");
  }

  function drawHouse(ctx, x, foot, roof) {
    if (blit(ctx, "house", x, foot, 0, 0)) return;
    var top = foot - 58;
    box(ctx, x + 6, top + 22, 56, 36, "#e4d3b4");
    box(ctx, x + 4, top + 14, 60, 10, roof);
    box(ctx, x + 14, top + 6, 40, 10, roof);
    box(ctx, x + 24, top, 16, 8, roof);
    box(ctx, x + 44, top + 8, 8, 18, "#6e6256");
    box(ctx, x + 12, top + 32, 12, 12, "#1f2a44");
    box(ctx, x + 44, top + 32, 12, 12, "#1f2a44");
    box(ctx, x + 14, top + 34, 8, 8, "#e6c15a");
    box(ctx, x + 46, top + 34, 8, 8, "#e6c15a");
    box(ctx, x + 28, foot - 18, 12, 18, "#7a2e2e");
  }

  function drawStall(ctx, x, foot) {
    if (blit(ctx, "stall", x, foot, 0, 0)) return;
    box(ctx, x + 4, foot - 28, 4, 28, "#6e5340");
    box(ctx, x + 40, foot - 28, 4, 28, "#6e5340");
    box(ctx, x + 2, foot - 34, 44, 8, "#faf6ea");
    box(ctx, x + 2, foot - 30, 44, 4, "#7a2e2e");
    box(ctx, x + 6, foot - 18, 36, 8, "#c4a46a");
  }

  function drawTree(ctx, x, foot) {
    if (blit(ctx, "tree", x, foot, 0, 0)) return;
    box(ctx, x + 14, foot - 22, 8, 22, "#6e5340");
    box(ctx, x + 6, foot - 36, 24, 18, "#2f6b3a");
    box(ctx, x + 2, foot - 46, 32, 14, "#3e8a4a");
    box(ctx, x + 10, foot - 54, 16, 12, "#2f6b3a");
  }

  function drawLamp(ctx, x, foot, time) {
    if (blit(ctx, "lamp", x, foot, Math.floor(time * 4) % 2, 0)) return;
    box(ctx, x + 5, foot - 36, 4, 36, "#2b2b2b");
    box(ctx, x, foot - 44, 14, 8, "#1f2a44");
    var glow = reduced ? "#e6c15a" : (Math.floor(time * 5) % 2 === 0 ? "#faf6ea" : "#e6c15a");
    box(ctx, x + 3, foot - 42, 8, 5, glow);
  }

  function drawTorch(ctx, x, foot, time) {
    var frame = reduced ? 0 : Math.floor(time * 8) % 2;
    if (blit(ctx, "torch", x, foot, frame, 0)) return;
    box(ctx, x + 4, foot - 16, 3, 16, "#6e5340");
    box(ctx, x + 2, foot - 22, 7, 6, frame ? "#e6c15a" : "#d2691e");
    box(ctx, x + 4, foot - 26, 3, 5, frame ? "#faf6ea" : "#e6c15a");
  }

  function drawBench(ctx, x, foot) {
    if (blit(ctx, "bench", x, foot, 0, 0)) return;
    box(ctx, x + 2, foot - 10, 32, 4, "#8d6a45");
    box(ctx, x, foot - 16, 36, 4, "#a67c52");
    box(ctx, x + 4, foot - 6, 3, 6, "#6e5340");
    box(ctx, x + 29, foot - 6, 3, 6, "#6e5340");
  }

  function drawFountain(ctx, x, foot, time) {
    var frame = reduced ? 0 : Math.floor(time * 3) % 3;
    if (blit(ctx, "fountain", x, foot, frame, 0)) return;
    box(ctx, x + 4, foot - 14, 56, 14, "#d7c4a3");
    box(ctx, x + 8, foot - 22, 48, 10, "#7ea4b8");
    box(ctx, x + 28, foot - 34, 8, 16, "#cbbd9a");
    box(ctx, x + 24, foot - 38, 16, 6, "#e6c15a");
    var drop = frame * 4;
    box(ctx, x + 18 + drop, foot - 18, 3, 3, "#faf6ea");
    box(ctx, x + 40 - drop, foot - 16, 3, 3, "#d7eef5");
  }

  function drawPerson(ctx, person, state, time) {
    var frame = state.pose === "walk" && !reduced ? Math.floor(time * 6) % 4 : 0;
    var height = 24;
    if (sheets && sheets.folk && sheets.folk.image) {
      var sprite = sheets.folk;
      var count = sprite.frames || 1;
      var index = count > 1 ? frame % count : 0;
      var sy = person.row * sprite.h;
      if (sy + sprite.h > sprite.image.height) sy = 0;
      var dx = state.x - Math.round(sprite.w / 2);
      var dy = state.y - sprite.h;
      if (state.face < 0) {
        ctx.save();
        ctx.translate(state.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite.image, index * sprite.w, sy, sprite.w, sprite.h, -Math.round(sprite.w / 2), dy, sprite.w, sprite.h);
        ctx.restore();
      } else {
        ctx.drawImage(sprite.image, index * sprite.w, sy, sprite.w, sprite.h, dx, dy, sprite.w, sprite.h);
      }
      if (state.chat) drawBubble(ctx, state.x, dy - 2);
      return height;
    }
    var x = state.x;
    var y = state.y;
    var bob = state.pose === "walk" && !reduced ? (frame % 2) : 0;
    box(ctx, x - 5, y - 2, 10, 2, "rgba(20, 16, 12, 0.35)");
    var leg = state.pose === "walk" ? (frame % 2 ? -2 : 2) : 0;
    box(ctx, x - 4, y - 8, 3, 6, "#2b2b2b");
    box(ctx, x + 1, y - 8, 3, 6, "#2b2b2b");
    if (leg) {
      box(ctx, x - 4 + (leg < 0 ? -1 : 0), y - 4, 3, 3, "#2b2b2b");
      box(ctx, x + 1 + (leg > 0 ? 1 : 0), y - 4, 3, 3, "#2b2b2b");
    }
    box(ctx, x - 5, y - 18 - bob, 10, 11, person.robe);
    box(ctx, x - 4, y - 22 - bob, 8, 5, "#e6c4a4");
    box(ctx, x - 5, y - 24 - bob, 10, 3, person.trim);
    if (state.face > 0) box(ctx, x + 1, y - 21 - bob, 2, 2, "#1f2a44");
    else box(ctx, x - 3, y - 21 - bob, 2, 2, "#1f2a44");
    if (state.chat) drawBubble(ctx, x, y - 28 - bob);
    return height;
  }

  function drawBubble(ctx, x, top) {
    box(ctx, x - 8, top - 10, 16, 8, "#faf6ea");
    box(ctx, x - 2, top - 2, 2, 2, "#faf6ea");
    box(ctx, x - 5, top - 7, 2, 2, "#1f2a44");
    box(ctx, x - 1, top - 7, 2, 2, "#1f2a44");
    box(ctx, x + 3, top - 7, 2, 2, "#1f2a44");
  }

  function drawGround(ctx) {
    var y;
    var x;
    box(ctx, 0, 0, WORLD_W, 108, "#243456");
    box(ctx, 0, 96, WORLD_W, 16, "#3c4e62");
    box(ctx, 0, 108, WORLD_W, 20, "#3d6b40");
    for (y = 124; y < WORLD_H; y += 8) {
      for (x = 0; x < WORLD_W; x += 8) {
        var n = (x * 3 + y * 5) & 3;
        var tone = n === 0 ? "#6e6458" : n === 1 ? "#7d7364" : n === 2 ? "#5f564c" : "#8a7d6c";
        box(ctx, x, y, 8, 8, tone);
      }
    }
    box(ctx, 0, 148, WORLD_W, 4, "#5c5348");
  }

  function drawTown(time) {
    drawGround(wctx);
    var drawables = [
      { y: 122, draw: function () { drawTree(wctx, 8, 122); } },
      { y: 120, draw: function () { drawTree(wctx, 438, 120); } },
      { y: 128, draw: function () { drawHouse(wctx, 28, 128, "#7a2e2e"); } },
      { y: 126, draw: function () { drawHouse(wctx, 378, 126, "#5c4033"); } },
      { y: 136, draw: function () { drawAcademy(wctx, 176, 136); } },
      { y: 150, draw: function () { drawTree(wctx, 118, 150); } },
      { y: 148, draw: function () { drawTree(wctx, 330, 148); } },
      { y: 158, draw: function () { drawStall(wctx, 46, 158); } },
      { y: 156, draw: function () { drawStall(wctx, 372, 156); } },
      { y: 166, draw: function () { drawTorch(wctx, 162, 166, time); } },
      { y: 166, draw: function () { drawTorch(wctx, 308, 166, time); } },
      { y: 170, draw: function () { drawLamp(wctx, 104, 170, time); } },
      { y: 168, draw: function () { drawLamp(wctx, 348, 168, time); } },
      { y: 186, draw: function () { drawBench(wctx, 78, 186); } },
      { y: 184, draw: function () { drawBench(wctx, 360, 184); } },
      { y: 190, draw: function () { drawFountain(wctx, 208, 190, time); } }
    ];
    var i;
    for (i = 0; i < folk.length; i += 1) {
      var state = reduced ? sample(folk[i].keys, 0) : sample(folk[i].keys, time);
      folk[i].state = state;
      drawables.push({
        y: state.y,
        person: folk[i],
        state: state
      });
    }
    drawables.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < drawables.length; i += 1) {
      if (drawables[i].draw) drawables[i].draw();
      else drawPerson(wctx, drawables[i].person, drawables[i].state, reduced ? 0 : time);
    }
  }

  function present() {
    var cssW = stage.clientWidth;
    var cssH = stage.clientHeight;
    if (!cssW || !cssH) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var bw = Math.max(1, Math.round(cssW * dpr));
    var bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    view.imageSmoothingEnabled = false;
    var scale = Math.max(bw / WORLD_W, bh / WORLD_H);
    var srcW = bw / scale;
    var srcH = bh / scale;
    var sx = (WORLD_W - srcW) / 2;
    var sy = WORLD_H - srcH;
    if (sx < 0) sx = 0;
    if (sy < 0) sy = 0;
    if (sx + srcW > WORLD_W) srcW = WORLD_W - sx;
    if (sy + srcH > WORLD_H) srcH = WORLD_H - sy;
    view.clearRect(0, 0, bw, bh);
    view.drawImage(world, sx, sy, srcW, srcH, 0, 0, bw, bh);
    return true;
  }

  function paint(time) {
    drawTown(time);
    if (!present()) return false;
    canvas.setAttribute("data-town-frame", String(frames));
    canvas.setAttribute("data-town-motion", reduced ? "static" : (started && onScreen ? "live" : "paused"));
    document.documentElement.setAttribute("data-town-ready", "1");
    return true;
  }

  function stop() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    lastStamp = 0;
  }

  function tick(now) {
    raf = 0;
    if (reduced || !onScreen || document.hidden) {
      paint(reduced ? 0 : elapsed);
      return;
    }
    if (!lastStamp) lastStamp = now;
    var step = Math.min(0.05, (now - lastStamp) / 1000);
    lastStamp = now;
    elapsed += step;
    frames += 1;
    started = true;
    paint(elapsed);
    raf = window.requestAnimationFrame(tick);
  }

  function arm() {
    if (reduced || raf || !onScreen || document.hidden) return;
    raf = window.requestAnimationFrame(tick);
  }

  function watch() {
    if (!("IntersectionObserver" in window)) {
      onScreen = true;
      arm();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      onScreen = entries.some(function (entry) { return entry.isIntersecting; });
      if (onScreen) arm();
      else stop();
    }, { rootMargin: "64px 0px" });
    io.observe(stage);
  }

  if (!paint(0)) {
    window.requestAnimationFrame(function () { paint(reduced ? 0 : elapsed); });
  }
  canvas.setAttribute("data-art-used", "greybox");
  window.addEventListener("resize", function () { paint(reduced ? 0 : elapsed); });
  if (!reduced) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(function () { watch(); }, { timeout: 700 });
    } else {
      window.setTimeout(watch, 280);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else arm();
    });
  }
  if (reducedQuery.addEventListener) {
    reducedQuery.addEventListener("change", function () {
      reduced = reducedQuery.matches;
      if (reduced) {
        stop();
        elapsed = 0;
        paint(0);
      } else {
        watch();
      }
    });
  }

  if (canvas.getAttribute("data-art") !== "sheets") return;
  var manifestUrl = canvas.getAttribute("data-sheets");
  if (!manifestUrl) return;
  fetch(manifestUrl).then(function (res) {
    if (!res.ok) return null;
    return res.json();
  }).then(function (manifest) {
    if (!manifest || manifest.version !== 1 || !manifest.sprites) return null;
    var base = manifestUrl.replace(/[^/]+$/, "");
    var ids = Object.keys(manifest.sprites);
    return Promise.all(ids.map(function (id) {
      var spec = manifest.sprites[id];
      if (!spec || typeof spec.src !== "string") return null;
      if (/[\\/]/.test(spec.src) || spec.src.indexOf("..") !== -1) return null;
      if (!/\.(png|webp)$/i.test(spec.src)) return null;
      return new Promise(function (resolve) {
        var image = new Image();
        image.decoding = "async";
        image.onload = function () {
          sheets = sheets || {};
          sheets[id] = {
            image: image,
            w: spec.w || image.width,
            h: spec.h || image.height,
            frames: spec.frames || 1
          };
          resolve(true);
        };
        image.onerror = function () { resolve(false); };
        image.src = base + spec.src;
      });
    }));
  }).then(function (loaded) {
    if (!loaded) return;
    canvas.setAttribute("data-art-used", "sheets");
    paint(reduced ? 0 : elapsed);
  }).catch(function () {
    canvas.setAttribute("data-art-used", "greybox");
  });
})();
