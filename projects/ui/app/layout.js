import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Brochure Studio",
  description: "Create polished sales brochures from any website.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link className="brand" href="/sales-brochure-generator">
              <span className="brand-mark" aria-hidden="true">B</span>
              <span className="brand-name">brochure<span>studio</span></span>
            </Link>

            <div className="sidebar-label">WORKSPACE</div>
            <nav aria-label="Main navigation">
              <Link className="nav-link active" href="/sales-brochure-generator" aria-current="page">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 4.75h14a1.25 1.25 0 0 1 1.25 1.25v12A1.25 1.25 0 0 1 19 19.25H5A1.25 1.25 0 0 1 3.75 18V6A1.25 1.25 0 0 1 5 4.75Z" />
                  <path d="M8 9h8M8 12.5h8M8 16h4" />
                </svg>
                <span>Sales brochure</span>
              </Link>
            </nav>

            <div className="sidebar-footer">
              <span className="status-dot" />
              <span>AI-powered workspace</span>
            </div>
          </aside>
          <main className="main-panel">{children}</main>
        </div>
      </body>
    </html>
  );
}
