import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SiteWidgetGate } from "@/components/site-widget";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Summit Ridge Realty",
    template: "%s · Summit Ridge Realty",
  },
  description:
    "Text desk for a fictional Denver brokerage. Search listings, qualify a lead, and book a showing. Portfolio demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col pb-28">
        <ThemeProvider>
          {children}
          <SiteWidgetGate />
        </ThemeProvider>
      </body>
    </html>
  );
}
