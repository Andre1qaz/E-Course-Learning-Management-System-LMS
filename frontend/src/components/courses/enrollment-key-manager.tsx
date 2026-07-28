"use client";

import { useState } from "react";
import { Key, RefreshCw, Copy, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateEnrollmentKey } from "@/lib/api";

interface EnrollmentKeyManagerProps {
  token: string;
  courseId: string;
  currentCode: string;
  currentEnabled: boolean;
  onUpdate?: (newCode: string, newEnabled: boolean) => void;
}

// Heuristic #1: Visibility of System Status — show enrollment key status clearly
// Heuristic #5: Error Prevention — confirm before regenerating key
export function EnrollmentKeyManager({
  token,
  courseId,
  currentCode,
  currentEnabled,
  onUpdate,
}: EnrollmentKeyManagerProps) {
  const [enrollmentCode, setEnrollmentCode] = useState(currentCode);
  const [enrollmentEnabled, setEnrollmentEnabled] = useState(currentEnabled);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateNewCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEnrollmentCode(code);
    setIsEditing(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(enrollmentCode);
      setCopied(true);
      toast.success("Kode enrollment disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Gagal menyalin kode");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateEnrollmentKey(token, courseId, {
        enrollmentCode,
        enrollmentEnabled,
      });
      toast.success("Kode enrollment berhasil diperbarui");
      setIsEditing(false);
      onUpdate?.(enrollmentCode, enrollmentEnabled);
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui kode enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await updateEnrollmentKey(token, courseId, {
        enrollmentEnabled: checked,
      });
      setEnrollmentEnabled(checked);
      toast.success(checked ? "Enrollment diaktifkan" : "Enrollment dinonaktifkan");
      onUpdate?.(enrollmentCode, checked);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah status enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEnrollmentCode(currentCode);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Kode Enrollment
        </CardTitle>
        <CardDescription>
          Kelola kode enrollment untuk memungkinkan mahasiswa bergabung ke course
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground mb-1 block">Status Enrollment</Label>
            <div className="flex items-center gap-2">
              {enrollmentEnabled ? (
                <ToggleRight className="h-5 w-5 text-success" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {enrollmentEnabled ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
          <Switch
            checked={enrollmentEnabled}
            onCheckedChange={handleToggleEnabled}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label>Kode Enrollment</Label>
          <div className="flex gap-2">
            <Input
              value={enrollmentCode}
              onChange={(e) => setEnrollmentCode(e.target.value.toUpperCase())}
              disabled={!isEditing}
              className="font-mono text-lg tracking-wider"
              placeholder="XXXXXX"
              maxLength={10}
            />
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Salin kode"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={generateNewCode}
                  title="Generate kode baru"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isEditing
              ? "Edit kode enrollment lalu klik Simpan"
              : "Bagikan kode ini kepada mahasiswa untuk bergabung ke course"}
          </p>
        </div>

        {isEditing && (
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        )}

        {!enrollmentEnabled && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground">
              Enrollment dinonaktifkan. Mahasiswa tidak dapat bergabung menggunakan kode enrollment.
              Gunakan fitur "Tambah Peserta" untuk mendaftarkan mahasiswa secara langsung.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
