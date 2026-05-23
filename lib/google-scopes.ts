export function hasGoogleCalendarScope(scope?: string | null) {
  if (!scope) return false;

  return scope.includes("https://www.googleapis.com/auth/calendar");
}
