"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  BookOpen,
  Trophy,
  Briefcase,
  Terminal,
  MessageSquare
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Platform Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tutor"))}>
              <Terminal className="mr-2 h-4 w-4" />
              <span>AI Coding Tutor</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/problems"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Practice Problems</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/jobs"))}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>Placement Board</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/roadmap"))}>
              <Trophy className="mr-2 h-4 w-4" />
              <span>Generate Roadmap</span>
              <CommandShortcut>⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/assistant"))}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>AI Assistant</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/pricing"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Manage Subscription</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function LayoutDashboard({ className, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <rect width="7" height="9" x="3" y="3" rx="1" />
            <rect width="7" height="5" x="14" y="3" rx="1" />
            <rect width="7" height="9" x="14" y="12" rx="1" />
            <rect width="7" height="5" x="3" y="15" rx="1" />
        </svg>
    )
}
