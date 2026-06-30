"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const navItems = [
  { href: "/explore", label: "Discover" },
  { href: "/stack", label: "Stacks" },
  { href: "/blogs", label: "Updates" },
  { href: "/categories", label: "Categories" },
];

export default function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e3e3df] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-5 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="inline-flex items-center rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
          aria-label="UseStack home"
        >
          <BrandLogo />
        </Link>

        <nav className="hidden items-center justify-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium text-[#5f5f5a] transition hover:text-black focus-visible:outline-none focus-visible:text-black"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => router.push("/explore")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#555550] transition hover:bg-[#f1f1ee] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            type="button"
            aria-label="Search AI tools"
            title="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          <Link
            href="/submit-tool"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#171717] px-4 text-[13px] font-medium text-white transition hover:bg-[#333333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Submit tool</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
