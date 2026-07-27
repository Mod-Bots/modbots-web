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

// Who handles what, and where to reach them. A document names the team, not a
// person: a reader wants the thing dealt with, and who happens to open the
// message is the platform's business rather than theirs. Safety and security
// are one team deliberately, since an abuse report and an intrusion report
// both need the same eyes quickly, and splitting them only makes someone in
// trouble guess which one they are in.
export interface PolicyContact {
  team: string;
  address: string;
}

export const policyContacts = {
  support: { team: "Mod Bots Support", address: "support@modbots.ai" },
  research: { team: "Mod Bots Research", address: "research@modbots.ai" },
  privacy: { team: "Mod Bots Privacy", address: "mydata@modbots.ai" },
  appeals: { team: "Mod Bots Appeals", address: "appeals@modbots.ai" },
  security: { team: "Mod Bots Security", address: "security@modbots.ai" },
  copyright: { team: "Mod Bots Copyright", address: "cip@modbots.ai" },
  legal: { team: "Mod Bots Legal", address: "legal@modbots.ai" },
} as const satisfies Record<string, PolicyContact>;

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
