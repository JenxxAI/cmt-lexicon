"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { SiteShell } from "./SiteShell";
import { Footer } from "./Footer";

export function CommunityShell({
  view,
  moderator,
  account,
  children,
}: {
  view: string;
  moderator: boolean;
  account: ReactNode;
  children: ReactNode;
}) {
  const links = [
    { href: "/community/", view: "browse", label: "Explore", icon: "grid" },
    {
      href: "/community/mine/",
      view: "mine",
      label: "My submissions",
      icon: "folder",
    },
    ...(moderator
      ? [
          {
            href: "/community/moderate/",
            view: "moderate",
            label: "Review queue",
            icon: "check",
          },
        ]
      : []),
  ];
  function navigation(compact: boolean) {
    return (
      <>
        <Link
          href="/community/create/"
          className="shell-create btn btn-primary"
          aria-label="Create project"
          title={compact ? "Create project" : undefined}
          aria-current={view === "create" ? "page" : undefined}
        >
          <ShellIcon name="plus" />
          {!compact && <span>Create project</span>}
        </Link>
        <nav aria-label="Community">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={compact ? link.label : undefined}
              title={compact ? link.label : undefined}
              aria-current={view === link.view ? "page" : undefined}
            >
              <ShellIcon name={link.icon} />
              {!compact && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>
      </>
    );
  }
  return (
    <SiteShell
      account={account}
      collapsedByDefault={view === "create"}
      renderSidebar={navigation}
    >
      <main id="main" className="pt-8">
        {children}
        <Footer />
      </main>
    </SiteShell>
  );
}

function ShellIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    folder: "M3 7V4h6l3 3h9v13H3z",
    check: "m5 12 4 4L19 6",
    plus: "M12 4v16M4 12h16",
    book: "M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1Z",
    window: "M3 3h18v18H3zM3 8h18",
    menu: "M4 6h16M4 12h16M4 18h16",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    close: "m6 6 12 12M6 18 18 6",
  };
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
