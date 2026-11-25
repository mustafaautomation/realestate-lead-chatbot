import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={cn("border-b", dark ? "border-white/10 bg-[#163028] text-[#F6F1E7]" : "border-border/80 bg-background/80 backdrop-blur")}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-md text-sm", dark ? "bg-[#E7D3B0] text-[#163028]" : "bg-primary text-primary-foreground")} aria-hidden>
            SR
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-base">Summit Ridge</span>
            <span className={cn("block text-xs", dark ? "text-[#E7D3B0]" : "text-muted-foreground")}>Denver desk</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }), dark && "text-[#F6F1E7] hover:bg-white/10")} href="/listings">
            Listings
          </Link>
          <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }), dark && "text-[#F6F1E7] hover:bg-white/10")} href="/admin">
            Desk
          </Link>
          <Link className={cn(buttonVariants({ size: "sm" }), dark && "bg-[#E7D3B0] text-[#163028] hover:bg-[#E7D3B0]/90")} href="/chat">
            Open chat
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-xl">
          Portfolio demo by Quvantic - fictional brand, not a real business / not client work. Summit Ridge Realty is not a brokerage. This text desk is separate from the voice appointment setter at realestate.quvantic.com.
        </p>
        <p>realty-chat.quvantic.com</p>
      </div>
    </footer>
  );
}
