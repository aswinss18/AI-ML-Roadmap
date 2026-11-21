"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  CircleHelp,
  FileText,
  Layers2,
  Monitor,
  Moon,
  Plane,
  Search,
  Sun,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const WORKSPACE_LINKS = [
  {
    href: "/ai-assistant",
    label: "Genie assistant",
    shortLabel: "Assistant",
    description: "A thinking partner for everyday work",
    icon: AudioLines,
  },
  {
    href: "/sales-brochure-generator",
    label: "Sales brochure",
    shortLabel: "Create",
    description: "Turn a website into a compelling story",
    icon: FileText,
  },
  {
    href: "/ai-tutor",
    label: "AI tutor",
    shortLabel: "Learn",
    description: "Make complex ideas click",
    icon: BookOpen,
  },
  {
    href: "/multi-model-chat",
    label: "Model conversations",
    shortLabel: "Discuss",
    description: "Explore a topic from two perspectives",
    icon: Layers2,
  },
  {
    href: "/airline-agent",
    label: "Airline Agent",
    shortLabel: "Flights",
    description: "Look up flight status and chat with Lisa",
    icon: Plane,
  },
];

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="appearance-button"
          aria-label="Appearance"
          title="Appearance"
        >
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
          <span>Appearance</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const helpRef = useRef(null);
  const searchReturnFocusRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        if (!searchOpen) searchReturnFocusRef.current = document.activeElement;
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  function restoreFocus(element) {
    const target =
      element?.isConnected && element.getClientRects().length
        ? element
        : document.getElementById("main-content");
    target?.focus();
  }
  return (
    <>
      <Sidebar className="studio-sidebar" collapsible="offcanvas">
        <SidebarHeader className="studio-sidebar-header">
          <Link
            href="/"
            className="studio-brand"
            aria-label="AI Studio home"
            onClick={() => setOpenMobile(false)}
          >
            <span className="studio-logo">
              <BrandMark />
            </span>
            <span className="rail-mobile-label">AI Studio</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main navigation">
            <SidebarGroup className="rail-group">
              <SidebarMenu>
                {WORKSPACE_LINKS.map(({ href, label, shortLabel, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === href}
                          className="studio-nav-link"
                        >
                          <Link
                            href={href}
                            aria-label={label}
                            aria-current={
                              pathname === href ? "page" : undefined
                            }
                            onClick={() => setOpenMobile(false)}
                          >
                            <Icon />
                            <span className="rail-short-label">{shortLabel}</span>
                            <span className="rail-mobile-label">{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarFooter className="rail-footer">
          <Button
            ref={searchRef}
            variant="ghost"
            className="studio-search"
            aria-label="Find a tool"
            title="Find a tool (Ctrl K)"
            onClick={() => {
              searchReturnFocusRef.current = searchRef.current;
              setSearchOpen(true);
            }}
          >
            <Search />
            <span className="rail-mobile-label">Find a tool</span>
          </Button>
          <ThemeMenu />
          <Button
            ref={helpRef}
            variant="ghost"
            className="sidebar-help"
            aria-label="Getting started"
            title="Getting started"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp />
            <span className="rail-mobile-label">Getting started</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <CommandDialog
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreFocus(searchReturnFocusRef.current);
        }}
        className="top-1/2 max-h-[calc(100dvh-2rem)] -translate-y-1/2"
        showCloseButton
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a tool"
        description="Search and switch between your studio tools."
      >
        <Command>
          <CommandInput
            className="pr-9"
            placeholder="What would you like to do?"
          />
          <CommandList className="max-h-[min(18rem,calc(100dvh-6rem))]">
            <CommandEmpty>
              No tools found. Try “tutor” or “brochure”.
            </CommandEmpty>
            <CommandGroup heading="Workspace">
              {WORKSPACE_LINKS.map(
                ({ href, label, description, icon: Icon }) => (
                  <CommandItem
                    key={href}
                    value={`${label} ${description}`}
                    onSelect={() => {
                      searchReturnFocusRef.current = null;
                      setSearchOpen(false);
                      setOpenMobile(false);
                      router.push(href);
                    }}
                  >
                    <Icon />
                    <div>
                      <p>{label}</p>
                      <p className="text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto" />
                  </CommandItem>
                ),
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            restoreFocus(helpRef.current);
          }}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Your workspace, explained.</DialogTitle>
            <DialogDescription>
              Switch between the tools in your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="help-tools">
            {WORKSPACE_LINKS.map(({ href, label, description, icon: Icon }) => (
              <Button key={href} variant="ghost" asChild className="help-tool">
                <Link
                  href={href}
                  onClick={() => {
                    setHelpOpen(false);
                    setOpenMobile(false);
                  }}
                >
                  <Icon />
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <ArrowUpRight />
                </Link>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your tools connect to the configured AI services. If a model is
            unavailable, check that the service and Ollama are running, then
            refresh the model list.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WorkspaceHeader() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const tool = WORKSPACE_LINKS.find((item) => item.href === pathname);
  return (
    <header className="workspace-header">
      <div className="workspace-location">
        <SidebarTrigger
          className={`mobile-nav-trigger ${!open ? "rail-is-hidden" : ""}`}
        />
        <span className="header-wordmark">
          AI Studio<span>.</span>
        </span>
        <span className="header-slash">/</span>
        <h1>{tool?.label || "Workspace"}</h1>
      </div>
      <span className="header-caption">Personal workspace</span>
    </header>
  );
}
