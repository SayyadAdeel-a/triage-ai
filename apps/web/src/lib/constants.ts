export const DEFAULT_EMAIL_CATEGORIES = [
  "Needs Reply",
  "Important",
  "Newsletters",
  "Notifications",
  "Promotions",
  "Ignore",
  "Sensitive",
  "Google Alerts",
] as const;

export const DEFAULT_LINKEDIN_CATEGORIES = [
  "Needs Reply",
  "Investment/VC",
  "Partnership",
  "Talent/Hiring",
  "Sales/Lead",
  "Spam/Pitch",
  "Market Research",
  "General Network",
  "Ignore",
] as const;

export type EmailCategory = (typeof DEFAULT_EMAIL_CATEGORIES)[number];
export type LinkedInCategory = (typeof DEFAULT_LINKEDIN_CATEGORIES)[number];
