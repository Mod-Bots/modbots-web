// Shared facts every published policy states the same way. One definition so
// a change of controller, address, or document date cannot go stale on one
// page and stay current on another.

export const policyMeta = {
  controller: "William Sawyerr",
  institution: "University for the Creative Arts",
  postalAddress: "University for the Creative Arts, Farnham, United Kingdom",
  jurisdiction: "United Kingdom",
  supervisoryAuthority: "Information Commissioner's Office",
  supervisoryAuthorityUrl: "https://ico.org.uk",
  version: "1",
  updated: "26 July 2026",
  minimumAge: 18,
} as const;

export interface PolicyPageLink {
  href: string;
  label: string;
}

// The published set, in the order a reader meets them.
export const policyPages: readonly PolicyPageLink[] = [
  { href: "/why", label: "Why Mod Bots exists" },
  { href: "/research", label: "Research participation" },
  { href: "/data", label: "Dataset releases" },
  { href: "/moderation", label: "Moderation and appeals" },
  { href: "/rules", label: "Room rules" },
  { href: "/terms", label: "Terms of use" },
  { href: "/privacy", label: "Privacy notice" },
  { href: "/cookies", label: "Cookies" },
];
