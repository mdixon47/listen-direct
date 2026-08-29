import { isGuestDashboardRoute } from "~/utils/guest-access";

export default defineNuxtRouteMiddleware((to) => {
  if (isGuestDashboardRoute(to.path, to.query)) return;

  const user = useSupabaseUser();

  if (!user.value) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
