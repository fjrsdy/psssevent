"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves, Menu, X, Server, CalendarDays, ScanLine, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Proyek GAS", href: "/", Icon: Server },
    { label: "Panduan", href: "/#panduan", Icon: Waves },
    { label: "Demo UI", href: "/events", Icon: CalendarDays },
    { label: "Scan QR", href: "/scan", Icon: ScanLine },
    { label: "Dashboard", href: "/admin", Icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-teal-900 via-blue-950 to-teal-900 text-white shadow-lg shadow-blue-950/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
            <Waves className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[15px] font-extrabold tracking-tight">SIMANEV PSSDM</strong>
            <small className="hidden text-[10px] font-semibold text-blue-200/80 sm:block">
              Google Apps Script + Blogger
            </small>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
                isActive(link.href)
                  ? "bg-amber-400 text-blue-950"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-white/10 md:hidden"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="space-y-1 border-t border-white/10 bg-blue-950/95 px-4 py-4 shadow-xl md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                isActive(link.href) ? "bg-amber-400 text-blue-950" : "text-blue-100 hover:bg-white/10"
              }`}
            >
              <link.Icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
