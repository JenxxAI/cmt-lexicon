"use client";

import { useState, type ReactNode } from "react";
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
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  return (
    <div className={`site-shell${collapsed ? " site-shell-compact" : ""}`}>
      <Header account={account} mobileContent={renderSidebar?.(false)} />
      <div className="site-shell-body">
        <aside className="site-sidebar" aria-label="Site sidebar">
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
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {!collapsed && <span>Explore</span>}
          </button>
          <nav aria-label="Main">
            <SiteNavigation compact={collapsed} />
          </nav>
          {renderSidebar && (
            <section
              className="site-sidebar-community"
              aria-label="Community workspace"
            >
              {renderSidebar(collapsed)}
            </section>
          )}
        </aside>
        <div className="site-page-content">{children}</div>
      </div>
    </div>
  );
}
