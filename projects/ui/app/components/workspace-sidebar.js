"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Layers2,
  Monitor,
  Moon,
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
  SidebarGroupLabel,
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
  DropdownMenuItem,
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
import { Separator } from "@/components/ui/separator";

export const WORKSPACE_LINKS = [
  {
    href: "/ai-assistant",
    label: "Genie assistant",
    description: "A thinking partner for everyday work",
    icon: AudioLines,
  },
  {
    href: "/sales-brochure-generator",
    label: "Sales brochure",
    description: "Turn a website into a compelling story",
    icon: FileText,
  },
  {
    href: "/ai-tutor",
    label: "AI tutor",
    description: "Make complex ideas click",
    icon: BookOpen,
  },
  {
    href: "/multi-model-chat",
    label: "Model conversations",
    description: "Explore a topic from two perspectives",
    icon: Layers2,
  },
];

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="appearance-button">
          <Sun className="dark:hidden" />
          <Moon className="hidden dark:block" />
          <span>Appearance</span>
          <ChevronDown className="ml-auto size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {[
          { value: "light", label: "Light", icon: Sun },
          { value: "dark", label: "Dark", icon: Moon },
          { value: "system", label: "System", icon: Monitor },
        ].map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon />
            {label}
            <Check
              className={`ml-auto ${theme === value ? "opacity-100" : "opacity-0"}`}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef(null);
  const helpRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <Sidebar className="studio-sidebar" collapsible="offcanvas">
        <SidebarHeader className="studio-sidebar-header">
          <Link href="/" className="studio-brand" aria-label="AI Studio home">
            <span className="studio-logo">
              <BrandMark />
            </span>
            <span className="studio-wordmark">
              AI Studio<span className="studio-wordmark-dot">.</span>
            </span>
          </Link>
          <Button
            ref={searchRef}
            variant="outline"
            className="studio-search"
            onClick={() => setSearchOpen(true)}
          >
            <Search />
            <span>Find a tool…</span>
            <kbd>⌘ K</kbd>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main navigation">
            <SidebarGroup className="px-3">
              <SidebarGroupLabel className="nav-section-label">
                WORKSPACE
              </SidebarGroupLabel>
              <SidebarMenu className="gap-1.5">
                {WORKSPACE_LINKS.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === href}
                      className="studio-nav-link"
                    >
                      <Link
                        href={href}
                        aria-current={pathname === href ? "page" : undefined}
                        onClick={() => setOpenMobile(false)}
                      >
                        <Icon />
                        <span>{label}</span>
                        {pathname === href && (
                          <span className="nav-active-dot" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarFooter className="p-3 gap-1">
          <ThemeMenu />
          <Button
            ref={helpRef}
            variant="ghost"
            className="sidebar-help"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp />
            <span>Getting started</span>
            <ArrowUpRight className="ml-auto size-3.5" />
          </Button>
          <Separator className="my-3" />
          <div className="workspace-identity">
            <span className="workspace-avatar">
              <BrandMark />
            </span>
            <div>
              <strong>Personal workspace</strong>
              <span>Local workspace</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <CommandDialog
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.focus();
        }}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find a tool"
        description="Search and switch between your studio tools."
      >
        <Command>
          <CommandInput placeholder="What would you like to do?" />
          <CommandList>
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
            helpRef.current?.focus();
          }}
          className="sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Your workspace, explained.</DialogTitle>
            <DialogDescription>
              Four tools for creating, learning, and exploring ideas with AI.
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
  const tool = WORKSPACE_LINKS.find((item) => item.href === pathname);
  return (
    <header className="workspace-header">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-9" />
        <Separator orientation="vertical" className="!h-4" />
        <span className="breadcrumb-workspace">Workspace</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="header-current">{tool?.label || "AI Studio"}</span>
      </div>
      <span className="header-caption">
        AI Studio <span className="header-caption-divider">/</span> Personal
        workspace
      </span>
    </header>
  );
}
