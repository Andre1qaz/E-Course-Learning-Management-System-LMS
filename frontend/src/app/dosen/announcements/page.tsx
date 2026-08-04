"use client";

import { useSession } from "next-auth/react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DosenAnnouncementsPage() {
  const session = useSession();

  if (!session || !session.data) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Pengumuman</h1>
          <p className="text-muted-foreground">
            Kelola pengumuman untuk course yang Anda ampu
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Buat Pengumuman
        </Button>
      </div>

      <AnnouncementsList basePath="/dosen" />
    </div>
  );
}
