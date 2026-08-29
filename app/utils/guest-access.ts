export function isGuestDashboardRoute(
  path: string,
  query: Record<string, unknown>,
) {
  return path === "/dashboard" && query.demo === "1";
}
