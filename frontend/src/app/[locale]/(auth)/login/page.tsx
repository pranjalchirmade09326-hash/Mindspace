"use client";

/**
 * LoginPage — authenticates an existing user via Better Auth (email + password).
 *
 * Calls POST /api/auth/sign-in/email on the IAM server (bezs-iam : 5001).
 * On success the session cookie is set and the user is redirected to their dashboard.
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
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/modules/client/auth/betterauth/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        callbackURL: "/bezs/telemedicine/patient",
        rememberMe: true,
      });

      if (error) {
        toast.error(error.message ?? "Sign in failed. Please check your credentials.");
        return;
      }

      toast.success("Signed in successfully! Redirecting…");

      // The session cookie is set by BetterAuth automatically.
      // Redirect to the active role redirect URL if present, else default dashboard.
      const redirectUrl =
        (data as any)?.session?.activeRoleRedirectUrl ?? "/bezs/telemedicine/patient";
      router.push(redirectUrl as any);
    } catch (err: any) {
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
          Your space for wellbeing and care
        </p>
      </div>

      <Card className="border shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col space-y-3">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Connected to IAM at{" "}
            <span className="font-mono text-primary">localhost:5001</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
