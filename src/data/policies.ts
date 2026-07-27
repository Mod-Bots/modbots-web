// Shared facts every published policy states the same way. One definition so
// a change of controller, address, or document date cannot go stale on one
// page and stay current on another.

export const policyMeta = {
  controller: "William Sawyerr",
  institution: "University for the Creative Arts",
  institutionShort: "UCA",
  jurisdiction: "United Kingdom",
  supervisoryAuthority: "Information Commissioner's Office",
  supervisoryAuthorityUrl: "https://ico.org.uk",
  version: "1",
  updated: "26 July 2026",
  minimumAge: 18,
} as const;

// The routes a reader can actually use. One definition so no document can send
// someone to a mailbox another document has stopped naming. Safety and
// security are one address deliberately: an abuse report and an intrusion
// report both need the same person reading them quickly, and splitting them
// only makes a person in trouble guess which one they are in.
export const policyContacts = {
  support: "support@modbots.ai",
  research: "research@modbots.ai",
  privacy: "mydata@modbots.ai",
  appeals: "appeals@modbots.ai",
  security: "security@modbots.ai",
  copyright: "cip@modbots.ai",
  legal: "legal@modbots.ai",
} as const;

export interface PolicyPageLink {
  href: string;
  label: string;
}

// The published set, in the order a reader meets them.
export const policyPages: readonly PolicyPageLink[] = [
  { href: "/why-mod-bots-exists", label: "Why Mod Bots exists" },
  { href: "/research-participation", label: "Research participation" },
  { href: "/dataset-release", label: "Dataset releases" },
  { href: "/moderation-and-appeals", label: "Moderation and appeals" },
  { href: "/room-rules", label: "Room rules" },
  {
    href: "/illegal-content-and-activity",
    label: "Illegal content and activity",
  },
  { href: "/terms-of-use", label: "Terms of use" },
  { href: "/privacy-notice", label: "Privacy notice" },
  { href: "/cookies", label: "Cookies" },
];
