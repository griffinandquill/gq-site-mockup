(function () {
  // Letter desk: picks an envelope, shows the best address, and can set the
  // topic on the existing form. The form still posts only what it always did,
  // to hello@. Without JavaScript every letter stays visible.
  var envelopes = document.getElementById("envelopes");
  var letters = Array.prototype.slice.call(document.querySelectorAll(".letter"));
  var topic = document.getElementById("contact-topic");
  var name = document.getElementById("contact-name");
  var status = document.getElementById("desk-status");
  if (!envelopes || !letters.length) return;

  function show() {
    var checked = envelopes.querySelector('input[name="envelope"]:checked');
    var value = checked ? checked.value : "general";
    letters.forEach(function (letter) {
      letter.hidden = letter.getAttribute("data-letter") !== value;
    });
  }

  envelopes.addEventListener("change", show);

  letters.forEach(function (letter) {
    Array.prototype.forEach.call(letter.querySelectorAll("[data-write]"), function (button) {
      button.addEventListener("click", function () {
        var wanted = button.getAttribute("data-write");
        if (topic && wanted) topic.value = wanted;
        if (status) {
          status.textContent = wanted
            ? "Topic set to " + wanted + ". This form goes to hello@griffinandquill.com."
            : "This form goes to hello@griffinandquill.com.";
        }
        var form = document.getElementById("contact-form");
        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (form) form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        if (name) name.focus({ preventScroll: true });
      });
    });
  });

  document.querySelector(".desk").classList.add("is-live");
  show();
})();
