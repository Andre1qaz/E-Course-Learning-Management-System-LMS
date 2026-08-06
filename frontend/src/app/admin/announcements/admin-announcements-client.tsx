"use client";

import { useState } from "react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AdminAnnouncementsClientProps {
  token: string;
}

export function AdminAnnouncementsClient({ token }: AdminAnnouncementsClientProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Pengumuman Global</h1>
          <p className="text-muted-foreground">
            Kelola pengumuman sistem untuk seluruh pengguna platform
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Buat Pengumuman
        </Button>
      </div>

      <AnnouncementsList basePath="/admin" />

      {showCreateDialog && (
        <CreateAnnouncementDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          token={token}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
