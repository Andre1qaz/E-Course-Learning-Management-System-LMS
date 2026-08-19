"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  User,
  ClipboardList,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/utils";
// import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopNavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
    id?: string;
    accessToken?: string;
  };
  onMenuClick?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNavbar({ user, onMenuClick, breadcrumbs }: TopNavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[aria-haspopup="true"]') && !target.closest('[role="menu"]')) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header
      className="sticky top-0 z-hierarchy-navbar border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      role="banner"
      onKeyDown={handleKeyDown}
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Buka menu"
          >
            <Menu className="icon-lg" />
          </Button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground">/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${user.role.toLowerCase()}/exams`}>
            <Button variant="ghost" size="sm" className="gap-2" aria-label="Ke halaman ujian">
              <ClipboardList className="icon-md" aria-hidden="true" />
              <span className="hidden sm:inline">Ujian</span>
            </Button>
          </Link>

          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              aria-label="Menu pengguna"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <ChevronDown className="icon-md text-muted-foreground hidden sm:block" aria-hidden="true" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg z-hierarchy-dropdown"
                role="menu"
                aria-label="Menu pengguna"
              >
                <Link
                  href={`/${user.role.toLowerCase()}/profile`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  role="menuitem"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="icon-md" aria-hidden="true" />
                  Profil
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                  role="menuitem"
                >
                  <LogOut className="icon-md" aria-hidden="true" />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
