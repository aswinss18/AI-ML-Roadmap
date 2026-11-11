import { Geist, Geist_Mono } from "next/font/google";
import WorkspaceSidebar from "./components/workspace-sidebar";
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
  title: {
    default: "AI Studio",
    template: "%s | AI Studio",
  },
  description: "A thoughtful workspace for learning and creating with AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <div className="app-shell">
          <WorkspaceSidebar />
          <main className="main-panel">{children}</main>
        </div>
      </body>
    </html>
  );
}
