/**
 * Read the sidebar's persisted open/collapsed state.
 *
 * SidebarProvider writes this value whenever the user toggles the desktop
 * sidebar. Returning undefined for a missing or invalid cookie keeps the
 * provider's normal default intact.
 */
export function parseSidebarStateCookie(cookie: string | null | undefined): boolean | undefined {
  if (!cookie) return undefined;
  const match = cookie.match(/(?:^|;\s*)sidebar_state=(true|false)\b/);
  return match ? match[1] === 'true' : undefined;
}
