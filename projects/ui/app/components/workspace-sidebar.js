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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
            <span className="rail-mobile-label">AI Studio</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main navigation">
            <SidebarGroup className="rail-group">
              <SidebarMenu>
                {WORKSPACE_LINKS.map(({ href, label, icon: Icon }, index) => (
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
                            <span className="rail-short-label">
                              {
                                ["Assistant", "Create", "Learn", "Discuss"][
                                  index
                                ]
                              }
                            </span>
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
            onClick={() => setSearchOpen(true)}
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
