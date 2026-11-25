export const BRAND = {
  name: "Summit Ridge",
  bot: "Summit Ridge desk",
  role: "Summit Ridge desk · AI agent",
  subtitle: "No steering. No school-quality ranking.",
  human: "Maya Ellison",
  humanTitle: "Maya Ellison · human specialist",
  accent: "#2F4A3C",
  accentDark: "#D4B56C",
  paper: "#F7F1E6",
  ink: "#1A2420",
  nudges: ["Search listings", "Book a showing"] as const,
  nudgePrompts: {
    "Search listings": "I'm looking for a 3 bed under 650k in Highlands",
    "Book a showing": "Book a showing for SR-2401",
  },
  starters: [
    {
      label: "Highlands, 3 beds, under $650k",
      prompt: "I'm looking for a 3 bed under 650k in Highlands",
      icon: "home",
    },
    {
      label: "Book a showing for SR-2401",
      prompt: "Book a showing for SR-2401",
      icon: "calendar",
    },
    {
      label: "What are your buyer fees?",
      prompt: "What are your buyer fees?",
      icon: "book",
    },
    {
      label: "Talk to an agent",
      prompt: "I would like to talk to a human.",
      icon: "headphones",
    },
  ] as const,
  greeting:
    "I can search the Summit Ridge catalog, quote the published buyer fees, and hold a showing. I will not steer, and I will not rank schools.",
  placeholder: "Ask about a home, a fee, or a showing…",
  humanPlaceholder: "Message Maya Ellison…",
  teaser: "Want a Highlands showing? I can hold a time today.",
  tryAsking: [
    { label: "3 beds in Highlands", prompt: "I'm looking for a 3 bed under 650k in Highlands" },
    { label: "Buyer fees", prompt: "What are your buyer fees?" },
    { label: "Book SR-2401", prompt: "Book a showing for SR-2401" },
  ],
  does: ["Searches the 40-home catalog", "Cites brokerage notes", "Scores a lead and books a showing", "Hands the thread to a person"],
  wont: ["Invent a price or an appraisal", "Give legal, lending, or tax advice", "Pretend to be a human agent", "Rank schools or steer by who lives nearby"],
  disclaimer: "Portfolio demo by Quvantic - fictional brand, not a real business / not client work",
  metrics: [
    { label: "Demo listings", value: "40" },
    { label: "KB notes", value: "28" },
    { label: "Evals in CI", value: "23" },
    { label: "Tools", value: "9" },
  ],
} as const;

export const VISUAL_NOW = "2026-11-25T18:00:00.000Z";
