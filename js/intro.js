/* Home-page gryphon fly-in. First visit only.
   Replay with ?intro=1. Skips on click, tap, or keypress, and does not
   run when prefers-reduced-motion is set. Motion uses the Web Animations
   API (transform and opacity only) and lands with a FLIP measure of the
   header mark so the last frame matches that box.
   Knobs: DURATION, START_SCALE, the swoop bow, and the wing up/down degrees. */
(function () {
  "use strict";

  var STORAGE_KEY = "gq-intro-seen";
  var DURATION = 1850;
  var START_SCALE = 3.6;
  var root = document.documentElement;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function introForced() {
    try {
      return new URLSearchParams(window.location.search).get("intro") === "1";
    } catch (err) {
      return false;
    }
  }

  function hasSeenIntro() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return true;
    }
  }

  function markSeen() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch (err) {
      /* Private mode can block storage. The visit still finishes. */
    }
  }

  function clearIntroClasses() {
    root.classList.remove("intro-pending");
    root.classList.remove("intro-landed");
  }

  if (!root.classList.contains("intro-pending")) return;
  if (prefersReducedMotion() || (!introForced() && hasSeenIntro())) {
    clearIntroClasses();
    return;
  }

  var mark = document.querySelector("[data-logo-mark]");
  var wordmark = document.querySelector(".brand > .wordmark");
  if (!mark || typeof mark.animate !== "function") {
    clearIntroClasses();
    return;
  }

  var svg = mark.querySelector("svg");
  if (!svg) {
    clearIntroClasses();
    return;
  }

  var phase = "fly";
  var generation = 0;
  var flyAnim = null;
  var blurAnim = null;
  var wordAnim = null;
  var sparkAnims = [];
  var sparkNodes = [];
  var wingAnims = [];
  var flyer = null;
  var observer = null;
  var retargetQueued = false;
  var segment = { from: 0, duration: DURATION };
  var baseWidth = 1;
  var baseHeight = 1;
  var lastRect = null;
  var startPt = { x: 0, y: 0 };
  var control = { x: 0, y: 0 };

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function scaleEase(t) {
    var lead = 0.16;
    if (t <= lead) return 0;
    return easeInOutQuad((t - lead) / (1 - lead));
  }

  function opacityAt(t) {
    var x = t < 0.65 ? t / 0.65 : 1;
    return 0.45 + 0.55 * (1 - (1 - x) * (1 - x));
  }

  function bank(t) {
    if (t >= 1) return 0;
    return (1 - t) * (-10 + 28 * Math.sin(Math.PI * t));
  }

  function quad(t, a, b, c) {
    var u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
  }

  function copyRect(rect) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function moved(next, prev) {
    if (!prev) return true;
    return Math.abs(next.left - prev.left) > 0.75
      || Math.abs(next.top - prev.top) > 0.75
      || Math.abs(next.width - prev.width) > 0.75
      || Math.abs(next.height - prev.height) > 0.75;
  }

  function frameAt(t, slotRect) {
    var endX = slotRect.left + slotRect.width / 2;
    var endY = slotRect.top + slotRect.height / 2;
    var p = easeInOutQuad(t);
    var x = quad(p, startPt.x, control.x, endX);
    var y = quad(p, startPt.y, control.y, endY);
    var grow = START_SCALE + (1 - START_SCALE) * scaleEase(t);
    var sx = grow * (slotRect.width / baseWidth);
    var sy = grow * (slotRect.height / baseHeight);
    var tx = x - baseWidth / 2;
    var ty = y - baseHeight / 2;
    return {
      transform: "translate(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px) rotate(" + bank(t).toFixed(2) + "deg) scale(" + sx.toFixed(4) + ", " + sy.toFixed(4) + ")",
      opacity: Math.round(opacityAt(t) * 1000) / 1000
    };
  }

  function buildFrames(fromT, slotRect, firstVisual) {
    var steps = 12;
    var frames = [];
    var i;
    for (i = 0; i <= steps; i += 1) {
      var t = fromT + (1 - fromT) * (i / steps);
      var frame = frameAt(t, slotRect);
      if (i === 0 && firstVisual) {
        frame = {
          transform: firstVisual.transform,
          opacity: firstVisual.opacity
        };
      }
      frame.offset = i / steps;
      frames.push(frame);
    }
    return frames;
  }

  function currentT() {
    var elapsed = flyAnim && flyAnim.currentTime != null ? flyAnim.currentTime : 0;
    if (!segment.duration) return segment.from;
    return Math.min(0.999, segment.from + (1 - segment.from) * (elapsed / segment.duration));
  }

  function buildFlyer() {
    var node = document.createElement("div");
    node.className = "intro-flyer";
    node.setAttribute("aria-hidden", "true");
    var sharp = document.createElement("div");
    sharp.className = "intro-layer intro-sharp";
    var blur = document.createElement("div");
    blur.className = "intro-layer intro-blur";
    sharp.appendChild(svg.cloneNode(true));
    blur.appendChild(svg.cloneNode(true));
    node.appendChild(sharp);
    node.appendChild(blur);
    return node;
  }

  function playFly(fromT, firstVisual) {
    generation += 1;
    var gen = generation;
    var rect = copyRect(mark.getBoundingClientRect());
    lastRect = rect;
    var frames = buildFrames(fromT, rect, firstVisual);
    segment = { from: fromT, duration: Math.max(32, DURATION * (1 - fromT)) };
    flyAnim = flyer.animate(frames, {
      duration: segment.duration,
      easing: "linear",
      fill: "forwards"
    });
    flyAnim.onfinish = function () {
      if (gen !== generation || phase !== "fly") return;
      onLanded();
    };
  }

  function retarget() {
    if (phase !== "fly" || !flyAnim) return;
    var rect = mark.getBoundingClientRect();
    if (!moved(rect, lastRect)) return;
    var t = currentT();
    var visual = frameAt(t, lastRect);
    flyer.style.transform = visual.transform;
    flyer.style.opacity = String(visual.opacity);
    flyAnim.cancel();
    playFly(t, visual);
  }

  function queueRetarget() {
    if (retargetQueued || phase !== "fly") return;
    retargetQueued = true;
    window.requestAnimationFrame(function () {
      retargetQueued = false;
      retarget();
    });
  }

  function teardownMotion() {
    window.removeEventListener("resize", queueRetarget);
    window.removeEventListener("scroll", queueRetarget);
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function removeSparks() {
    sparkAnims.forEach(function (anim) {
      anim.cancel();
    });
    sparkNodes.forEach(function (node) {
      node.remove();
    });
    sparkAnims = [];
    sparkNodes = [];
  }

  function teardownSkip() {
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("keydown", onKey, true);
  }

  function wingPose(up, down) {
    function turn(deg) {
      return "rotate(" + deg.toFixed(2) + "deg)";
    }
    return [
      { transform: turn(0), offset: 0 },
      { transform: turn(down), offset: 0.08 },
      { transform: turn(up), offset: 0.16 },
      { transform: turn(down * 0.82), offset: 0.26 },
      { transform: turn(up * 0.88), offset: 0.36 },
      { transform: turn(down * 0.5), offset: 0.46 },
      { transform: turn(up * 0.5), offset: 0.57 },
      { transform: turn(down * 0.16), offset: 0.67 },
      { transform: turn(up * 0.14), offset: 0.76 },
      { transform: turn(0), offset: 0.88 },
      { transform: turn(0), offset: 1 }
    ];
  }

  function playWings(root) {
    root.querySelectorAll(".wing").forEach(function (wing) {
      var pivot = (wing.getAttribute("data-pivot") || "0 0").split(/\s+/);
      wing.style.transformBox = "view-box";
      wing.style.transformOrigin = pivot[0] + "px " + pivot[1] + "px";
      var near = wing.classList.contains("wing-near");
      var anim = wing.animate(near ? wingPose(15, -10) : wingPose(10, -7), {
        duration: DURATION,
        delay: near ? 0 : 50,
        easing: "linear",
        fill: "forwards"
      });
      wingAnims.push(anim);
    });
  }

  function finishQuiet() {
    phase = "done";
    generation += 1;
    if (flyAnim) flyAnim.cancel();
    if (blurAnim) blurAnim.cancel();
    if (wordAnim) wordAnim.cancel();
    wingAnims.forEach(function (anim) { anim.cancel(); });
    removeSparks();
    if (flyer && flyer.parentNode) flyer.remove();
    clearIntroClasses();
    teardownMotion();
    teardownSkip();
  }

  function onPointer(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    finishQuiet();
  }

  function onKey() {
    finishQuiet();
  }

  function playSparkle(rect) {
    var unit = Math.max(16, rect.width * 0.26);
    var seeds = [
      { x: 0.97, y: 0.94, dx: 0.25, dy: -1.05, size: 1.2 },
      { x: 1.04, y: 1.02, dx: 1.05, dy: 0.2, size: 0.85 },
      { x: 0.9, y: 1.02, dx: -0.35, dy: 0.75, size: 0.7 },
      { x: 0.94, y: 0.84, dx: 0.75, dy: -0.8, size: 0.9 },
      { x: 0.84, y: 0.92, dx: -0.9, dy: -0.15, size: 0.6 }
    ];
    var anims = seeds.map(function (seed, index) {
      var dot = document.createElement("span");
      dot.className = "intro-spark";
      dot.setAttribute("aria-hidden", "true");
      var size = Math.max(8, Math.min(16, rect.width * 0.13)) * seed.size;
      dot.style.width = size + "px";
      dot.style.height = size + "px";
      dot.style.marginLeft = (-size / 2) + "px";
      dot.style.marginTop = (-size / 2) + "px";
      if (index % 2 === 1) dot.style.background = "#f0d78a";
      dot.style.left = (rect.left + rect.width * seed.x) + "px";
      dot.style.top = (rect.top + rect.height * seed.y) + "px";
      document.body.appendChild(dot);
      sparkNodes.push(dot);
      var dx = seed.dx * unit;
      var dy = seed.dy * unit;
      var anim = dot.animate([
        { opacity: 0, transform: "translate(0px, 0px) rotate(45deg) scale(0.25)" },
        { opacity: 1, transform: "translate(" + (dx * 0.45).toFixed(1) + "px, " + (dy * 0.45).toFixed(1) + "px) rotate(45deg) scale(1)", offset: 0.38 },
        { opacity: 0, transform: "translate(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px) rotate(45deg) scale(0.35)" }
      ], {
        duration: 560,
        delay: index * 28,
        easing: "ease-out",
        fill: "forwards"
      });
      sparkAnims.push(anim);
      anim.onfinish = function () {
        dot.remove();
      };
      return anim.finished;
    });
    return Promise.all(anims).catch(function () {});
  }

  function fadeWordmark() {
    if (phase !== "spark") return;
    phase = "word";
    if (!wordmark) {
      finishQuiet();
      return;
    }
    wordAnim = wordmark.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 420, easing: "ease-out", fill: "forwards" }
    );
    wordAnim.onfinish = function () {
      if (phase !== "word") return;
      clearIntroClasses();
      wordAnim.cancel();
      phase = "done";
      teardownSkip();
    };
  }

  function onLanded() {
    if (phase !== "fly") return;
    phase = "spark";
    teardownMotion();
    if (blurAnim) blurAnim.cancel();
    root.classList.add("intro-landed");
    if (flyer && flyer.parentNode) flyer.remove();
    var rect = mark.getBoundingClientRect();
    playSparkle(rect).then(function () {
      fadeWordmark();
    });
  }

  function armSkip() {
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
  }

  try {
    var initial = mark.getBoundingClientRect();
    if (initial.width < 2 || initial.height < 2) {
      clearIntroClasses();
      return;
    }
    markSeen();
    baseWidth = initial.width;
    baseHeight = initial.height;
    lastRect = copyRect(initial);
    startPt = {
      x: window.innerWidth * 0.5,
      y: Math.min(window.innerHeight * 0.6, window.innerHeight - 28)
    };
    var endX = initial.left + initial.width / 2;
    var endY = initial.top + initial.height / 2;
    var midX = (startPt.x + endX) / 2;
    var midY = (startPt.y + endY) / 2;
    var bowX = Math.min(window.innerWidth * 0.18, 220);
    var bowY = -Math.min(window.innerHeight * 0.08, 72);
    control = { x: midX + bowX * 2, y: midY + bowY * 2 };

    flyer = buildFlyer();
    flyer.style.width = baseWidth + "px";
    flyer.style.height = baseHeight + "px";
    flyer.style.transformOrigin = "center center";
    flyer.style.willChange = "transform, opacity";
    var first = frameAt(0, lastRect);
    flyer.style.transform = first.transform;
    flyer.style.opacity = String(first.opacity);
    document.body.appendChild(flyer);

    var blurLayer = flyer.querySelector(".intro-blur");
    blurAnim = blurLayer.animate([
      { opacity: 1, offset: 0 },
      { opacity: 0, offset: 0.72 },
      { opacity: 0, offset: 1 }
    ], { duration: DURATION, easing: "linear", fill: "both" });

    playFly(0, null);
    playWings(flyer);
    armSkip();
    window.addEventListener("resize", queueRetarget);
    window.addEventListener("scroll", queueRetarget, { passive: true });
    if (typeof window.ResizeObserver === "function") {
      observer = new window.ResizeObserver(queueRetarget);
      observer.observe(mark);
    }
    if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === "function") {
      document.fonts.ready.then(queueRetarget).catch(function () {});
    }
  } catch (err) {
    finishQuiet();
  }
})();
