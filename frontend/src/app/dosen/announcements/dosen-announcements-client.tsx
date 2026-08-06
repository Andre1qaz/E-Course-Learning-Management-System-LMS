"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DosenAnnouncementsClientProps {
  token: string;
}

export function DosenAnnouncementsClient({ token }: DosenAnnouncementsClientProps) {
  const { data: session } = useSession();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleSuccess = () => {
    // Refresh the announcements list
    window.location.reload();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Pengumuman</h1>
          <p className="text-muted-foreground">
            Kelola pengumuman untuk course yang Anda ampu
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" />
          Buat Pengumuman
        </Button>
      </div>

      <AnnouncementsList basePath="/dosen" />

      {showCreateDialog && (
        <CreateAnnouncementDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          token={token}
          userRole={session?.user?.role}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
