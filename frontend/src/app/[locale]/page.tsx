/**
 * LocaleRootPage — Marketing Landing Page for MindSpace
 *
 * Route: /[locale] (e.g. /en, /hi, /ta)
 *
 * Features:
 * 1. MindSpace branding (AppLogo, DM Sans typography, mint/sage/teal tokens, ThemeSwitcher, LocaleSwitcher)
 * 2. 7-section layout:
 *    - Sticky Header / Navbar with brand, nav links, locale/theme toggles, and dual CTAs
 *    - Hero section with badge, headline, dual CTAs, intake link, and interactive preview card
 *    - Key Features / Modalities grid (Guided Intake, Peer Listeners, Reflections & Journal, 24/7 Safety)
 *    - Connected Care Ecosystem (Role transparency: Members, Listeners, Supervisors, Safety)
 *    - Privacy & Trust Pillars (Member-controlled consent, encryption, zero judgment, ethical AI)
 *    - Pre-Footer CTA banner with action prompts
 *    - Comprehensive Footer with crisis disclaimer (988 Lifeline) & platform links
 * 3. Link destinations:
 *    - "Get Started" -> /[locale]/signup via Link from "@/i18n/navigation"
 *    - "Sign In" -> /[locale]/login via Link from "@/i18n/navigation"
 */

import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { AppLogo } from "@/modules/client/shared/components/AppLogo";
import { ThemeSwitcher } from "@/theme/ThemeSwitcher";
import LocaleSwitcher from "@/modules/client/shared/components/LocaleSwitcher";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  Lock,
  MessageCircle,
  MessageSquare,
  Mic,
  PhoneCall,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-900 antialiased dark:bg-background dark:text-foreground">
      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: HEADER / NAVIGATION BAR */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-emerald-950/5 bg-white/85 backdrop-blur-md dark:border-border dark:bg-background/85">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition hover:opacity-90"
              aria-label="MindSpace Home"
            >
              <AppLogo size={36} className="size-9 text-emerald-800" />
              <span className="text-xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
                MindSpace
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              Wellbeing Sanctuary
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex dark:text-muted-foreground"
          >
            <a
              href="#features"
              className="transition hover:text-emerald-800 dark:hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#ecosystem"
              className="transition hover:text-emerald-800 dark:hover:text-foreground"
            >
              Connected Care
            </a>
            <a
              href="#privacy"
              className="transition hover:text-emerald-800 dark:hover:text-foreground"
            >
              Privacy & Trust
            </a>
            <Link
              href="/intake"
              className="inline-flex items-center gap-1 transition hover:text-emerald-800 dark:hover:text-foreground"
            >
              <span>Intake</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                New
              </span>
            </Link>
          </nav>

          {/* Controls & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LocaleSwitcher />
            <ThemeSwitcher />

            <Link
              href="/login"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#236B54] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1b5341] hover:shadow-md"
            >
              <span>Get Started</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: HERO SECTION WITH RICH PREVIEW CARD */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32">
        {/* Soft Ambient Background Glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[680px] rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-900/20" />
        <div className="pointer-events-none absolute top-1/3 -right-28 size-[440px] rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-950/20" />
        <div className="pointer-events-none absolute bottom-10 -left-28 size-[380px] rounded-full bg-teal-100/30 blur-3xl dark:bg-teal-950/20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 shadow-xs backdrop-blur-xs dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="size-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>A Calmer Space for Mental Wellbeing</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-foreground">
              Your wellbeing deserves a{" "}
              <span className="text-[#236B54] underline decoration-emerald-300/70 underline-offset-8 dark:text-emerald-400 dark:decoration-emerald-700/60">
                space of its own
              </span>
              .
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-muted-foreground">
              Start with a guided chat or voice conversation. Move at your own
              pace, connect with empathetic peer listeners, and keep your care
              journey together in one secure, judgment-free space.
            </p>

            {/* Dual Hero CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#236B54] px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#1b5341] hover:shadow-lg sm:w-auto"
              >
                <span>Get Started Free</span>
                <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-xs transition hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950 sm:w-auto dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
              >
                <span>Sign In to MindSpace</span>
              </Link>
            </div>

            {/* Guided Intake Link Pill */}
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-muted-foreground">
              <span>Curious how it works?</span>
              <Link
                href="/intake"
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Explore Guided Intake</span>
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* Rich Member Sanctuary Preview Card */}
          {/* ────────────────────────────────────────────────────────────────── */}
          <div className="mt-14 sm:mt-18">
            <div className="relative mx-auto max-w-5xl rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md sm:p-7 dark:border-border dark:bg-card/90">
              {/* Window Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="size-3 rounded-full bg-rose-400/80" />
                    <span className="size-3 rounded-full bg-amber-400/80" />
                    <span className="size-3 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="ml-2 text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-muted-foreground">
                    MindSpace Member Workspace
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span>Encrypted • 24/7 Clinical Guardrails Active</span>
                </div>
              </div>

              {/* Workspace Content Grid */}
              <div className="mt-6 grid gap-5 lg:grid-cols-12">
                {/* Left Column: Daily Reflection & Mood Pulse */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-[#f7faf8] p-5 lg:col-span-4 dark:border-border/40 dark:bg-background/60">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                        Today&apos;s Reflection
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs dark:bg-card dark:text-muted-foreground">
                        Day 5 Streak 🔥
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        <Activity className="size-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-slate-900 dark:text-foreground">
                          Calm & Centered
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-muted-foreground">
                          Emotional equilibrium score: 86%
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 rounded-xl border border-slate-200/70 bg-white/90 p-3 text-xs leading-relaxed text-slate-600 italic dark:border-border/40 dark:bg-card dark:text-muted-foreground">
                      &ldquo;Took a mindful walk before beginning work. Feeling
                      more grounded and receptive today.&rdquo;
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      #grounded
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-border dark:bg-card dark:text-muted-foreground">
                      #breathwork
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-border dark:bg-card dark:text-muted-foreground">
                      #peaceful
                    </span>
                  </div>
                </div>

                {/* Center Column: Intake Choices Preview */}
                <div className="space-y-3.5 lg:col-span-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                      Choose Your Way Forward
                    </span>
                    <span className="text-xs text-emerald-800 dark:text-emerald-400">
                      Self-Paced
                    </span>
                  </div>

                  {/* Chat Option Card */}
                  <Link
                    href="/intake/chat"
                    className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm dark:border-border dark:bg-card"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/40">
                      <MessageCircle className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800 dark:text-foreground dark:group-hover:text-emerald-400">
                          Chat with us
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                          Text Intake
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-muted-foreground">
                        Type whatever is on your mind. Take your time, edit, and
                        respond at your rhythm.
                      </p>
                    </div>
                  </Link>

                  {/* Voice Option Card */}
                  <Link
                    href="/intake/voice"
                    className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-sm dark:border-border dark:bg-card"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800 ring-1 ring-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800/40">
                      <Mic className="size-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-sky-800 dark:text-foreground dark:group-hover:text-sky-400">
                          Talk it through
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-muted-foreground">
                          Voice Guided
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-muted-foreground">
                        Speak freely in a gentle audio dialogue. Pause or
                        conclude anytime you want.
                      </p>
                    </div>
                  </Link>
                </div>

                {/* Right Column: Peer Listener Match Snapshot */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-[#eaf5ef]/70 p-5 lg:col-span-3 dark:border-border/40 dark:bg-card/50">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Matched Listener
                    </span>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative">
                        <div className="flex size-11 items-center justify-center rounded-full bg-[#236B54] text-sm font-bold text-white">
                          SM
                        </div>
                        <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-card" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-foreground">
                          Sarah M.
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-muted-foreground">
                          Trained Peer Companion
                        </p>
                      </div>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Background verified</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Heart className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Focus: Workplace stress & balance</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Ready for 1-on-1 session</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/signup"
                    className="mt-4 block w-full rounded-xl bg-white py-2 text-center text-xs font-semibold text-emerald-800 shadow-2xs transition hover:bg-emerald-50 dark:bg-card dark:text-emerald-300 dark:hover:bg-muted"
                  >
                    Connect with a Listener
                  </Link>
                </div>
              </div>

              {/* Bottom Guardrail Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <span>
                    Continuous Supervisor & Crisis Oversight • Member-Controlled
                    Consent
                  </span>
                </div>
                <span className="font-medium text-emerald-800 dark:text-emerald-400">
                  Zero Judgment Sanctuary
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: KEY FEATURES / MODALITIES GRID */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
              Thoughtful Modalities
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-foreground">
              Care crafted around your pace, comfort, and privacy.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-muted-foreground">
              Everyone approaches healing differently. MindSpace offers multiple
              modalities so you can express yourself in whatever way feels most
              natural today.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1: Guided Intake */}
            <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-border dark:bg-card">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800/40">
                <MessageSquare className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-foreground">
                Guided Intake (Chat & Voice)
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Begin with reflective text prompts or a soothing voice dialogue.
                No clinical jargon, no rushed forms—just thoughtful, self-paced
                onboarding.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60">
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-400"
                >
                  <span>Explore Intake</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Feature 2: Empathetic Peer Listeners */}
            <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-border dark:bg-card">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-800 ring-1 ring-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800/40">
                <Heart className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-foreground">
                Empathetic Peer Listeners
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Connect 1-on-1 with screened, trained peer companions who listen
                with genuine warmth, validating your feelings without diagnosing
                or judging.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 hover:underline dark:text-rose-300"
                >
                  <span>Meet Listeners</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Private Reflections & Mood Journal */}
            <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-border dark:bg-card">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:ring-teal-800/40">
                <Activity className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-foreground">
                Reflections & Mood Journal
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Record daily check-ins, observe emotional patterns, and track
                resilience over time inside a safe, encrypted personal vault.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:underline dark:text-teal-300"
                >
                  <span>Start Journaling</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Feature 4: 24/7 Safety & Crisis Oversight */}
            <div className="group rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:border-border dark:bg-card">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-800/40">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950 dark:text-foreground">
                24/7 Safety & Clinical Oversight
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Active safety guardrails monitor for distress signals with
                supervisor escalation workflows, ensuring emergency guidance is
                always at hand.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60">
                <a
                  href="#crisis"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 hover:underline dark:text-amber-300"
                >
                  <span>Crisis Protocols</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: CONNECTED CARE ECOSYSTEM (ROLE TRANSPARENCY) */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section
        id="ecosystem"
        className="bg-[#eaf5ef]/60 py-20 sm:py-28 dark:bg-card/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
              Connected Care Ecosystem
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-foreground">
              A transparent ecosystem designed for safety and support.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-muted-foreground">
              Mental wellness requires a coordinated community. MindSpace
              connects four distinct roles with clear boundaries to ensure
              empathy, supervisory accountability, and prompt crisis response.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Role 1: Members */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-border dark:bg-card">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                  Role: Member
                </span>
                <Users className="size-5 text-emerald-800 dark:text-emerald-400" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-foreground">
                Members & Seekers
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Individuals seeking a calmer space to reflect, speak, and build
                resilience at their own pace.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Guided chat and voice intake</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span>One-on-one peer listener matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Private mood reflection journal</span>
                </li>
              </ul>
            </div>

            {/* Role 2: Listeners */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-border dark:bg-card">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-900/60 dark:text-sky-200">
                  Role: Listener
                </span>
                <UserCheck className="size-5 text-sky-800 dark:text-sky-400" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-foreground">
                Peer Listeners
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Trained, compassionate companions providing active listening and
                non-judgmental presence.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-700 dark:text-sky-400" />
                  <span>Structured empathetic dialogue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-700 dark:text-sky-400" />
                  <span>Direct supervisor mentorship</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-700 dark:text-sky-400" />
                  <span>Single-click crisis escalation</span>
                </li>
              </ul>
            </div>

            {/* Role 3: Supervisors */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-border dark:bg-card">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-900 dark:bg-purple-900/60 dark:text-purple-200">
                  Role: Supervisor
                </span>
                <Stethoscope className="size-5 text-purple-800 dark:text-purple-400" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-foreground">
                Listener Supervisors
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Experienced practitioners overseeing quality of care, ethics,
                and listener wellbeing.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-700 dark:text-purple-400" />
                  <span>Live session oversight & review</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-700 dark:text-purple-400" />
                  <span>Debriefing & listener support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-700 dark:text-purple-400" />
                  <span>Protocol enforcement & training</span>
                </li>
              </ul>
            </div>

            {/* Role 4: Safety Operations */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xs dark:border-border dark:bg-card">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900 dark:bg-rose-900/60 dark:text-rose-200">
                  Role: Safety Ops
                </span>
                <ShieldAlert className="size-5 text-rose-800 dark:text-rose-400" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-foreground">
                Safety Operations
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Rapid-response specialists continuously monitoring safety
                signals to protect members during acute distress.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-rose-700 dark:text-rose-400" />
                  <span>24/7 real-time distress detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-rose-700 dark:text-rose-400" />
                  <span>Immediate crisis lifeline handoff</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-rose-700 dark:text-rose-400" />
                  <span>Clinical audit & risk escalation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 5: PRIVACY & TRUST PILLARS */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section id="privacy" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
              Our Privacy Commitments
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-foreground">
              Grounded in uncompromising privacy and respect.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg dark:text-muted-foreground">
              Vulnerability requires absolute trust. We built MindSpace from the
              ground up with privacy guardrails that keep you fully in control of
              your story.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Pillar 1 */}
            <div className="flex flex-col items-start rounded-2xl border border-slate-100 bg-[#f7faf8] p-6 dark:border-border/60 dark:bg-card/40">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                <Lock className="size-5" />
              </div>
              <h4 className="mt-5 text-lg font-semibold text-slate-950 dark:text-foreground">
                Member-Controlled Consent
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                You decide what to share, when to pause, and who can view your
                summaries. Consent can be updated or revoked anytime.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-start rounded-2xl border border-slate-100 bg-[#f7faf8] p-6 dark:border-border/60 dark:bg-card/40">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                <ShieldCheck className="size-5" />
              </div>
              <h4 className="mt-5 text-lg font-semibold text-slate-950 dark:text-foreground">
                End-to-End Encryption
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                Every reflection, chat message, and voice session is protected
                with strong encryption at rest and in transit.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col items-start rounded-2xl border border-slate-100 bg-[#f7faf8] p-6 dark:border-border/60 dark:bg-card/40">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                <Heart className="size-5" />
              </div>
              <h4 className="mt-5 text-lg font-semibold text-slate-950 dark:text-foreground">
                Zero Judgment Sanctuary
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                A trauma-informed space where every emotion is acknowledged with
                dignity. No grades, no criticism, and no judgment.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col items-start rounded-2xl border border-slate-100 bg-[#f7faf8] p-6 dark:border-border/60 dark:bg-card/40">
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                <Scale className="size-5" />
              </div>
              <h4 className="mt-5 text-lg font-semibold text-slate-950 dark:text-foreground">
                Ethical AI Guardrails
              </h4>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                AI aids your self-reflection and summaries, but never replaces
                human empathy, diagnosis, or clinical judgment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 6: PRE-FOOTER CTA BANNER */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12362B] via-[#236B54] to-[#0D241E] px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20 lg:px-16">
            {/* Background Texture Decorators */}
            <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-teal-300/20 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                Begin Your Journey
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Make room for how you feel today.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-emerald-100 sm:text-lg">
                Whether you need five quiet minutes to reflect, a guided
                conversation, or an empathetic peer listener, MindSpace is here
                whenever you are ready.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-emerald-950 shadow-md transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:w-auto"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="size-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300/60 bg-emerald-900/40 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-xs transition hover:-translate-y-0.5 hover:bg-emerald-900/70 sm:w-auto"
                >
                  <span>Sign In to Your Space</span>
                </Link>
              </div>

              <p className="mt-6 text-xs text-emerald-200/80">
                Free to start • No credit card required • Cancel or delete data
                anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* SECTION 7: FOOTER WITH CRISIS DISCLAIMER */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <footer
        id="crisis"
        className="border-t border-slate-200 bg-white pt-16 pb-12 dark:border-border dark:bg-card"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Emergency Crisis Disclaimer Banner */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 sm:p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div className="flex flex-col sm:flex-row items-start gap-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                <AlertCircle className="size-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-rose-950 dark:text-rose-200">
                  Emergency & Crisis Medical Notice
                </h4>
                <p className="mt-1 text-xs leading-5 text-rose-900/90 dark:text-rose-300/90">
                  MindSpace is a wellness and supportive peer connection
                  platform; it is{" "}
                  <strong>not an emergency psychiatric clinic</strong> or a
                  substitute for immediate medical intervention. If you are
                  experiencing thoughts of self-harm, a psychiatric emergency,
                  or immediate danger, please reach out now:
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-rose-950 dark:text-rose-200">
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneCall className="size-3.5" />
                    <span>US & Canada: Call or text 988 (Lifeline)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneCall className="size-3.5" />
                    <span>India: Call 112 (Emergency Response)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneCall className="size-3.5" />
                    <span>UK: Call 111 or 999</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Footer Links & Directory */}
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Column 1: Brand Info */}
            <div className="col-span-2 md:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 transition hover:opacity-90"
              >
                <AppLogo size={32} className="size-8 text-emerald-800" />
                <span className="text-lg font-semibold tracking-tight text-slate-950 dark:text-foreground">
                  MindSpace
                </span>
              </Link>
              <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-muted-foreground">
                A calmer space for mental wellness, guided conversations, and
                connected care. Move at your own pace.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <LocaleSwitcher />
                <ThemeSwitcher />
              </div>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-950 dark:text-foreground">
                Platform
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-muted-foreground">
                <li>
                  <Link
                    href="/intake"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Guided Intake
                  </Link>
                </li>
                <li>
                  <Link
                    href="/intake/chat"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Chat Conversation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/intake/voice"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Voice Guided Intake
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Peer Listener Matching
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Mood Journal & Insights
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Care Roles */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-950 dark:text-foreground">
                Care Ecosystem
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-muted-foreground">
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Member Experience
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Peer Listener Portal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Supervisor Oversight
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Safety Operations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Trust & Help */}
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-950 dark:text-foreground">
                Trust & Support
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-muted-foreground">
                <li>
                  <a
                    href="#privacy"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Privacy Commitments
                  </a>
                </li>
                <li>
                  <a
                    href="#crisis"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Crisis Resources (988)
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Member Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="hover:text-emerald-800 dark:hover:text-foreground"
                  >
                    Create Account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row dark:border-border/60">
            <p className="text-xs text-slate-500 dark:text-muted-foreground">
              © {new Date().getFullYear()} MindSpace Health, Inc. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-muted-foreground">
              <a href="#privacy" className="hover:underline">
                Privacy Policy
              </a>
              <a href="#privacy" className="hover:underline">
                Terms of Service
              </a>
              <a href="#crisis" className="hover:underline">
                Crisis Disclaimer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
