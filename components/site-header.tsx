"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
            <BrandMark className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold">Summit Ridge</span>
            <span className="block text-[12px] text-[var(--muted-foreground)]">Denver desk</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-[13px]">
          <Link className="hidden sm:inline" href="/#how">How it works</Link>
          <Link href="/chat">Live chat</Link>
          <Link href="/admin">Admin</Link>
          <Link className="hidden sm:inline" href="/embed-demo">Embed</Link>
          <button type="button" className="rounded-full bg-[var(--accent)] px-3 py-2 text-[var(--accent-foreground)]" onClick={() => window.dispatchEvent(new CustomEvent("summit-ask", { detail: BRAND.starters[0].prompt }))}>
            Open the desk
          </button>
          <button type="button" aria-label={resolvedTheme === "dark" ? "Use light mode" : "Use dark mode"} className="grid size-8 place-items-center rounded-full border border-[var(--border)]" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl">
          {BRAND.disclaimer}. Summit Ridge Realty is not a brokerage. This text desk is separate from the voice appointment setter at realestate.quvantic.com. Fictional address: 1400 Platte Street, Denver, CO.
        </p>
        <p>realty-chat.quvantic.com</p>
      </div>
    </footer>
  );
}
