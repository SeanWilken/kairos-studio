import { redirect } from "react-router";
import { clearAuthSession, hasAuthSession, isAccessTokenExpired } from "./auth-session";

export function requireAuth() {
  if (hasAuthSession() && !isAccessTokenExpired()) return null;
  if (hasAuthSession()) clearAuthSession();
  throw redirect("/login");
}
