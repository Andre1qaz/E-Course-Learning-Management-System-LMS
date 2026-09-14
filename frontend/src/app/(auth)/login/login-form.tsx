"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email atau password salah. Periksa kembali kredensial Anda.");
        return;
      }

      toast.success("Login berhasil! Mengalihkan ke dashboard...");

      const dashboardMap: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        DOSEN: "/dosen/dashboard",
        MAHASISWA: "/mahasiswa/dashboard",
      };

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/"); // Will redirect via middleware to appropriate dashboard
      }
    } catch {
      toast.error("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/login-watermark.jpg)' }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <img 
            src="/del-logo.png" 
            alt="IT Del Logo" 
            className="h-12 w-auto object-contain"
          />
          <span className="font-display text-xl font-bold">E-Course</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Platform Pembelajaran
            <br />
            <span className="text-accent">Modern & Terstruktur</span>
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Akses course, tugas, ujian, dan materi pembelajaran dalam satu platform
            yang dirancang khusus untuk kebutuhan akademik.
          </p>
        </div>
        <p className="relative z-10 text-sm text-primary-foreground/60">
          © 2025 E-Course LMS — Heuristic-Driven Design
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/login-white-watermark.jpg)' }}
        />
        <Card className="w-full max-w-md border-0 shadow-lg lg:border relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex items-center justify-center gap-2 lg:hidden">
              <img 
                src="/del-logo.png" 
                alt="IT Del Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <CardTitle className="font-display text-2xl">Masuk ke E-Course</CardTitle>
            <CardDescription>
              Gunakan email institusi Anda untuk masuk
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@ecourse.ac.id"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-accent hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/register" className="font-medium text-accent hover:underline">
                  Daftar sekarang
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
