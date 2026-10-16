(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");
  var label = toggle ? toggle.querySelector(".nav-toggle-label") : null;

  function setOpen(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (label) label.textContent = open ? "Close" : "Menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1000) setOpen(false);
    });
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector("[data-thanks]");
      var error = form.querySelector("[data-form-error]");
      if (typeof form.reportValidity === "function" && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var honey = form.querySelector("[name='_honey']");
      if (honey && honey.value) return;
      var config = window.GQ_FORMS || {};
      var inbox = config[form.getAttribute("data-form")];
      var endpoint = config.endpoint;
      function showError() {
        if (note) note.hidden = true;
        if (error) {
          error.hidden = false;
          error.focus();
        }
      }
      if (!inbox || !endpoint) {
        showError();
        return;
      }
      var data = {};
      new FormData(form).forEach(function (value, name) {
        if (name === "_honey") return;
        data[name] = value;
      });
      var button = form.querySelector("[type='submit']");
      if (button) button.disabled = true;
      fetch(endpoint + encodeURIComponent(inbox), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(data)
      }).then(function (response) {
        if (!response.ok) throw new Error("send");
        return response.json();
      }).then(function (body) {
        var ok = body && (body.success === true || body.success === "true");
        if (!ok) throw new Error("send");
        if (error) error.hidden = true;
        if (note) {
          note.hidden = false;
          note.focus();
        }
        form.reset();
      }).catch(showError).then(function () {
        if (button) button.disabled = false;
      });
    });
  });

  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var parent = link.parentElement;
      if (!parent || parent.querySelector(":scope > .link-note")) return;
      var note = document.createElement("div");
      note.className = "link-note";
      note.setAttribute("role", "status");
      note.textContent = "That link is not open yet.";
      link.insertAdjacentElement("afterend", note);
    });
  });

  document.querySelectorAll(".btn-soon").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var kickCast = function () {};

  function setupReveal() {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("main > section, main > .cover, main > .page-hero")
    );
    if (!nodes.length) return;
    var canObserve = !reduceMotion && "IntersectionObserver" in window;
    nodes.forEach(function (el, index) {
      el.classList.add("reveal");
      if (!canObserve || index === 0) el.classList.add("is-in");
    });
    if (!canObserve) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.01 });
    nodes.forEach(function (el) {
      if (!el.classList.contains("is-in")) io.observe(el);
    });
  }

  function setupTypewriter() {
    var slot = document.querySelector(".tagline-type");
    if (!slot || reduceMotion) return;
    document.documentElement.classList.add("motion");
    var lead = "Write your own legend. ";
    var rest = "Learn it. Live it. PROVE IT!";
    var full = lead + rest;
    var i = 0;
    function tick() {
      i += 1;
      var shown = full.slice(0, i);
      slot.textContent = "";
      var leadEl = document.createElement("span");
      leadEl.className = "h1-lead";
      leadEl.textContent = shown.slice(0, Math.min(shown.length, lead.length));
      slot.appendChild(leadEl);
      if (shown.length > lead.length) {
        var restEl = document.createElement("span");
        restEl.className = "h1-rest";
        restEl.textContent = shown.slice(lead.length);
        slot.appendChild(restEl);
      }
      if (i < full.length) {
        var caret = document.createElement("span");
        caret.className = "caret";
        slot.appendChild(caret);
        window.setTimeout(tick, 32);
      }
    }
    tick();
  }

  function setupParallax() {
    var scene = document.querySelector(".qh-scene");
    if (!scene) return;
    var frame = scene.querySelector(".qh-panorama");
    // Sprite boxes stay between these panorama pixels (Bramble's left side, Rudy's right side).
    var castLeft = 160;
    var castRight = 1140;
    function layout(pass) {
      if (!frame) return;
      var width = scene.clientWidth;
      if (!width) return;
      var origin = (1280 - width) / 2;
      var showsCast = origin <= castLeft && origin + width >= castRight;
      if (showsCast) {
        scene.classList.remove("is-fit");
        scene.style.height = "";
        frame.style.transform = "";
        scene.scrollLeft = Math.round(Math.max(0, origin));
        return;
      }
      var scale = width / 1280;
      scene.classList.add("is-fit");
      frame.style.transformOrigin = "top left";
      frame.style.transform = "scale(" + scale + ")";
      scene.style.height = Math.round(448 * scale + 8) + "px";
      scene.scrollLeft = 0;
      if (!pass && scene.clientWidth !== width) layout(true);
    }
    layout(false);
    window.addEventListener("resize", function () { layout(false); });
    if (reduceMotion) return;
    var layers = scene.querySelectorAll("[data-parallax]");
    var ticking = false;
    function apply() {
      var rect = scene.getBoundingClientRect();
      var viewH = window.innerHeight || document.documentElement.clientHeight;
      var delta = rect.top + rect.height / 2 - viewH * 0.42;
      var shift = Math.max(-36, Math.min(36, -delta * 0.06));
      layers.forEach(function (layer) {
        var depth = Number(layer.getAttribute("data-parallax")) || 0;
        layer.style.transform = "translate3d(0," + (shift * depth).toFixed(2) + "px,0)";
      });
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  function setupScenePause() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".qh-scene, .play-stage"));
    if (!nodes.length || reduceMotion) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) { el.classList.add("is-live"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-live", entry.isIntersecting);
      });
      kickCast();
    }, { rootMargin: "64px 0px" });
    nodes.forEach(function (el) { io.observe(el); });
  }

  function setupPlayFit() {
    var fit = document.querySelector(".play-fit");
    var panorama = fit ? fit.querySelector(".play-panorama") : null;
    if (!fit || !panorama) return;
    function apply() {
      var width = fit.clientWidth;
      var height = fit.clientHeight;
      if (!width || !height) return;
      var scale = Math.min(width / 1280, height / 512);
      panorama.style.setProperty("--play-scale", String(Math.round(scale * 1000) / 1000));
    }
    apply();
    if ("ResizeObserver" in window) {
      var observer = new ResizeObserver(apply);
      observer.observe(fit);
    } else {
      window.addEventListener("resize", apply);
    }
  }

  function setupTownCast() {
    if (reduceMotion) return;
    var casts = Array.prototype.slice.call(document.querySelectorAll("[data-cast]"));
    if (!casts.length) return;
    var loop = 40;
    var script = {
      bramble: [
        { t: 0, x: 96, face: "east" },
        { t: 2.6, x: 96, face: "east" },
        { t: 9.2, x: 146, face: "east", chat: "bubble" },
        { t: 12.2, x: 146, face: "east" },
        { t: 20.4, x: 96, face: "west" },
        { t: 24, x: 96, face: "east" },
        { t: 30, x: 132, face: "east" },
        { t: 36, x: 96, face: "west" },
        { t: 40, x: 96, face: "east" }
      ],
      brittany: [
        { t: 0, x: 200, face: "west" },
        { t: 5, x: 200, face: "west" },
        { t: 9.2, x: 171, face: "west", chat: "bubble" },
        { t: 12.2, x: 171, face: "west" },
        { t: 16.4, x: 200, face: "east" },
        { t: 20, x: 200, face: "west" },
        { t: 24.2, x: 172, face: "west" },
        { t: 28, x: 172, face: "east" },
        { t: 33, x: 200, face: "east" },
        { t: 40, x: 200, face: "west" }
      ],
      ruth: [
        { t: 0, x: 268, face: "west" },
        { t: 2, x: 268, face: "west" },
        { t: 6.6, x: 236, face: "west" },
        { t: 10, x: 236, face: "east" },
        { t: 14.6, x: 268, face: "east" },
        { t: 20.2, x: 268, face: "west" },
        { t: 23, x: 250, face: "east", chat: "bubble" },
        { t: 26, x: 250, face: "east" },
        { t: 28.8, x: 268, face: "east" },
        { t: 40, x: 268, face: "west" }
      ],
      winston: [
        { t: 0, x: 320, face: "west" },
        { t: 2.8, x: 320, face: "west" },
        { t: 6, x: 300, face: "west" },
        { t: 9, x: 300, face: "east" },
        { t: 12.2, x: 320, face: "east" },
        { t: 16.2, x: 320, face: "west" },
        { t: 23, x: 280, face: "west", chat: "bubble" },
        { t: 26, x: 280, face: "east" },
        { t: 32, x: 320, face: "east" },
        { t: 40, x: 320, face: "west" }
      ],
      merlin: [
        { t: 0, x: 360, face: "east" },
        { t: 2.6, x: 378, face: "east" },
        { t: 5.4, x: 378, face: "west" },
        { t: 8, x: 360, face: "west" },
        { t: 11, x: 360, face: "east" },
        { t: 13.6, x: 378, face: "east" },
        { t: 16, x: 378, face: "east", chat: "wave" },
        { t: 19, x: 378, face: "east" },
        { t: 21.6, x: 360, face: "west" },
        { t: 40, x: 360, face: "east" }
      ],
      tahne: [
        { t: 0, x: 448, face: "west" },
        { t: 5.2, x: 412, face: "west" },
        { t: 8.4, x: 412, face: "east" },
        { t: 11.6, x: 436, face: "east" },
        { t: 16, x: 412, face: "west", chat: "wave" },
        { t: 19, x: 412, face: "west" },
        { t: 26.8, x: 470, face: "east" },
        { t: 30, x: 470, face: "east", chat: "wave" },
        { t: 33, x: 470, face: "east" },
        { t: 37.2, x: 448, face: "west" },
        { t: 40, x: 448, face: "west" }
      ],
      rudy: [
        { t: 0, x: 548, face: "west" },
        { t: 6.6, x: 508, face: "west" },
        { t: 10, x: 508, face: "east" },
        { t: 16.6, x: 560, face: "east" },
        { t: 20, x: 560, face: "west" },
        { t: 27.4, x: 502, face: "west" },
        { t: 30, x: 502, face: "west", chat: "wave" },
        { t: 33, x: 502, face: "west" },
        { t: 40, x: 548, face: "east" }
      ]
    };

    function sample(keys, time) {
      var tt = time % loop;
      if (tt < 0) tt += loop;
      var index = 0;
      var step;
      for (step = 0; step < keys.length - 1; step += 1) {
        if (keys[step + 1].t <= tt) index = step + 1;
      }
      var from = keys[index];
      var to = keys[index + 1] || from;
      var span = to.t - from.t;
      var progress = span > 0 ? (tt - from.t) / span : 0;
      var moving = Math.abs(to.x - from.x) > 0.5;
      return {
        x: from.x + (to.x - from.x) * progress,
        face: moving ? (to.x >= from.x ? "east" : "west") : from.face,
        pose: moving ? "walk" : "idle",
        chat: !moving && from.chat ? from.chat : ""
      };
    }

    var idlePace = { bramble: 2.5, merlin: 2.9, tahne: 2.7, winston: 2.6 };
    var idlePhase = { merlin: 0.55, tahne: 1.05 };
    var strips = {};
    var castReady = false;

    function sheetInfo(sprite, face, pose) {
      sprite.setAttribute("data-face", face);
      sprite.setAttribute("data-pose", pose);
      var style = getComputedStyle(sprite);
      var image = style.backgroundImage || "";
      var match = /url\(["']?([^"')]+)["']?\)/.exec(image);
      var cell = parseFloat(style.getPropertyValue("--cell-w"));
      var height = parseFloat(style.getPropertyValue("--cell-h"));
      var sheet = parseFloat(style.getPropertyValue("--sheet"));
      return {
        face: face,
        pose: pose,
        url: match ? match[1] : "",
        cell: cell,
        height: height,
        frames: Math.round(sheet / (cell * 2))
      };
    }

    function loadImage(url) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.decoding = "sync";
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error("sprite")); };
        img.src = url;
      });
    }

    function measureSheets(sprite) {
      var actor = sprite.closest(".qh-actor");
      var ghost = actor.cloneNode(true);
      ghost.setAttribute("aria-hidden", "true");
      ghost.style.visibility = "hidden";
      ghost.style.pointerEvents = "none";
      document.body.appendChild(ghost);
      var ghostSprite = ghost.querySelector("[data-sprite]");
      var parts = [
        sheetInfo(ghostSprite, "east", "idle"),
        sheetInfo(ghostSprite, "east", "walk"),
        sheetInfo(ghostSprite, "west", "idle"),
        sheetInfo(ghostSprite, "west", "walk")
      ];
      ghost.remove();
      return parts;
    }

    function buildStrip(who, sprite) {
      var parts = measureSheets(sprite);
      return Promise.all(parts.map(function (part) {
        return loadImage(part.url).then(function (img) {
          return { part: part, img: img };
        });
      })).then(function (loaded) {
        var cell = loaded[0].part.cell;
        var height = loaded[0].part.height;
        var total = 0;
        var i;
        for (i = 0; i < loaded.length; i += 1) total += loaded[i].part.frames;
        var canvas = document.createElement("canvas");
        canvas.width = cell * total;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("sprite");
        ctx.imageSmoothingEnabled = false;
        var origin = {};
        var frameAt = 0;
        for (i = 0; i < loaded.length; i += 1) {
          var item = loaded[i];
          var frames = item.part.frames;
          if (item.img.naturalWidth !== cell * frames || item.img.naturalHeight !== height) {
            throw new Error("sprite");
          }
          origin[item.part.face + "-" + item.part.pose] = frameAt;
          ctx.drawImage(item.img, frameAt * cell, 0);
          frameAt += frames;
        }
        strips[who] = {
          url: canvas.toDataURL("image/png"),
          width: canvas.width * 2,
          height: canvas.height * 2,
          origin: origin,
          idleFrames: loaded[0].part.frames,
          walkFrames: loaded[1].part.frames
        };
      });
    }

    function applyStrip(sprite, who) {
      var strip = strips[who];
      if (!strip) return;
      sprite.style.animation = "none";
      sprite.style.backgroundRepeat = "no-repeat";
      sprite.style.backgroundImage = 'url("' + strip.url + '")';
      sprite.style.backgroundSize = strip.width + "px " + strip.height + "px";
      sprite.style.backgroundPosition = "0 0";
    }

    function stepFrame(sprite, who, face, pose, time) {
      var strip = strips[who];
      if (!strip) return;
      var frames = pose === "walk" ? strip.walkFrames : strip.idleFrames;
      var index = 0;
      if (frames > 1) {
        var dur = pose === "walk" ? 1.1 : (idlePace[who] || 2.6);
        var phase = pose === "walk" ? 0 : (idlePhase[who] || 0);
        var t = (time + phase) % dur;
        if (t < 0) t += dur;
        index = Math.floor((t / dur) * frames);
        if (index >= frames) index = frames - 1;
      }
      var origin = strip.origin[face + "-" + pose] || 0;
      // Idle and walk already share this image, so a pose change cannot
      // leave the window on an empty cell of a shorter sheet.
      sprite.style.backgroundPositionX = "calc(var(--cell-w) * " + ((origin + index) * -2) + "px)";
    }

    function paint(cast, time) {
      if (!castReady) return;
      Array.prototype.forEach.call(cast.querySelectorAll(".qh-actor"), function (actor) {
        var who = actor.getAttribute("data-who");
        var keys = script[who];
        var sprite = actor.querySelector("[data-sprite]");
        if (!keys || !sprite || !strips[who]) return;
        var state = sample(keys, time);
        var x = Math.max(72, Math.min(590, state.x));
        actor.style.setProperty("--x", x.toFixed(2));
        sprite.setAttribute("data-face", state.face);
        sprite.setAttribute("data-pose", state.pose);
        sprite.classList.toggle("is-walk", state.pose === "walk");
        stepFrame(sprite, who, state.face, state.pose, time);
        actor.classList.toggle("is-chat", state.chat !== "");
        var emote = sprite.querySelector(".qh-emote");
        if (emote && state.chat) emote.setAttribute("data-kind", state.chat);
      });
    }

    function live(cast) {
      var root = cast.closest(".qh-scene, .play-stage");
      return !root || root.classList.contains("is-live");
    }

    var frame = 0;
    function tick(now) {
      var any = false;
      casts.forEach(function (cast) {
        if (!live(cast)) return;
        any = true;
        paint(cast, now / 1000);
      });
      frame = any ? window.requestAnimationFrame(tick) : 0;
    }

    kickCast = function () {
      if (!castReady || frame || document.hidden) return;
      frame = window.requestAnimationFrame(tick);
    };

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      kickCast();
    });

    var pending = [];
    var seenWho = {};
    casts.forEach(function (cast) {
      Array.prototype.forEach.call(cast.querySelectorAll(".qh-actor"), function (actor) {
        var who = actor.getAttribute("data-who");
        var sprite = actor.querySelector("[data-sprite]");
        if (!who || !sprite || seenWho[who]) return;
        seenWho[who] = true;
        pending.push(buildStrip(who, sprite));
      });
    });
    Promise.all(pending).then(function () {
      casts.forEach(function (cast) {
        Array.prototype.forEach.call(cast.querySelectorAll(".qh-actor"), function (actor) {
          var who = actor.getAttribute("data-who");
          var sprite = actor.querySelector("[data-sprite]");
          if (who && sprite) applyStrip(sprite, who);
        });
      });
      castReady = true;
      document.documentElement.setAttribute("data-cast-ready", "1");
      kickCast();
    }).catch(function (err) {
      document.documentElement.setAttribute("data-cast-error", String(err && err.message ? err.message : err));
    });
  }

  function setupPlayDemo() {
    var stage = document.querySelector("[data-play-stage]");
    if (!stage) return;
    var poster = stage.querySelector("[data-play-load]");
    if (!poster) return;
    poster.addEventListener("click", function () {
      if (stage.querySelector("iframe")) return;
      var frame = document.createElement("iframe");
      frame.src = "https://play.griffinandquill.com";
      frame.title = "Quillhaven demo";
      frame.allow = "fullscreen";
      frame.allowFullscreen = true;
      stage.appendChild(frame);
      poster.hidden = true;
    });
  }

  function setupGryphonFlight() {
    var flight = document.querySelector(".accent-flight");
    var bird = flight ? flight.querySelector(".accent-gryphon") : null;
    if (!flight || !bird || reduceMotion) return;

    var place = flight.getBoundingClientRect();
    flight.classList.add("is-flying");
    document.body.appendChild(flight);
    var x = place.left;
    var y = place.top;
    var heading = 1;
    var from = { x: x, y: y };
    var to = { x: x, y: y };
    var c1 = { x: x, y: y };
    var c2 = { x: x, y: y };
    var tangent = { x: 1, y: 0 };
    var start = 0;
    var duration = 0;
    var paused = document.hidden;
    var raf = 0;

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function bounds() {
      var w = flight.offsetWidth || 106;
      var h = flight.offsetHeight || 42;
      return {
        minX: 8,
        minY: 8,
        maxX: Math.max(8, window.innerWidth - w - 8),
        maxY: Math.max(8, window.innerHeight - h - 8),
      };
    }

    function clamp(point, box) {
      return {
        x: Math.min(box.maxX, Math.max(box.minX, point.x)),
        y: Math.min(box.maxY, Math.max(box.minY, point.y)),
      };
    }

    function waypoint(origin) {
      var box = bounds();
      var spot = { x: origin.x, y: origin.y };
      var i;
      for (i = 0; i < 8; i += 1) {
        spot = { x: rand(box.minX, box.maxX), y: rand(box.minY, box.maxY) };
        if (Math.hypot(spot.x - origin.x, spot.y - origin.y) > 110) return spot;
      }
      return spot;
    }

    function arm(now) {
      var box = bounds();
      from = clamp({ x: x, y: y }, box);
      x = from.x;
      y = from.y;
      to = waypoint(from);
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var dist = Math.hypot(dx, dy) || 1;
      var span = Math.hypot(tangent.x, tangent.y) || 1;
      var lead = Math.min(dist * 0.42, 130);
      c1 = clamp({
        x: from.x + (tangent.x / span) * lead,
        y: from.y + (tangent.y / span) * lead,
      }, box);
      var angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1;
      var outX = Math.cos(angle);
      var outY = Math.sin(angle);
      c2 = clamp({
        x: to.x - outX * lead * 0.75,
        y: to.y - outY * lead * 0.75,
      }, box);
      tangent = { x: outX, y: outY };
      duration = Math.max(3400, (dist / 62) * 1000);
      start = now;
    }

    function cubic(t, a, b, c, d) {
      var u = 1 - t;
      return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
    }

    function paint() {
      var face = heading < 0 ? " scaleX(-1)" : "";
      flight.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      bird.style.transform = "translate3d(0,0,0)" + face;
    }

    function frame(now) {
      if (paused) {
        raf = 0;
        return;
      }
      if (!duration) arm(now);
      var t = (now - start) / duration;
      if (t >= 1) {
        x = to.x;
        y = to.y;
        arm(now);
        t = 0;
      }
      var px = cubic(t, from.x, c1.x, c2.x, to.x);
      var py = cubic(t, from.y, c1.y, c2.y, to.y);
      var box = bounds();
      var outside = px < box.minX || py < box.minY || px > box.maxX || py > box.maxY;
      if (outside) {
        x = Math.min(box.maxX, Math.max(box.minX, px));
        y = Math.min(box.maxY, Math.max(box.minY, py));
        duration = 0;
        paint();
        raf = window.requestAnimationFrame(frame);
        return;
      }
      var vx = px - x;
      if (vx > 0.35) heading = -1;
      else if (vx < -0.35) heading = 1;
      x = px;
      y = py;
      paint();
      raf = window.requestAnimationFrame(frame);
    }

    document.addEventListener("visibilitychange", function () {
      paused = document.hidden;
      if (paused || raf) return;
      duration = 0;
      raf = window.requestAnimationFrame(frame);
    });

    x = Math.min(bounds().maxX, Math.max(bounds().minX, x));
    y = Math.min(bounds().maxY, Math.max(bounds().minY, y));
    paint();
    raf = window.requestAnimationFrame(frame);
  }

  setupReveal();
  setupTypewriter();
  setupParallax();
  setupScenePause();
  setupPlayFit();
  setupTownCast();
  setupPlayDemo();
  setupGryphonFlight();
})();
