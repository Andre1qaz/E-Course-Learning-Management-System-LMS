 "use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Camera, Lock, Upload, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  storageQuotaUsed: string;
  storageQuotaLimit: string;
  createdAt: string;
}

function toAbsoluteMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `http://${url}`;
}

export function ProfilePage() {
  const { data: session, status, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Password change states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.accessToken) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [status, session?.accessToken]);

  const fetchProfile = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      const response = await apiFetch<UserProfile>(
        "/auth/profile",
        {},
        session.accessToken,
      );

      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        toast.error(response.message || "Gagal memuat profil");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat profil",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const normalizedType = file.type === "image/jpg" ? "image/jpeg" : file.type;
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(normalizedType)) {
      toast.error("Format file harus JPG, JPEG, atau PNG");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileType =
        selectedFile.type === "image/jpg" ? "image/jpeg" : selectedFile.type;

      // Step 1: Get presigned upload URL
      const uploadUrlResponse = await apiFetch<{ uploadUrl: string; fileUrl: string }>(
        "/storage/upload-url",
        {
          method: "POST",
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType,
            fileSize: selectedFile.size,
            isPrivate: false,
          }),
        },
        session?.accessToken
      );

      if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
        throw new Error(uploadUrlResponse.message || "Gagal mendapatkan URL upload");
      }

      const { uploadUrl, fileUrl } = uploadUrlResponse.data;
      const publicFileUrl = fileUrl.startsWith("http")
        ? fileUrl
        : `http://${fileUrl}`;

      // Step 2: Upload file to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": fileType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Gagal mengunggah file ke penyimpanan. Coba lagi.");
      }

      // Step 3: Update user profile with new avatar URL
      const updateResponse = await apiFetch<{ avatarUrl: string }>(
        "/auth/profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            avatarUrl: publicFileUrl,
          }),
        },
        session?.accessToken
      );

      if (!updateResponse.success) {
        throw new Error(updateResponse.message);
      }

      const savedAvatarUrl =
        (updateResponse.data as { avatarUrl?: string } | null)?.avatarUrl ||
        publicFileUrl;

      await update({
        ...session,
        user: {
          ...session?.user,
          avatarUrl: savedAvatarUrl,
        },
      });

      setProfile((prev) =>
        prev ? { ...prev, avatarUrl: `${savedAvatarUrl}?t=${Date.now()}` } : prev,
      );
      toast.success("Foto profil berhasil diperbarui");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunggah foto",
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak sama");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    // Password validation: minimal 8 karakter dan kombinasi huruf dan angka
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(passwordData.newPassword)) {
      toast.error("Password harus mengandung kombinasi huruf dan angka");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiFetch<null>(
        "/auth/change-password",
        {
          method: "PATCH",
          body: JSON.stringify(passwordData),
        },
        session?.accessToken
      );

      if (!response.success) {
        throw new Error(response.message);
      }

      toast.success("Password berhasil diperbarui");
      setPasswordDialogOpen(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "DOSEN":
        return "Dosen";
      case "MAHASISWA":
        return "Mahasiswa";
      default:
        return role;
    }
  };

  const getStorageUsedPercentage = () => {
    if (!profile) return 0;
    const used = parseInt(profile.storageQuotaUsed);
    const limit = parseInt(profile.storageQuotaLimit);
    return (used / limit) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Memuat profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Profil tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground mt-2">
          Kelola informasi akun dan pengaturan keamanan Anda
        </p>
      </div>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>
            Informasi dasar akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={toAbsoluteMediaUrl(profile.avatarUrl)} alt={profile.name} />
                <AvatarFallback className="text-3xl font-display bg-primary text-primary-foreground">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Ubah Foto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ubah Foto Profil</DialogTitle>
                    <DialogDescription>
                      Unggah foto profil baru Anda. Format yang didukung: JPG, JPEG, PNG. Maksimal 5MB.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {previewUrl ? (
                      <div className="relative mx-auto w-32 h-32">
                        <Avatar className="h-32 w-32">
                          <AvatarImage src={previewUrl} alt="Preview" />
                          <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-input rounded-lg p-8 text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-4">
                          Pilih file dari perangkat Anda
                        </p>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleFileSelect}
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadDialogOpen(false);
                        setSelectedFile(null);
                        setPreviewUrl("");
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handlePhotoUpload}
                      disabled={!selectedFile || uploading}
                    >
                      {uploading ? "Mengunggah..." : "Simpan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Information Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{profile.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="font-medium">{profile.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="font-medium">{getRoleLabel(profile.role)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ID Pengguna</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <span className="font-medium font-mono text-sm">{profile.id}</span>
                  </div>
                </div>
              </div>

              {/* Storage Quota */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <Label>Penyimpanan</Label>
                  <span className="text-muted-foreground">
                    {(parseInt(profile.storageQuotaUsed) / 1024 / 1024).toFixed(2)} MB /{" "}
                    {(parseInt(profile.storageQuotaLimit) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${getStorageUsedPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
          <CardDescription>
            Kelola password dan keamanan akun Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Lock className="h-4 w-4 mr-2" />
                Ubah Password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Password</DialogTitle>
                <DialogDescription>
                  Masukkan password lama dan password baru Anda. Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Password Lama</Label>
                  <Input
                    id="old-password"
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, oldPassword: e.target.value })
                    }
                    placeholder="Masukkan password lama"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password Baru</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Masukkan password baru"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Konfirmasi password baru"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPasswordDialogOpen(false);
                    setPasswordData({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Batal
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {changingPassword ? "Mengubah..." : "Simpan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
