import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Bot, Sparkles } from "lucide-react";
import { authApi, createCoreApiClient } from "../../../lib/api";
import { saveAuthSession } from "../../../lib/auth-session";

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  const tenantId = env.VITE_KAIROS_TENANT_ID ?? "tenant-local";
  const orgId = env.VITE_KAIROS_ORG_ID ?? "8a56c7f2-5506-46a3-ae3a-f8dfa36548e2";
  const bootstrapStatus = searchParams.get("bootstrap");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const client = createCoreApiClient({ scope: { tenantId, orgId: orgId || undefined } });
      const loginResult = await authApi.login(client, {
        email,
        password,
        tenant_id: tenantId,
        org_id: orgId || undefined,
      });

      const tokenSet = loginResult as { access_token?: string; refresh_token?: string };
      if (!tokenSet.access_token || !tokenSet.refresh_token) {
        throw new Error("Login succeeded but token payload was missing.");
      }

      saveAuthSession({
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
      });

      setIsLoading(false);
      navigate("/");
    } catch (submitError) {
      setIsLoading(false);
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl text-primary-foreground mb-4">Studio</h1>
            <p className="text-xl text-primary-foreground/80 max-w-md mx-auto">
              Manage users, workspaces, and AI resources all in one place. Get started by signing in to your account.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-primary-foreground/5 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access Kairos Studio
            </p>
            {bootstrapStatus === "complete" ? (
              <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Bootstrap account created. Sign in to verify token flow and continue setup.
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button className="text-primary hover:underline">
                Request access
              </button>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Enterprise SSO available</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
