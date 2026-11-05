import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import React from "react";
import { routing } from "../src/i18n/routing";
import { hasLocale } from "next-intl";

const PAGE_PATH = path.resolve(__dirname, "../src/app/[locale]/page.tsx");

// ---------------------------------------------------------------------------
// 1. Static AST Analysis: Redirect Absence & Imports
// ---------------------------------------------------------------------------
test("AST Analysis: No redirect or permanentRedirect imports or calls", () => {
  const code = fs.readFileSync(PAGE_PATH, "utf-8");
  const sourceFile = ts.createSourceFile(
    PAGE_PATH,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let redirectImportCount = 0;
  let redirectCallCount = 0;
  let notFoundImportCount = 0;
  let linkImportCount = 0;
  let setRequestLocaleImportCount = 0;
  let hasLocaleImportCount = 0;

  function visit(node: ts.Node) {
    // Check import declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
      const namedBindings = node.importClause?.namedBindings;

      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          const importName = element.name.text;
          if (importName === "redirect" || importName === "permanentRedirect") {
            redirectImportCount++;
          }
          if (importName === "notFound") {
            notFoundImportCount++;
            assert.strictEqual(
              moduleSpecifier,
              "next/navigation",
              "notFound must be imported from next/navigation"
            );
          }
          if (importName === "Link") {
            linkImportCount++;
            assert.strictEqual(
              moduleSpecifier,
              "@/i18n/navigation",
              "Link must be imported from @/i18n/navigation for next-intl routing"
            );
          }
          if (importName === "hasLocale") {
            hasLocaleImportCount++;
            assert.strictEqual(
              moduleSpecifier,
              "next-intl",
              "hasLocale must be imported from next-intl"
            );
          }
          if (importName === "setRequestLocale") {
            setRequestLocaleImportCount++;
            assert.strictEqual(
              moduleSpecifier,
              "next-intl/server",
              "setRequestLocale must be imported from next-intl/server"
            );
          }
        }
      }
    }

    // Check function calls
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isIdentifier(expr)) {
        if (expr.text === "redirect" || expr.text === "permanentRedirect") {
          redirectCallCount++;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  assert.strictEqual(
    redirectImportCount,
    0,
    "Expected ZERO imports of redirect/permanentRedirect"
  );
  assert.strictEqual(
    redirectCallCount,
    0,
    "Expected ZERO calls to redirect/permanentRedirect"
  );
  assert.strictEqual(
    notFoundImportCount,
    1,
    "Expected exactly 1 import of notFound"
  );
  assert.strictEqual(
    linkImportCount,
    1,
    "Expected exactly 1 import of Link from @/i18n/navigation"
  );
  assert.strictEqual(
    hasLocaleImportCount,
    1,
    "Expected exactly 1 import of hasLocale from next-intl"
  );
  assert.strictEqual(
    setRequestLocaleImportCount,
    1,
    "Expected exactly 1 import of setRequestLocale from next-intl/server"
  );
});

// ---------------------------------------------------------------------------
// 2. AST Analysis: CTA Targets and Link Destinations
// ---------------------------------------------------------------------------
test("AST Analysis: CTA Targets and Link destinations", () => {
  const code = fs.readFileSync(PAGE_PATH, "utf-8");
  const sourceFile = ts.createSourceFile(
    PAGE_PATH,
    code,
    ts.ScriptTarget.Latest,
    true
  );

  interface ExtractedLink {
    href: string;
    text: string;
    line: number;
  }

  const links: ExtractedLink[] = [];

  function getTextContent(node: ts.Node): string {
    let text = "";
    function collect(n: ts.Node) {
      if (ts.isJsxText(n)) {
        text += n.text.trim() + " ";
      } else if (ts.isStringLiteral(n)) {
        text += n.text + " ";
      }
      ts.forEachChild(n, collect);
    }
    collect(node);
    return text.trim();
  }

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = opening.tagName.getText(sourceFile);

      if (tagName === "Link") {
        let hrefValue = "";
        for (const prop of opening.attributes.properties) {
          if (
            ts.isJsxAttribute(prop) &&
            prop.name.getText(sourceFile) === "href"
          ) {
            if (prop.initializer && ts.isStringLiteral(prop.initializer)) {
              hrefValue = prop.initializer.text;
            } else if (
              prop.initializer &&
              ts.isJsxExpression(prop.initializer) &&
              prop.initializer.expression &&
              ts.isStringLiteral(prop.initializer.expression)
            ) {
              hrefValue = prop.initializer.expression.text;
            }
          }
        }

        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
            .line + 1;
        const text = ts.isJsxElement(node) ? getTextContent(node) : "";

        links.push({ href: hrefValue, text, line });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  assert.ok(
    links.length >= 10,
    `Expected at least 10 Link instances, found ${links.length}`
  );

  // Group links by href
  const signupLinks = links.filter((l) => l.href === "/signup");
  const loginLinks = links.filter((l) => l.href === "/login");
  const homeLinks = links.filter((l) => l.href === "/");
  const intakeLinks = links.filter(
    (l) =>
      l.href === "/intake" ||
      l.href === "/intake/chat" ||
      l.href === "/intake/voice"
  );

  assert.ok(
    signupLinks.length >= 4,
    `Expected at least 4 "/signup" CTAs across Header, Hero, Features, Banner, Footer; found ${signupLinks.length}`
  );
  assert.ok(
    loginLinks.length >= 3,
    `Expected at least 3 "/login" CTAs across Header, Hero, Banner, Footer; found ${loginLinks.length}`
  );
  assert.ok(
    homeLinks.length >= 2,
    `Expected at least 2 "/" brand links (Header, Footer); found ${homeLinks.length}`
  );
  assert.ok(
    intakeLinks.length >= 3,
    `Expected at least 3 intake links (/intake, /intake/chat, /intake/voice); found ${intakeLinks.length}`
  );

  // Verify all hrefs are valid internal Next-Intl routes
  const validAllowedHrefs = new Set([
    "/",
    "/signup",
    "/login",
    "/intake",
    "/intake/chat",
    "/intake/voice",
  ]);

  for (const l of links) {
    assert.ok(
      validAllowedHrefs.has(l.href),
      `Unexpected Link href "${l.href}" at line ${l.line}`
    );
  }
});

// ---------------------------------------------------------------------------
// 3. Routing & Locale Validation: hasLocale, generateStaticParams
// ---------------------------------------------------------------------------
test("Locale Handling: Supported locales and generateStaticParams", async () => {
  assert.deepStrictEqual(routing.locales, ["en", "hi", "ta"]);
  assert.strictEqual(routing.defaultLocale, "en");

  // Valid locales
  assert.strictEqual(hasLocale(routing.locales, "en"), true);
  assert.strictEqual(hasLocale(routing.locales, "hi"), true);
  assert.strictEqual(hasLocale(routing.locales, "ta"), true);

  // Invalid locales
  assert.strictEqual(hasLocale(routing.locales, "fr"), false);
  assert.strictEqual(hasLocale(routing.locales, "es"), false);
  assert.strictEqual(hasLocale(routing.locales, "de"), false);
  assert.strictEqual(hasLocale(routing.locales, "invalid"), false);
  assert.strictEqual(hasLocale(routing.locales, ""), false);
  assert.strictEqual(hasLocale(routing.locales, "en-US"), false);
  assert.strictEqual(hasLocale(routing.locales, "../login"), false);

  // Import page module
  const pageModule = await import("../src/app/[locale]/page");
  assert.ok(
    typeof pageModule.generateStaticParams === "function",
    "generateStaticParams must be exported"
  );

  const staticParams = pageModule.generateStaticParams();
  assert.deepStrictEqual(staticParams, [
    { locale: "en" },
    { locale: "hi" },
    { locale: "ta" },
  ]);
});

// ---------------------------------------------------------------------------
// 4. Runtime Component Execution: Valid Locales vs Invalid Locales
// ---------------------------------------------------------------------------
test("Runtime Execution: Valid locales reach setRequestLocale without redirects, invalid locales trigger notFound()", async () => {
  const pageModule = await import("../src/app/[locale]/page");
  const LocaleRootPage = pageModule.default;

  assert.ok(
    typeof LocaleRootPage === "function",
    "Default export must be an async component function"
  );

  // Test invalid locales — must throw NEXT_NOT_FOUND error
  const invalidLocales = ["es", "fr", "unknown", "", "../bad", "en-US"];

  for (const invLocale of invalidLocales) {
    let threwNotFound = false;
    try {
      await LocaleRootPage({
        params: Promise.resolve({ locale: invLocale }),
      });
    } catch (err: any) {
      // In Next.js 16, notFound() throws an error with digest 'NEXT_HTTP_ERROR_FALLBACK;404' (or 'NEXT_NOT_FOUND' in older versions)
      if (
        err?.digest?.includes("404") ||
        err?.digest?.includes("NEXT_NOT_FOUND") ||
        err?.message?.includes("NEXT_NOT_FOUND")
      ) {
        threwNotFound = true;
      } else {
        throw err;
      }
    }
    assert.strictEqual(
      threwNotFound,
      true,
      `Expected notFound() to be called for invalid locale: "${invLocale}"`
    );
  }

  // Test valid locales: "en", "hi", "ta"
  // For valid locales, verify:
  // 1. It does NOT call notFound()
  // 2. It does NOT call redirect()
  // 3. It progresses to setRequestLocale(locale) (confirming locale acceptance)
  const validLocales = ["en", "hi", "ta"];
  for (const validLocale of validLocales) {
    let reachedSetRequestLocale = false;
    let threwNotFound = false;
    try {
      await LocaleRootPage({
        params: Promise.resolve({ locale: validLocale }),
      });
      reachedSetRequestLocale = true;
    } catch (err: any) {
      if (err?.digest?.includes("404") || err?.digest === "NEXT_NOT_FOUND") {
        threwNotFound = true;
      } else if (err?.message?.includes("setRequestLocale")) {
        // Confirms it successfully passed hasLocale validation and called setRequestLocale(locale)
        reachedSetRequestLocale = true;
      } else {
        throw err;
      }
    }

    assert.strictEqual(
      threwNotFound,
      false,
      `Valid locale "${validLocale}" must NOT call notFound()`
    );
    assert.strictEqual(
      reachedSetRequestLocale,
      true,
      `Valid locale "${validLocale}" must pass hasLocale validation and execute setRequestLocale`
    );
  }
});

// ---------------------------------------------------------------------------
// 5. Content & Structural Integrity: Brand, Modalities, Ecosystem, Crisis
// ---------------------------------------------------------------------------
test("Content & Structural Integrity: Core requirements and design tokens", () => {
  const code = fs.readFileSync(PAGE_PATH, "utf-8");

  // MindSpace Branding & Controls
  assert.ok(code.includes("AppLogo"), "Must render AppLogo");
  assert.ok(code.includes("LocaleSwitcher"), "Must render LocaleSwitcher");
  assert.ok(code.includes("ThemeSwitcher"), "Must render ThemeSwitcher");
  assert.ok(code.includes("MindSpace"), "Must render MindSpace brand name");

  // Design Tokens & Colors
  assert.ok(code.includes("#236B54"), "Must use MindSpace forest emerald (#236B54)");
  assert.ok(code.includes("#f7faf8"), "Must use sage/mint background token (#f7faf8)");
  assert.ok(code.includes("#eaf5ef"), "Must use secondary mint background token (#eaf5ef)");
  assert.ok(code.includes("dark:bg-background"), "Must support dark mode tokens");

  // Section 1: Header / Navbar
  assert.ok(code.includes("Wellbeing Sanctuary"), "Header must include sanctuary badge");
  assert.ok(code.includes("href=\"/login\""), "Header must have Sign In link");
  assert.ok(code.includes("href=\"/signup\""), "Header must have Get Started link");

  // Section 2: Hero
  assert.ok(code.includes("Your wellbeing deserves a"), "Hero must include main headline");
  assert.ok(code.includes("space of its own"), "Hero headline emphasis phrase");
  assert.ok(code.includes("Get Started Free"), "Hero CTA Get Started");
  assert.ok(code.includes("Sign In to MindSpace"), "Hero CTA Sign In");
  assert.ok(code.includes("Explore Guided Intake"), "Hero guided intake link");
  assert.ok(code.includes("MindSpace Member Workspace"), "Hero sanctuary preview card");

  // Section 3: Modalities
  assert.ok(code.includes("Guided Intake (Chat & Voice)"), "Feature 1: Guided Intake");
  assert.ok(code.includes("Empathetic Peer Listeners"), "Feature 2: Peer Listeners");
  assert.ok(code.includes("Reflections & Mood Journal"), "Feature 3: Mood Journal");
  assert.ok(code.includes("24/7 Safety & Clinical Oversight"), "Feature 4: Safety & Crisis");

  // Section 4: Care Ecosystem Roles
  assert.ok(code.includes("Role: Member"), "Ecosystem role: Member");
  assert.ok(code.includes("Role: Listener"), "Ecosystem role: Listener");
  assert.ok(code.includes("Role: Supervisor"), "Ecosystem role: Supervisor");
  assert.ok(code.includes("Role: Safety Ops"), "Ecosystem role: Safety Ops");

  // Section 5: Privacy Pillars
  assert.ok(code.includes("Member-Controlled Consent"), "Privacy pillar 1: Consent");
  assert.ok(code.includes("End-to-End Encryption"), "Privacy pillar 2: Encryption");
  assert.ok(code.includes("Zero Judgment Sanctuary"), "Privacy pillar 3: Zero Judgment");
  assert.ok(code.includes("Ethical AI Guardrails"), "Privacy pillar 4: Ethical AI");

  // Section 6: Pre-Footer CTA Banner
  assert.ok(code.includes("Make room for how you feel today"), "Pre-footer headline");
  assert.ok(code.includes("Sign In to Your Space"), "Pre-footer sign-in CTA");

  // Section 7: Crisis Notice & Footer
  assert.ok(code.includes("988"), "Footer must include 988 Lifeline");
  assert.ok(code.includes("112"), "Footer must include India 112 hotline");
  assert.ok(code.includes("111 or 999"), "Footer must include UK 111/999 hotline");
  assert.ok(code.includes("Emergency & Crisis Medical Notice"), "Footer must include emergency notice header");
  assert.ok(code.includes("not an emergency psychiatric clinic"), "Footer must include psychiatric disclaimer");
});
