"use client";

import { useState, useEffect, useRef } from "react";
import { PrivateFile, QuotaInfo, getPrivateFiles, getPrivateFilesQuota, uploadPrivateFile, deletePrivateFile, createPrivateFolder, getPrivateFileDownloadUrl, renamePrivateFile } from "@/lib/api";
import { HardDrive, Upload, Folder, File, Trash2, Download, Edit2, FolderPlus, ArrowLeft, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — clear file operation feedback
// Heuristic #13: Storage Capability — visual quota progress bar with clear indicators
// Heuristic #5: Error Prevention — validate file operations before execution

interface FileManagerProps {
  token: string;
  userId: string;
}

function inferMimeType(file: File): string {
  if (file.type) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const byExtension: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    zip: "application/zip",
    txt: "text/plain",
  };
  return byExtension[ext] || "application/octet-stream";
}

function isFolderFile(file: PrivateFile) {
  return file.mimeType === "application/x-folder" || file.fileName === ".folder";
}

export function FileManager({ token, userId }: FileManagerProps) {
  const [files, setFiles] = useState<PrivateFile[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({ used: 0, limit: 52428800 });
  const [currentPath, setCurrentPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PrivateFile | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const [filesData, quotaData] = await Promise.all([
        getPrivateFiles(token, currentPath),
        getPrivateFilesQuota(token),
      ]);
      setFiles(filesData.data?.files || []);
      setQuota(quotaData.data || { used: 0, limit: 52428800 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memuat file");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token, currentPath]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getQuotaPercentage = () => {
    return (quota.used / quota.limit) * 100;
  };

  const getQuotaColor = () => {
    const percentage = getQuotaPercentage();
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-accent";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileType = inferMimeType(file);

      const uploadData = await uploadPrivateFile(token, {
        fileName: file.name,
        fileType,
        fileSize: file.size,
        folderPath: currentPath,
      });

      if (!uploadData.data?.uploadUrl) {
        throw new Error("Gagal mendapatkan URL upload dari server");
      }

      const contentType = uploadData.data.file?.mimeType || fileType;
      const uploadResponse = await fetch(uploadData.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": contentType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Gagal upload file ke storage (status: ${uploadResponse.status})`);
      }

      toast.success("File berhasil diupload");
      setIsUploadDialogOpen(false);
      await fetchFiles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gagal upload file";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (file: PrivateFile) => {
    const folder = isFolderFile(file);
    if (
      !confirm(
        folder
          ? "Hapus folder ini beserta seluruh isinya?"
          : "Apakah Anda yakin ingin menghapus file ini?",
      )
    ) {
      return;
    }

    try {
      await deletePrivateFile(token, file.id);
      toast.success(folder ? "Folder berhasil dihapus" : "File berhasil dihapus");
      await fetchFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus file");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const folderName = formData.get("folderName") as string;

    if (!folderName) {
      toast.error("Nama folder wajib diisi");
      return;
    }

    try {
      const folderPath = currentPath === "/" ? `/${folderName}` : `${currentPath}/${folderName}`;
      await createPrivateFolder(token, folderPath);
      toast.success("Folder berhasil dibuat");
      setIsFolderDialogOpen(false);
      await fetchFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat folder");
    }
  };

  const handleDownload = async (file: PrivateFile) => {
    try {
      const downloadData = await getPrivateFileDownloadUrl(token, file.id);
      if (!downloadData.data) {
        toast.error("Gagal mendapatkan URL download");
        return;
      }
      const link = document.createElement("a");
      link.href = downloadData.data.downloadUrl;
      link.download = downloadData.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mendownload file");
    }
  };

  const handleRename = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData(e.currentTarget);
    const newFileName = formData.get("newFileName") as string;

    if (!newFileName) {
      toast.error("Nama file wajib diisi");
      return;
    }

    try {
      await renamePrivateFile(token, selectedFile.id, newFileName);
      toast.success("File berhasil diubah namanya");
      setIsRenameDialogOpen(false);
      setSelectedFile(null);
      await fetchFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah nama file");
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length > 0 ? `/${parts.join("/")}` : "/");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const quotaPercentage = getQuotaPercentage();
  const remainingSpace = quota.limit - quota.used;

  return (
    <div className="space-y-6">
      {/* Quota Display - Heuristic #13: Storage Capability */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <HardDrive className="h-5 w-5 text-accent" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Kuota Penyimpanan</span>
              <span className="text-sm text-muted-foreground">
                {formatFileSize(quota.used)} / {formatFileSize(quota.limit)}
              </span>
            </div>
            <Progress value={quotaPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{quotaPercentage.toFixed(1)}% digunakan</span>
              <span className={remainingSpace < 10485760 ? "text-destructive font-medium" : ""}>
                {remainingSpace < 10485760 && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                Tersisa: {formatFileSize(remainingSpace)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* File Manager Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={navigateUp} disabled={currentPath === "/"}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold">File Pribadi</h2>
            <p className="text-sm text-muted-foreground">{currentPath === "/" ? "Root" : currentPath}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                Buat Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Folder Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <Label htmlFor="folderName">Nama Folder</Label>
                  <Input id="folderName" name="folderName" required placeholder="Masukkan nama folder" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Buat Folder</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {uploading ? "Mengupload..." : "Klik untuk memilih file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Maksimal {formatFileSize(remainingSpace)}
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                    Tutup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Files List */}
      <Card className="p-6">
        {files.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Folder Kosong</h3>
            <p className="text-muted-foreground mb-4">
              Belum ada file di folder ini
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const folder = isFolderFile(file);
              return (
              <Card
                key={file.id}
                className={cn(
                  "p-4 hover:border-accent/50 transition-colors group",
                  folder && "cursor-pointer",
                )}
                onClick={() => {
                  if (folder) {
                    navigateToPath(file.folderPath);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {folder ? (
                      <Folder className="h-8 w-8 text-amber-500" />
                    ) : (
                      <File className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder ? "Folder" : formatFileSize(Number(file.fileSize))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {!folder && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedFile(file);
                            setIsRenameDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nama File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <Label htmlFor="newFileName">Nama Baru</Label>
              <Input
                id="newFileName"
                name="newFileName"
                required
                defaultValue={selectedFile?.fileName}
                placeholder="Masukkan nama baru"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
