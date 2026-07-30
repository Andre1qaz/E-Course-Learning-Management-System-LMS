"use client";

import { useSession } from "next-auth/react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";

export default function AnnouncementsPage() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Pengumuman</h1>
        <p className="text-muted-foreground">
          Lihat semua pengumuman terbaru dari sistem dan course Anda
        </p>
      </div>
      
      <AnnouncementsList basePath="/mahasiswa" />
    </div>
  );
}
