"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavGroup = {
  category: string;
  docs: { slug: string; title: string }[];
};

export default function DocsNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="text-sm">
      <Link
        href="/docs"
        onClick={() => setOpen(false)}
        className={`block rounded-md px-3 py-2 mb-2 font-medium transition-colors ${
          pathname === "/docs"
            ? "bg-void text-pebble"
            : "text-ink/80 hover:bg-pebble"
        }`}
      >
        Accueil
      </Link>
      {groups.map((group) => (
        <div key={group.category} className="mb-5">
          <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-mute">
            {group.category}
          </div>
          <ul className="space-y-0.5">
            {group.docs.map((doc) => {
              const href = `/docs/${doc.slug}`;
              const active = pathname === href;
              return (
                <li key={doc.slug}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-1.5 transition-colors ${
                      active
                        ? "bg-void text-pebble font-medium"
                        : "text-ink/75 hover:bg-pebble hover:text-ink"
                    }`}
                  >
                    {doc.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b border-wire bg-pebble/90 backdrop-blur px-4 py-3">
        <Link href="/docs" className="font-display font-semibold text-ink">
          Protocol Handbook
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-wire px-3 py-1.5 text-sm text-ink"
          aria-expanded={open}
        >
          {open ? "Fermer" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-b border-wire bg-white px-3 py-4">
          {nav}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-wire bg-white">
        <div className="sticky top-0 max-h-screen overflow-y-auto px-3 py-6">
          <Link href="/docs" className="block px-3 mb-6">
            <div className="font-display text-lg font-semibold text-ink leading-tight">
              Protocol
            </div>
            <div className="text-[11px] uppercase tracking-widest text-mute">
              Company Handbook
            </div>
          </Link>
          {nav}
        </div>
      </aside>
    </>
  );
}
