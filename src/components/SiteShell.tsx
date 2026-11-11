"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header, SiteNavigation } from "./Header";

export function SiteShell({
  children,
  account,
  collapsedByDefault = false,
  renderSidebar,
}: {
  children: ReactNode;
  account?: ReactNode;
  collapsedByDefault?: boolean;
  renderSidebar?: (compact: boolean) => ReactNode;
}) {
  const pathname = usePathname();
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.location.hash)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  useEffect(() => {
    const header = shell.current?.querySelector("header");
    if (!header) return;
    const update = () =>
      shell.current?.style.setProperty(
        "--site-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  return (
    <div
      ref={shell}
      className={`site-shell${collapsed ? " site-shell-compact" : ""}`}
    >
      <Header account={account} mobileContent={renderSidebar?.(false)} />
      <div className="site-shell-body">
        <aside className="site-sidebar" aria-label="Site sidebar">
          <div className="site-sidebar-heading">
            {!collapsed && <span>Library</span>}
            <button
              type="button"
              className="site-sidebar-toggle"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed(!collapsed)}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M3 4h18v16H3zM9 4v16" />
              </svg>
            </button>
          </div>
          <nav aria-label="Main">
            <SiteNavigation compact={collapsed} />
          </nav>
          {renderSidebar && (
            <section
              className="site-sidebar-community"
              aria-label="Community workspace"
            >
              {!collapsed && (
                <h2 className="site-sidebar-section-title">Workspace</h2>
              )}
              {renderSidebar(collapsed)}
            </section>
          )}
        </aside>
        <div className="site-page-content">{children}</div>
      </div>
    </div>
  );
}
