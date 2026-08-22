import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    DOSEN: "Dosen",
    MAHASISWA: "Mahasiswa",
  };
  return labels[role] ?? role;
}

export function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DOSEN":
      return "/dosen/dashboard";
    case "MAHASISWA":
      return "/mahasiswa/dashboard";
    default:
      return "/login";
  }
}

export function isCssColor(value?: string | null): boolean {
  if (!value) return false;
  const v = value.trim();
  return (
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(v) ||
    v.startsWith("rgb") ||
    v.startsWith("hsl")
  );
}

export function getBackgroundFillProps(
  value?: string | null,
  fallbackClass = "bg-primary",
): { className: string; style?: { backgroundColor: string } } {
  if (isCssColor(value)) {
    return { className: "", style: { backgroundColor: value!.trim() } };
  }
  if (value && !value.startsWith("#")) {
    return { className: value };
  }
  return { className: fallbackClass };
}

export function getEventColorStyle(color?: string | null): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} | undefined {
  if (!isCssColor(color)) return undefined;
  const hex = color!.trim();
  return {
    backgroundColor: hex,
    color: "#ffffff",
    borderColor: hex,
  };
}
