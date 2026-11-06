(function () {
  // Session planner. Runs on this page only: it sends nothing and stores
  // nothing. "Put this in the booking form" fills fields that already exist.
  var form = document.getElementById("planner-form");
  var use = document.getElementById("plan-use");
  var status = document.getElementById("plan-status");
  if (!form || !use) return;

  var courses = {
    ushc: { name: "U.S. History", short: "U.S. History" },
    gov: { name: "Government", short: "Government" },
    econ: { name: "Economics", short: "Economics" },
    aphg: { name: "AP Human Geography", short: "AP Human Geography" },
    world: { name: "World History", short: "World History" }
  };

  var needs = {
    source: {
      name: "Reading a source",
      check: "what the student can already do with a source, and where the claim gets lost",
      plan: "the reading skills to work on",
      subject: "History and social studies"
    },
    writing: {
      name: "Essays and DBQs",
      check: "how the student turns a source into a paragraph today",
      plan: "the writing steps to work on, from one source to a full answer",
      subject: "Essays and DBQ"
    },
    study: {
      name: "Study skills",
      check: "how the student takes notes and reads a prompt",
      plan: "the study habits to build",
      subject: "Study skills"
    },
    test: {
      name: "Test prep",
      check: "which questions trip the student up, and why",
      plan: "the question types to practice, with why each answer works",
      subject: "History and social studies"
    }
  };

  function value(name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  function set(key, text) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-plan="' + key + '"]'), function (node) {
      node.textContent = text;
    });
  }

  function current() {
    var course = courses[value("course")] || courses.ushc;
    var need = needs[value("need")] || needs.source;
    var meet = value("meet") || "Online";
    return { course: course, need: need, meet: meet };
  }

  function paint() {
    var pick = current();
    set("course", pick.course.name);
    set("need", pick.need.name);
    set("check", "A quick skills check in " + pick.course.short + ": " + pick.need.check + ".");
    set("plan", "You get a short written plan: " + pick.need.plan + ", how often to meet, and what to practice between sessions.");
    var where = pick.meet === "In person" ? "In person, at $50 per hour." : "Online, by video, at $40 per hour.";
    set("sessions", "Each session has one goal, time to try it, and a note you can reread later. " + where);
    if (status) status.textContent = "";
  }

  form.addEventListener("change", paint);
  form.addEventListener("submit", function (event) { event.preventDefault(); });

  use.addEventListener("click", function () {
    var pick = current();
    var subject = document.getElementById("tutor-subject");
    var message = document.getElementById("tutor-message");
    if (subject) subject.value = pick.need.subject;
    var meeting = document.querySelector('#book input[name="meeting"][value="' + pick.meet + '"]');
    if (meeting) meeting.checked = true;
    if (message && !message.value.trim()) {
      message.value = "Course: " + pick.course.name + ". What feels stuck: " + pick.need.name + ".";
    }
    if (status) status.textContent = "Added to the booking form below. Check it, then add your details.";
    var name = document.getElementById("tutor-name");
    var book = document.getElementById("book");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (book) book.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    if (name) name.focus({ preventScroll: true });
  });

  paint();
})();
