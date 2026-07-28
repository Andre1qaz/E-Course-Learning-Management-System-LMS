"use client";

import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-warning/10 text-warning mb-6">
        <AlertTriangle className="size-10" />
      </div>
      <h1 className="font-display text-4xl font-bold">500</h1>
      <h2 className="mt-2 text-xl font-semibold">Terjadi Kesalahan</h2>
      <p className="mt-3 max-w-md text-muted-foreground">
        Maaf, terjadi kesalahan pada server. Tim kami sudah diberitahu.
        Silakan coba lagi dalam beberapa saat.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={reset}>
          Coba Lagi
        </Button>
        <Button asChild className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
