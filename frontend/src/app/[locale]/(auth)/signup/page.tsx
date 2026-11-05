"use client";

/**
 * SignupPage — registers a new user via Better Auth (email + password).
 *
 * Calls POST /api/auth/sign-up/email on the IAM server (bezs-iam : 5001).
 * On success the user is redirected to the patient intake start page.
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

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        callbackURL: "/intake",
      });

      if (error) {
        toast.error(error.message ?? "Sign up failed. Please try again.");
        return;
      }

      toast.success("Account created! Redirecting…");

      // Create a mindspace_session cookie so the app layout (getServerSession)
      // recognises this user without needing a full OAuth flow.
      await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "member",
          name: (data?.user?.name ?? name.trim()),
          email: (data?.user?.email ?? email.trim().toLowerCase()),
          redirectUrl: "/mindspace/member",
        }),
      });

      router.push("/mindspace/member" as any);
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

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-md"
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
