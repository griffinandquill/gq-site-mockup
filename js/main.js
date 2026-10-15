(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");
  var label = toggle ? toggle.querySelector(".nav-toggle-label") : null;

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderProducts() {
    var root = document.querySelector("[data-product-catalog]");
    if (!root || !window.GQ_PRODUCTS) return;
    root.innerHTML = window.GQ_PRODUCTS.map(function (item) {
      var control = item.action === "buy"
        ? '<a class="btn btn-primary" href="#">Buy on TPT<span class="visually-hidden">: ' + esc(item.title) + ', sample product</span></a>'
        : '<button type="button" class="btn btn-soon" aria-disabled="true">Coming soon<span class="visually-hidden">: ' + esc(item.title) + '</span></button>';
      var priceNote = item.action === "buy"
        ? '<span class="price-note">Sample price. Not for sale on this mockup.</span>'
        : '<span class="price-note">Sample. Price not set.</span>';
      return (
        '<article class="card product">' +
          '<p class="stamp">Sample</p>' +
          '<h3>' + esc(item.title) + '</h3>' +
          '<p>' + esc(item.summary) + '</p>' +
          '<dl class="meta">' +
            '<div><dt>Grade</dt><dd>' + esc(item.grade) + '</dd></div>' +
            '<div><dt>Standard</dt><dd>' + esc(item.standard) + '</dd></div>' +
            '<div><dt>Price</dt><dd>' + esc(item.price) + priceNote + '</dd></div>' +
          '</dl>' +
          '<div class="card-actions">' + control + '</div>' +
        '</article>'
      );
    }).join("");
  }

  renderProducts();

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

  document.querySelectorAll("form[data-mockup]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (typeof form.reportValidity === "function" && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var note = form.querySelector("[data-thanks]");
      if (note) {
        note.hidden = false;
        note.focus();
      }
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
      note.textContent = "Placeholder link. Nothing opens on this mockup.";
      link.insertAdjacentElement("afterend", note);
    });
  });

  document.querySelectorAll(".btn-soon").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    if (frame) {
      scene.scrollLeft = Math.round((frame.offsetWidth - scene.clientWidth) / 2);
    }
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
    var scene = document.querySelector(".qh-scene");
    if (!scene || reduceMotion) return;
    if (!("IntersectionObserver" in window)) {
      scene.classList.add("is-live");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        scene.classList.toggle("is-live", entry.isIntersecting);
      });
    }, { rootMargin: "64px 0px" });
    io.observe(scene);
  }

  setupReveal();
  setupTypewriter();
  setupParallax();
  setupScenePause();
})();
