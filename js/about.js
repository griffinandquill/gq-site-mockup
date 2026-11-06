(function () {
  // Founder's journal: one page at a time, with Previous and Next. Without
  // JavaScript every entry stays visible as a plain list.
  var book = document.getElementById("journal-book");
  var pages = book ? Array.prototype.slice.call(book.querySelectorAll(".journal-page")) : [];
  var controls = book ? book.querySelector(".journal-controls") : null;
  var prev = document.getElementById("journal-prev");
  var next = document.getElementById("journal-next");
  var count = document.getElementById("journal-count");
  if (!book || !pages.length || !controls || !prev || !next || !count) return;

  var index = 0;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(target, direction) {
    index = Math.max(0, Math.min(pages.length - 1, target));
    pages.forEach(function (page, i) {
      var on = i === index;
      page.hidden = !on;
      page.classList.remove("turn-next", "turn-prev");
      if (on && direction && !reduce) {
        void page.offsetWidth;
        page.classList.add(direction > 0 ? "turn-next" : "turn-prev");
      }
    });
    count.textContent = "Page " + (index + 1) + " of " + pages.length;
    prev.disabled = index === 0;
    next.disabled = index === pages.length - 1;
  }

  prev.addEventListener("click", function () { show(index - 1, -1); });
  next.addEventListener("click", function () { show(index + 1, 1); });
  book.addEventListener("keydown", function (event) {
    if (event.target.closest && event.target.closest("a")) return;
    if (event.key === "ArrowRight") { show(index + 1, 1); event.preventDefault(); }
    if (event.key === "ArrowLeft") { show(index - 1, -1); event.preventDefault(); }
  });

  book.classList.add("is-paged");
  controls.hidden = false;
  show(0, 0);
})();
