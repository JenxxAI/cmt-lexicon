"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { SITE } from "@/lib/site";
import { HeaderAccount } from "./HeaderAccount";
import "./header.css";

const destinations = [
  ["/#browse", "Components", "/components/"],
  ["/websites/", "Website types", "/websites"],
  ["/community/", "Community", "/community"],
  ["/assets/", "Icons & assets", "/assets"],
  ["/cheat-sheet/", "Cheat sheet", "/cheat-sheet"],
] as const;

export function Header({
  account,
  mobileContent,
}: {
  account?: ReactNode;
  mobileContent?: ReactNode;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function close() {
    drawer.current?.close();
    trigger.current?.focus();
  }
  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <span aria-hidden="true">Aa</span>
        <span>{SITE.name}</span>
      </Link>
      <div className="site-account">
        {account === undefined ? <HeaderAccount /> : account}
      </div>
      <button
        type="button"
        ref={trigger}
        className="site-menu-toggle"
        aria-label="Open site navigation"
        aria-haspopup="dialog"
        onClick={() => drawer.current?.showModal()}
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <dialog
        ref={drawer}
        className="site-drawer"
        aria-labelledby="site-navigation-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="site-drawer-inner">
          <div className="site-drawer-heading">
            <h2 id="site-navigation-title">Explore UI Lexicon</h2>
            <button
              type="button"
              aria-label="Close site navigation"
              onClick={close}
            >
              ✕
            </button>
          </div>
          <div
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) close();
            }}
          >
            <nav aria-label="Main">
              <SiteNavigation />
              <a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`}>
                Contribute
              </a>
              <a href={SITE.repoUrl}>Star on GitHub</a>
            </nav>
            {mobileContent && (
              <section
                className="site-mobile-community"
                aria-label="Community navigation"
              >
                <h2>Community workspace</h2>
                {mobileContent}
              </section>
            )}
          </div>
        </div>
      </dialog>
    </header>
  );
}

export function SiteNavigation({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const symbols = [
    "M4 4h16v16H4zM9 4v16M9 10h11",
    "M3 4h18v16H3zM3 9h18",
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-4",
    "m12 3 9 9-9 9-9-9z",
    "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5",
  ];
  return (
    <>
      {destinations.map(([href, label, prefix], index) => (
        <Link
          key={href}
          href={href}
          title={compact ? label : undefined}
          aria-label={compact ? label : undefined}
          aria-current={
            (pathname === "/" && label === "Components") ||
            pathname.startsWith(prefix)
              ? "page"
              : undefined
          }
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            <path d={symbols[index]} />
          </svg>
          {!compact && <span>{label}</span>}
        </Link>
      ))}
    </>
  );
}
