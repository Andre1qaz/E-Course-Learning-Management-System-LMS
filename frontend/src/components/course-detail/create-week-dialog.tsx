"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CreateWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  token: string;
  onSuccess: () => void;
}

export function CreateWeekDialog({
  open,
  onOpenChange,
  courseId,
  token,
  onSuccess,
}: CreateWeekDialogProps) {
  const [formData, setFormData] = useState({
    weekNumber: 1,
    title: "",
    startDate: "",
    endDate: "",
    order: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/weeks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Week created successfully");
        onOpenChange(false);
        onSuccess();
        setFormData({
          weekNumber: 1,
          title: "",
          startDate: "",
          endDate: "",
          order: 0,
        });
      } else {
        toast.error(result.message || "Failed to create week");
      }
    } catch (error) {
      toast.error("Error creating week");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Week Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="weekNumber">Nomor Week</Label>
            <Input
              id="weekNumber"
              type="number"
              min="1"
              max="16"
              value={formData.weekNumber}
              onChange={(e) =>
                setFormData({ ...formData, weekNumber: parseInt(e.target.value) })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Judul Week</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Pengenalan Dasar"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Tanggal Selesai</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) })
              }
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Menyimpan..." : "Buat Week"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
