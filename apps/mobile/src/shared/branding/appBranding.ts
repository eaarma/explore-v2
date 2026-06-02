export const DEFAULT_APP_TITLE = "Explore";
export const DEFAULT_CONTACT_EMAIL = "support@explore.app";

export function resolveAppTitle(appTitle: string | null | undefined) {
  if (typeof appTitle !== "string") {
    return DEFAULT_APP_TITLE;
  }

  const normalizedTitle = appTitle.trim();

  return normalizedTitle.length > 0 ? normalizedTitle : DEFAULT_APP_TITLE;
}

export function resolveContactEmail(contactEmail: string | null | undefined) {
  if (typeof contactEmail !== "string") {
    return DEFAULT_CONTACT_EMAIL;
  }

  const normalizedEmail = contactEmail.trim();

  return normalizedEmail.length > 0
    ? normalizedEmail
    : DEFAULT_CONTACT_EMAIL;
}
