/**
 * MindSpace landing page — public marketing/home screen.
 *
 * Route: /[locale]
 *
 * Server component. Introduces the product (peer support, AI-guided
 * self-help, safety resources) and routes visitors to sign-up or sign-in.
 * No clinical-care claims — MindSpace is peer support, not therapy.
 */

import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import {
  ArrowRight,
  Heart,
  Headphones,
  Mic,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Chat intake",
    description:
      "A gentle AI-guided conversation that helps you share what's on your mind — at your own pace.",
  },
  {
    icon: Mic,
    title: "Voice intake",
    description:
      "Prefer to talk? Use your voice for a guided intake. Audio is transcribed, never stored.",
  },
  {
    icon: Headphones,
    title: "Peer listeners",
    description:
      "Connect with trained volunteer listeners for warm, non-clinical peer support.",
  },
  {
    icon: ShieldCheck,
    title: "Safety resources",
    description:
      "Clear, verified help resources when you need them — with honest, staffed escalation only.",
  },
];

export default async function LandingPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Heart className="size-6 text-rose-600" aria-hidden="true" />
          MindSpace
        </span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Peer support &amp; wellbeing
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          A calmer space for your mind
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          MindSpace helps you talk through what&apos;s on your mind — through
          guided chat or voice intake, private wellbeing tools, and trained peer
          listeners. Not therapy, not clinical care — just a safe space to be
          heard.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Create your account
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer note */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        MindSpace is a peer-support platform — not a licensed clinical service.
        If you are in immediate danger, contact your local emergency services.
      </footer>
    </div>
  );
}
