"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_LINKS = [
  {
    href: "/sales-brochure-generator",
    label: "Sales brochure",
    icon: (
      <>
        <path d="M5 4.75h14a1.25 1.25 0 0 1 1.25 1.25v12A1.25 1.25 0 0 1 19 19.25H5A1.25 1.25 0 0 1 3.75 18V6A1.25 1.25 0 0 1 5 4.75Z" />
        <path d="M8 9h8M8 12.5h8M8 16h4" />
      </>
    ),
  },
  {
    href: "/ai-tutor",
    label: "AI tutor",
    icon: (
      <>
        <path d="M4.5 5.75A2.25 2.25 0 0 1 6.75 3.5h10.5A2.25 2.25 0 0 1 19.5 5.75v8.5a2.25 2.25 0 0 1-2.25 2.25h-5.5l-4.5 3v-3h-.5A2.25 2.25 0 0 1 4.5 14.25Z" />
        <path d="M8 8.5h8M8 12h5" />
      </>
    ),
  },
  {
    href: "/multi-model-chat",
    label: "Multi-model chat",
    icon: (
      <>
        <path d="M3.5 5h12v8h-8l-4 3V5Z" />
        <path d="M18.5 9h2v10l-4-3h-5M7 9h5" />
      </>
    ),
  },
];

export default function WorkspaceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/sales-brochure-generator">
        <span className="brand-mark" aria-hidden="true">A</span>
        <span className="brand-name">ai<span> studio</span></span>
      </Link>

      <div className="sidebar-label">WORKSPACE</div>
      <nav className="workspace-nav" aria-label="Main navigation">
        {WORKSPACE_LINKS.map((link) => {
          const isCurrent = pathname === link.href;

          return (
            <Link
              key={link.href}
              className={`nav-link${isCurrent ? " active" : ""}`}
              href={link.href}
              aria-current={isCurrent ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {link.icon}
              </svg>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>AI-powered workspace</span>
      </div>
    </aside>
  );
}
