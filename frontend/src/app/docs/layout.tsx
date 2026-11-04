import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/theme/ThemeProvider";

const dmSans = { className: "" };

export const metadata: Metadata = {
  title: "Drgodly Mobile Integration Guide",
  description: "How to build a mobile app against Drgodly's FHIR, FHIR-staging, AI agent, and Mobile APIs.",
};

export default function DocsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
