import { Geist, Geist_Mono } from "next/font/google";
import WorkspaceSidebar, {
  WorkspaceHeader,
} from "./components/workspace-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider style={{ "--sidebar-width": "4.75rem" }}>
              <a href="#main-content" className="skip-link">
                Skip to content
              </a>
              <WorkspaceSidebar />
              <SidebarInset className="studio-main">
                <WorkspaceHeader />
                <div id="main-content" tabIndex={-1}>
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
