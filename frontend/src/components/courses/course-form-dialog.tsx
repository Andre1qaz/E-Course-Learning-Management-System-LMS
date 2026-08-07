"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, CheckCircle2, Copy } from "lucide-react";

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: any;
  onSuccess?: () => void;
}

interface Category {
  id: string;
  name: string;
}

// Heuristic #5: Error Prevention — form validation before submission
// Heuristic #9: Help Users Recognize, Diagnose, and Recover from Errors — clear error messages
// Heuristic #3: User Control and Freedom — cancel button available

// Default hex value used when creating a brand-new course
const DEFAULT_COLOR = "#3B82F6"; // Deep Navy / blue

export function CourseFormDialog({ open, onOpenChange, course, onSuccess }: CourseFormDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryLoading, setNewCategoryLoading] = useState(false);
  const [createdCourse, setCreatedCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: course?.name || "",
    code: course?.code || "",
    description: course?.description || "",
    learningObjectives: course?.learningObjectives || "",
    thumbnailColor: course?.thumbnailColor || DEFAULT_COLOR,
    categoryId: course?.categoryId || "",
  });

  // Fetch categories once the dialog is opened
  useEffect(() => {
    if (!open) return;

    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course-categories?isActive=true`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });
        const result = await response.json();

        // NestJS controller here returns the array directly (no {success, data} wrapper)
        if (Array.isArray(result)) {
          setCategories(result);
        } else if (result.success) {
          setCategories(result.data || []);
        } else {
          toast.error(result.message || "Gagal memuat kategori");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat memuat kategori");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [open, session?.accessToken]);

  // Keep form in sync when editing a different course / dialog reopens
  useEffect(() => {
    if (open) {
      setFormData({
        name: course?.name || "",
        code: course?.code || "",
        description: course?.description || "",
        learningObjectives: course?.learningObjectives || "",
        thumbnailColor: course?.thumbnailColor || DEFAULT_COLOR,
        categoryId: course?.categoryId || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Nama course wajib diisi");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Kode course wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const url = course
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses`;

      // Remove categoryId if empty to avoid UUID validation error
      const payload = {
        ...formData,
        categoryId: formData.categoryId || undefined,
      };

      const response = await fetch(url, {
        method: course ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        if (course) {
          toast.success("Course berhasil diperbarui");
          onOpenChange(false);
          onSuccess?.();
        } else {
          // Show enrollment code for new course
          setCreatedCourse(result.data);
          toast.success("Course berhasil dibuat");
          onSuccess?.();

          // Reset form
          setFormData({
            name: "",
            code: "",
            description: "",
            learningObjectives: "",
            thumbnailColor: DEFAULT_COLOR,
            categoryId: "",
          });
        }
      } else {
        toast.error(result.message || "Gagal menyimpan course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan course");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setNewCategoryLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          isActive: true,
        }),
      });

      const result = await response.json();

      if (result.success || result.id) {
        toast.success("Kategori berhasil dibuat");
        const newCategory = result.data || result;
        setCategories([...categories, newCategory]);
        setFormData({ ...formData, categoryId: newCategory.id });
        setNewCategoryName("");
        setCategoryDialogOpen(false);
      } else {
        toast.error(result.message || "Gagal membuat kategori");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat kategori");
    } finally {
      setNewCategoryLoading(false);
    }
  };

  // `value` = hex color sent to the backend
  // `class` = Tailwind class used only for rendering the swatch
  const colorOptions = [
    { value: "#3B82F6", label: "Deep Navy", class: "bg-semantic-blue" },
    { value: "#22C55E", label: "Forest Green", class: "bg-semantic-green" },
    { value: "#F97316", label: "Coral", class: "bg-semantic-orange" },
    { value: "#6366F1", label: "Steel Blue", class: "bg-semantic-indigo" },
    { value: "#EF4444", label: "Red", class: "bg-semantic-red" },
    { value: "#14B8A6", label: "Sky Blue", class: "bg-semantic-teal" },
  ];

  return (
    <>
    <Dialog open={open && !createdCourse} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>{course ? "Edit Course" : "Buat Course Baru"}</DialogTitle>
          <DialogDescription id="dialog-description">
            {course ? "Edit informasi course yang ada" : "Buat course baru dan tambahkan ke sistem"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Course *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Pemrograman Web"
                disabled={loading}
                aria-required="true"
                aria-describedby="name-error"
              />
              <span id="name-error" className="sr-only" role="alert"></span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Kode Course *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Contoh: IF101"
                disabled={loading}
                maxLength={20}
                aria-required="true"
                aria-describedby="code-error"
              />
              <span id="code-error" className="sr-only" role="alert"></span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="categoryId">Kategori *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCategoryDialogOpen(true)}
                disabled={loading}
                className="h-6 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Kategori Baru
              </Button>
            </div>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              disabled={loading || categoriesLoading}
              aria-required="true"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                {categoriesLoading ? "Memuat kategori..." : "Pilih kategori"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {!categoriesLoading && categories.length === 0 && (
              <p className="text-xs text-destructive">
                Belum ada kategori. Klik "Kategori Baru" untuk membuat kategori terlebih dahulu.
              </p>
            )}
            {categoriesLoading && (
              <p className="text-xs text-muted-foreground">Memuat kategori...</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang course..."
              disabled={loading}
              rows={3}
              aria-describedby="description-hint"
            />
            <p id="description-hint" className="text-xs text-muted-foreground">
              Opsional: Berikan deskripsi singkat tentang course
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="learningObjectives">Tujuan Pembelajaran</Label>
            <Textarea
              id="learningObjectives"
              value={formData.learningObjectives}
              onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })}
              placeholder="1. Memahami konsep dasar&#10;2. Mampu menerapkan..."
              disabled={loading}
              rows={4}
              aria-describedby="learningObjectives-hint"
            />
            <p id="learningObjectives-hint" className="text-xs text-muted-foreground">
              {/* Heuristic #12: Clarity of Purpose and Objectives */}
              Tuliskan tujuan pembelajaran secara terstruktur (gunakan angka untuk poin)
            </p>
          </div>

          <div className="space-y-2">
            <Label id="color-label">Warna Thumbnail</Label>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-labelledby="color-label">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, thumbnailColor: option.value })}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    formData.thumbnailColor === option.value
                      ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                  aria-label={`Pilih warna ${option.label}`}
                  aria-pressed={formData.thumbnailColor === option.value}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Warna yang dipilih: {colorOptions.find(opt => opt.value === formData.thumbnailColor)?.label || 'Default'}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {/* Heuristic #3: User Control and Freedom */}
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : course ? "Simpan Perubahan" : "Buat Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Dialog untuk membuat kategori baru */}
    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Kategori Baru</DialogTitle>
          <DialogDescription>
            Tambahkan kategori baru untuk course
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateCategory} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newCategoryName">Nama Kategori *</Label>
            <Input
              id="newCategoryName"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Contoh: Teknologi Informasi"
              disabled={newCategoryLoading}
              maxLength={100}
              aria-required="true"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
              disabled={newCategoryLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={newCategoryLoading}>
              {newCategoryLoading ? "Menyimpan..." : "Buat Kategori"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Enrollment Code Success Dialog */}
    {createdCourse && (
      <Dialog open={!!createdCourse} onOpenChange={() => { setCreatedCourse(null); onOpenChange(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="font-display text-2xl">Course Berhasil Dibuat!</DialogTitle>
            <DialogDescription>
              Berikut adalah kode enrollment untuk course ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-6 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Kode Enrollment</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-mono font-bold tracking-wider">{createdCourse?.enrollmentCode}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (createdCourse?.enrollmentCode) {
                      navigator.clipboard.writeText(createdCourse.enrollmentCode);
                      toast.success("Kode enrollment berhasil disalin!");
                    }
                  }}
                  className="h-8 w-8"
                  title="Salin kode"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Bagikan kode ini kepada mahasiswa untuk mengakses course
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => { setCreatedCourse(null); onOpenChange(false); }}>
                Tutup
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}