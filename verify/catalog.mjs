export const copy = {
  thanks: "Thanks. Your note is on its way.",
  robots: "User-agent: *\nAllow: /\n\nSitemap: https://www.griffinandquill.com/sitemap.xml\n",
  ogImage: "https://www.griffinandquill.com/assets/og.png",
  legalBanner: "Draft placeholder, pending attorney review.",
};

export const pages = [
  {
    file: "index.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "Home",
  },
  {
    file: "tutoring.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "Tutoring",
  },
  {
    file: "resources.html",
    title: "Store | Griffin & Quill",
    nav: "Store",
    redirectsTo: "/store.html",
  },
  {
    file: "store.html",
    title: "Store | Griffin & Quill",
    nav: "Store",
  },
  {
    file: "worlds.html",
    title: "Quillhaven | Griffin & Quill",
    nav: "Quillhaven",
  },
  {
    file: "schools.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "Schools",
  },
  {
    file: "about.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "About",
  },
  {
    file: "faq.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "FAQ",
  },
  {
    file: "contact.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: "Contact",
  },
  {
    file: "privacy.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: null,
  },
  {
    file: "terms.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: null,
  },
  {
    file: "404.html",
    title: "Griffin & Quill | Where learning becomes an adventure",
    nav: null,
  },
];

export const forms = [
  {
    id: "newsletter",
    page: "/index.html",
    section: "#newsletter",
    submit: "Join the list",
    route: "hello",
    inbox: "hello@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "select", label: "I am a (required)", value: "Parent or guardian" },
    ],
  },
  {
    id: "waitlist",
    page: "/worlds.html",
    section: "#waitlist",
    submit: "Join the waitlist",
    route: "hello",
    inbox: "hello@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "select", label: "I am a (required)", value: "Parent or guardian" },
    ],
  },
  {
    id: "inquiry",
    page: "/schools.html",
    section: "#inquiry",
    submit: "Send inquiry",
    route: "partners",
    inbox: "partners@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Your name (required)", value: "Ada Lovelace" },
      { kind: "fill", label: "Work email (required)", value: "qa@example.com" },
      {
        kind: "fill",
        label: "School, district, or organization (required)",
        value: "Example District",
      },
      { kind: "select", label: "Role (required)", value: "Teacher" },
      { kind: "radio", label: "Site license" },
      {
        kind: "fill",
        label: "Message (required)",
        value: "Layout check for the inquiry form.",
      },
    ],
  },
  {
    id: "contact",
    page: "/contact.html",
    section: "#contact-form",
    submit: "Send message",
    route: "hello",
    inbox: "hello@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Your name (required)", value: "Ada Lovelace" },
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "select", label: "I am a (required)", value: "Teacher or educator" },
      { kind: "select", label: "Topic (required)", value: "Tutoring" },
      { kind: "fill", label: "Message (required)", value: "Layout check for the contact form." },
    ],
  },
  {
    id: "tutoring",
    page: "/tutoring.html",
    section: "#book",
    submit: "Book with us",
    route: "tutoring",
    inbox: "tutoring@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Parent or guardian name (required)", value: "Ada Lovelace" },
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "fill", label: "Phone (optional)", value: "843-555-0100" },
      { kind: "select", label: "Student grade (required)", value: "Grade 9" },
      { kind: "select", label: "Subject or need (required)", value: "History and social studies" },
      { kind: "radio", label: "Online" },
      { kind: "fill", label: "Preferred days and times (optional)", value: "Weekday evenings" },
      { kind: "fill", label: "Message (optional)", value: "Layout check for the tutoring form." },
    ],
  },
];

export const viewports = [
  { id: "desktop", width: 1280, height: 800 },
  { id: "mobile", width: 390, height: 844 },
];
