(function () {
  var words = document.getElementById("gryff-words");
  var doors = document.querySelectorAll(".plaza-door");
  if (words && doors.length) {
    doors.forEach(function (door) {
      function speak() {
        var line = door.getAttribute("data-gryff");
        if (line) words.textContent = line;
      }
      door.addEventListener("focus", speak);
      door.addEventListener("mouseenter", speak);
      door.addEventListener("pointerdown", speak);
    });
  }

  var sketch = document.querySelector("[data-forge-sketch]");
  if (!sketch) return;
  var card = document.getElementById("forge-card");
  var topicOut = document.querySelector("[data-forge-topic]");
  var skillOut = document.querySelector("[data-forge-skill]");
  sketch.addEventListener("submit", function (event) {
    event.preventDefault();
    var topic = sketch.querySelector("[name='topic']");
    var skill = sketch.querySelector("[name='skill']");
    if (!topic || !skill || !card || !topicOut || !skillOut) return;
    if (!topic.value || !skill.value) return;
    topicOut.textContent = topic.value;
    skillOut.textContent = skill.value;
    card.hidden = false;
    card.focus();
  });
})();
