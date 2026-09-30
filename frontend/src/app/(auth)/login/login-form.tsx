"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Code2,
  GraduationCap,
  Loader2,
  MessageCircleQuestion,
  Palette,
  Play,
  Star,
} from "lucide-react";
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

const stats = [
  {
    icon: Star,
    value: "4.9/5",
    label: "Kepuasan Pengguna",
  },
  {
    icon: GraduationCap,
    value: "10.000+",
    label: "Alumni Berhasil",
  },
  {
    icon: BookOpen,
    value: "500+",
    label: "Kursus Tersedia",
  },
];

const partners = ["IT Del", "Kemendikbud", "Dicoding", "Google Edu"];

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
      {/* ── Kiri: branding + social proof + mockup melayang ── */}
      <div className="hidden lg:flex lg:w-[54%] flex-col justify-between gap-8 bg-primary p-10 text-primary-foreground relative overflow-hidden xl:p-12">
        {/* Latar watermark bergerak halus (loop) */}
        <div
          className="animate-drift-slow absolute -inset-[6%] bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/login-watermark.jpg)" }}
          aria-hidden="true"
        />
        {/* Blob dekoratif melayang */}
        <div
          className="animate-blob-float absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="animate-blob-float absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div
          className="animate-fade-in-up relative z-10 flex items-center gap-3"
          style={{ animationDelay: "0.05s" }}
        >
          <img
            src="/del-logo.png"
            alt="IT Del Logo"
            className="h-12 w-auto object-contain drop-shadow"
          />
          <span className="font-display text-xl font-bold">E-Course</span>
        </div>

        {/* Headline + mockup */}
        <div className="relative z-10">
          <h1
            className="animate-fade-in-up font-display text-4xl font-bold leading-tight xl:text-[2.75rem]"
            style={{ animationDelay: "0.15s" }}
          >
            Platform Pembelajaran
            <br />
            <span className="text-accent">Modern & Terstruktur</span>
          </h1>
          <p
            className="animate-fade-in-up mt-4 max-w-md text-primary-foreground/80"
            style={{ animationDelay: "0.25s" }}
          >
            Akses course, tugas, ujian, dan materi pembelajaran dalam satu
            platform yang dirancang khusus untuk kebutuhan akademik.
          </p>

          {/* Mockup kursus melayang */}
          <div
            className="animate-fade-in-up relative mt-8 h-[228px] max-w-[520px] select-none"
            style={{ animationDelay: "0.35s" }}
            aria-hidden="true"
          >
            {/* Tablet utama — Coding */}
            <div className="animate-float-slow absolute left-0 top-0 w-72 -rotate-2 rounded-2xl border border-white/40 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Code2 className="h-4.5 w-4.5" size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">Coding Dasar</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    12 modul • 8 jam
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  78%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {["AK", "BR", "CL"].map((n) => (
                    <span
                      key={n}
                      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-secondary text-[9px] font-bold text-secondary-foreground"
                    >
                      {n}
                    </span>
                  ))}
                </div>
                <span className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                  Lanjutkan
                </span>
              </div>
            </div>

            {/* Kartu kedua — UI/UX */}
            <div
              className="animate-float-slow absolute left-60 top-12 w-60 rotate-3 rounded-2xl border border-white/40 bg-white/95 p-4 text-slate-900 shadow-2xl backdrop-blur"
              style={{ animationDelay: "-3s" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Palette size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">UI/UX Design</p>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="ml-1 text-[10px] font-semibold text-slate-500">
                      4.9
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-2 text-[11px] font-medium text-slate-600">
                <CheckCircle2 size={14} className="text-emerald-600" />
                12 modul selesai hari ini
              </div>
            </div>

            {/* Badge sertifikat */}
            <div
              className="animate-float-slow absolute left-40 -bottom-1 flex items-center gap-2 rounded-full border border-white/40 bg-white/95 py-1.5 pl-1.5 pr-4 text-slate-900 shadow-xl backdrop-blur"
              style={{ animationDelay: "-1.5s" }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950">
                <Award size={15} />
              </span>
              <span className="text-xs font-bold">Sertifikat Siap Diunduh</span>
            </div>
          </div>

          {/* Statistik keberhasilan */}
          <div
            className="animate-fade-in-up mt-8 grid max-w-[520px] grid-cols-3 gap-3"
            style={{ animationDelay: "0.45s" }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur transition-colors duration-200 hover:bg-white/15"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/25 text-accent">
                  <s.icon size={16} />
                </span>
                <p className="mt-2 font-display text-lg font-bold leading-none">
                  {s.value}
                </p>
                <p className="mt-1 text-[11px] leading-tight text-primary-foreground/70">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust logos + copyright */}
        <div
          className="animate-fade-in-up relative z-10"
          style={{ animationDelay: "0.55s" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
            Dipercaya oleh
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {partners.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-primary-foreground/90"
              >
                <Building2 size={13} className="text-accent" />
                {p}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-primary-foreground/60">
            © 2025 E-Course LMS — Heuristic-Driven Design
          </p>
        </div>
      </div>

      {/* ── Kanan: form login ── */}
      <div className="flex flex-1 items-center justify-center p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url(/login-white-watermark.jpg)" }}
          aria-hidden="true"
        />
        <Card
          className="animate-fade-in-up w-full max-w-md relative z-10 rounded-[1.75rem] border border-border/60 shadow-[0_24px_60px_-12px_rgba(26,54,93,0.25)]"
          style={{ animationDelay: "0.2s" }}
        >
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
                  className="h-11 rounded-xl transition-shadow duration-200 focus-visible:ring-accent"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-accent hover:underline"
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
                  className="h-11 rounded-xl transition-shadow duration-200 focus-visible:ring-accent"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="accent"
                className="h-11 w-full rounded-xl text-[15px] font-semibold"
                disabled={loading}
              >
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
                <Link href="/register" className="font-semibold text-accent hover:underline">
                  Daftar sekarang
                </Link>
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-dashed"
                asChild
              >
                <Link href="/register?demo=true">
                  <Play size={15} className="text-accent" />
                  Coba Demo Kursus
                </Link>
              </Button>

              {/* Trust logos mini */}
              <div className="mt-1 w-full border-t border-border/70 pt-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Dipercaya oleh
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {partners.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                    >
                      <Building2 size={11} className="text-accent" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Bantuan / Help Center */}
        <a
          href="mailto:support@ecourse.ac.id?subject=Bantuan%20Login%20E-Course"
          aria-label="Butuh bantuan? Hubungi help center"
          title="Butuh bantuan? Hubungi kami"
          className="group fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-6px_rgba(26,54,93,0.5)] transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95"
        >
          <MessageCircleQuestion size={22} />
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
            Butuh bantuan?
          </span>
        </a>
      </div>
    </div>
  );
}
