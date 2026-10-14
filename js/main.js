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
        ? '<span class="price-note"> Sample price. Not for sale on this mockup.</span>'
        : '<span class="price-note"> Sample. Price not set.</span>';
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
})();
