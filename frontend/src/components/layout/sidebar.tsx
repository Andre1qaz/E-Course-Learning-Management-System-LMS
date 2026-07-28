"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  HardDrive,
  MessageSquare,
  Users,
  Settings,
  ClipboardList,
  ChevronLeft,
  GraduationCap,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Course", href: "/admin/courses", icon: BookOpen },
    { label: "Ujian", href: "/admin/exams", icon: ClipboardList },
    { label: "Pengguna", href: "/admin/users", icon: Users },
    { label: "Kalender", href: "/admin/calendar", icon: Calendar },
    { label: "File Pribadi", href: "/admin/storage", icon: HardDrive },
    { label: "Log Aktivitas", href: "/admin/logs", icon: FileText },
    { label: "Pengaturan", href: "/admin/settings", icon: Settings },
    { label: "Profil", href: "/admin/profile", icon: User },
  ],
  DOSEN: [
    { label: "Dashboard", href: "/dosen/dashboard", icon: LayoutDashboard },
    { label: "Course", href: "/dosen/courses", icon: BookOpen },
    { label: "Ujian", href: "/dosen/exams", icon: ClipboardList },
    { label: "Kalender", href: "/dosen/calendar", icon: Calendar },
    { label: "File Pribadi", href: "/dosen/storage", icon: HardDrive },
    { label: "Forum", href: "/dosen/forum", icon: MessageSquare },
    { label: "Profil", href: "/dosen/profile", icon: User },
  ],
  MAHASISWA: [
    { label: "Dashboard", href: "/mahasiswa/dashboard", icon: LayoutDashboard },
    { label: "Course", href: "/mahasiswa/courses", icon: BookOpen },
    { label: "Ujian", href: "/mahasiswa/exams", icon: ClipboardList },
    { label: "Kalender", href: "/mahasiswa/calendar", icon: Calendar },
    { label: "File Pribadi", href: "/mahasiswa/storage", icon: HardDrive },
    { label: "Forum", href: "/mahasiswa/forum", icon: MessageSquare },
    { label: "Profil", href: "/mahasiswa/profile", icon: User },
  ],
};

interface SidebarProps {
  role: string;
  collapsed: boolean;
  onToggle: () => void;
}

// Heuristic #6: Recognition Rather Than Recall — explicit navigation
export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const items = navByRole[role] ?? [];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[var(--sidebar-collapsed-width)]" : "w-[var(--sidebar-width)]",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-display text-sm font-bold leading-tight">E-Course</p>
            <p className="text-xs text-muted-foreground">LMS Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent/10 text-accent border-l-2 border-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onToggle}
          className="w-full"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
          {!collapsed && <span>Ciutkan</span>}
        </Button>
      </div>
    </aside>
  );
}
