export const copy = {
  thanks: "Thanks. Your note is on its way.",
  robots: "User-agent: *\nAllow: /\n\nSitemap: https://www.griffinandquill.com/sitemap.xml\n",
  ogImage: "https://www.griffinandquill.com/assets/og.png",
  legalBanner: "Draft placeholder, pending attorney review.",
};

export const pages = [
  {
    file: "index.html",
    title: "Griffin & Quill | Write your own legend",
    nav: "Home",
  },
  {
    file: "tutoring.html",
    title: "Tutoring | Griffin & Quill",
    nav: "Tutoring",
  },
  {
    file: "resources.html",
    title: "Shop | Griffin & Quill",
    nav: "Shop",
  },
  {
    file: "worlds.html",
    title: "Quillhaven | Griffin & Quill",
    nav: "Quillhaven",
  },
  {
    file: "schools.html",
    title: "Schools and Districts | Griffin & Quill",
    nav: "Schools",
  },
  {
    file: "about.html",
    title: "About | Griffin & Quill",
    nav: "About",
  },
  {
    file: "faq.html",
    title: "FAQ | Griffin & Quill",
    nav: "FAQ",
  },
  {
    file: "contact.html",
    title: "Contact | Griffin & Quill",
    nav: "Contact",
  },
  {
    file: "privacy.html",
    title: "Privacy Policy | Griffin & Quill",
    nav: null,
  },
  {
    file: "terms.html",
    title: "Terms of Use | Griffin & Quill",
    nav: null,
  },
  {
    file: "404.html",
    title: "Page not found | Griffin & Quill",
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
    id: "consult",
    page: "/tutoring.html",
    section: "#book",
    submit: "Request a consult",
    route: "tutoring",
    inbox: "tutoring@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Your name (required)", value: "Ada Lovelace" },
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "select", label: "I am a (required)", value: "Parent or guardian" },
      { kind: "select", label: "Subject (required)", value: "U.S. History" },
      { kind: "radio", label: "1:1" },
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
    id: "shop",
    page: "/resources.html",
    section: "#shop-news",
    submit: "Join the list",
    route: "hello",
    inbox: "hello@griffinandquill.com",
    fields: [
      { kind: "fill", label: "Email (required)", value: "qa@example.com" },
      { kind: "select", label: "I am a (required)", value: "Teacher" },
    ],
  },
];

export const viewports = [
  { id: "desktop", width: 1280, height: 800 },
  { id: "mobile", width: 390, height: 844 },
];
