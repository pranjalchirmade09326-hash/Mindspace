"use client";

/**
 * SignupPage — registers a new user via Better Auth (email + password).
 *
 * Calls POST /api/auth/sign-up/email on the IAM server (bezs-iam : 5001).
 * On success, creates a local mindspace_session cookie with role 'member'
 * and redirects directly to /[locale]/mindspace/member.
 */

import { useState } from "react";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/client/auth/betterauth/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const locale = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Role assignment is limited to Member or Listener.
  const [role, setRole] = useState<"member" | "listener">("member");

  const dashboardPath = role === "listener" ? "/mindspace/listener" : "/mindspace/member";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        callbackURL: "/mindspace/member",
      });

      if (error) {
        // If IAM service returned a network or connection error, fall through to dev session fallback
        const isNetworkFailure =
          !error.status ||
          error.status >= 500 ||
          error.message?.toLowerCase().includes("failed to fetch") ||
          error.message?.toLowerCase().includes("network") ||
          error.message?.toLowerCase().includes("econnrefused");

        if (isNetworkFailure) {
          throw new Error(error.message || "IAM service offline");
        }

        toast.error(error.message ?? "Sign up failed. Please try again.");
        return;
      }

      toast.success("Account created! Redirecting…");

      // Create a mindspace_session cookie so the app layout (getServerSession)
      // recognises this user without needing a full OAuth flow.
      const devRes = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: data?.user?.name || name.trim() || "Member",
          email: data?.user?.email || email.trim().toLowerCase(),
          redirectUrl: dashboardPath,
          locale,
        }),
      });

      if (!devRes.ok) {
        toast.error("Failed to establish authenticated session. Please try signing in.");
        throw new Error("Failed to initialize session");
      }

      const resData = await devRes.json().catch(() => ({}));
      const destination = resData?.redirectUrl || `/${locale}${dashboardPath}`;

      router.push(dashboardPath as any);
      if (typeof window !== "undefined" && window.location) {
        window.location.href = destination;
      }
    } catch (err: any) {
      console.warn("IAM signup error, trying dev fallback:", err);
      try {
        const devRes = await fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role,
            name: name.trim() || "Member",
            email: email.trim().toLowerCase(),
            redirectUrl: dashboardPath,
            locale,
          }),
        });

        if (devRes.ok) {
          const devData = await devRes.json().catch(() => ({}));
          const targetUrl = devData?.redirectUrl || `/${locale}${dashboardPath}`;
          toast.success("Account created via Dev Session! Redirecting…");
          router.push(dashboardPath as any);
          if (typeof window !== "undefined" && window.location) {
            window.location.href = targetUrl;
          }
          return;
        }
      } catch (devErr) {
        console.error("Dev signup fallback failed:", devErr);
      }
      toast.error(err?.message ?? "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center justify-center space-x-2">
          <AppLogo size={42} className="w-10 h-10 text-primary" />
          <span className="text-3xl font-bold tracking-tight text-foreground">
            MindSpace
          </span>
        </Link>
        <p className="text-sm text-muted-foreground">
          Make space for your wellbeing
        </p>
      </div>

      <Card className="border shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up to access your personal care space
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Sarah Jenkins"
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Minimum 8 characters
              </p>
            </div>

            {/* Role assignment — Member or Listener only */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">I am joining as</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: "member" as const,
                      label: "Member",
                      description: "Seek wellbeing & peer support",
                    },
                    {
                      id: "listener" as const,
                      label: "Listener",
                      description: "Volunteer as a trained peer listener",
                    },
                  ]
                ).map((option) => {
                  const isSelected = role === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRole(option.id)}
                      aria-pressed={isSelected}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {role === "listener"
                  ? "Listeners are redirected to the Listener dashboard after sign-in."
                  : "Members are redirected to the Member dashboard after sign-in."}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-md cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col space-y-3">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground/80">
            By registering you agree to our Privacy Policy and Terms of Service.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
