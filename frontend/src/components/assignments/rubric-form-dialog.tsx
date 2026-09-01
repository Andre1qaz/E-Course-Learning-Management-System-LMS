"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const rubricLevelSchema = z.object({
  name: z.string().min(1, "Nama level harus diisi").max(200, "Nama level maksimal 200 karakter"),
  description: z.string().min(1, "Deskripsi harus diisi").max(500, "Deskripsi maksimal 500 karakter"),
  points: z.number().min(0, "Poin tidak boleh negatif"),
  order: z.number().min(0, "Order tidak boleh negatif"),
});

const rubricCriterionSchema = z.object({
  name: z.string().min(1, "Nama kriteria harus diisi").max(200, "Nama kriteria maksimal 200 karakter"),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
  maxPoints: z.number().min(0, "Poin maksimal tidak boleh negatif"),
  order: z.number().min(0, "Order tidak boleh negatif"),
  levels: z.array(rubricLevelSchema).min(1, "Minimal 1 level per kriteria"),
});

const rubricSchema = z.object({
  name: z.string().min(1, "Nama rubrik harus diisi").max(200, "Nama rubrik maksimal 200 karakter"),
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
  totalPoints: z.number().min(0, "Total poin tidak boleh negatif"),
  criteria: z.array(rubricCriterionSchema).min(1, "Minimal 1 kriteria"),
});

type RubricFormValues = z.infer<typeof rubricSchema>;

interface RubricFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentMaxScore: number;
  existingRubric?: any;
  onSuccess: () => void;
  token: string;
}

export function RubricFormDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentMaxScore,
  existingRubric,
  onSuccess,
  token,
}: RubricFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<RubricFormValues>({
    resolver: zodResolver(rubricSchema),
    defaultValues: {
      name: existingRubric?.name || "",
      description: existingRubric?.description || "",
      totalPoints: existingRubric?.totalPoints || assignmentMaxScore,
      criteria: existingRubric?.criteria?.map((c: any) => ({
        name: c.name,
        description: c.description || "",
        maxPoints: c.maxPoints,
        order: c.order,
        levels: c.levels?.map((l: any) => ({
          name: l.name,
          description: l.description,
          points: l.points,
          order: l.order,
        })) || [],
      })) || [
        {
          name: "",
          description: "",
          maxPoints: 0,
          order: 0,
          levels: [
            { name: "", description: "", points: 0, order: 0 },
          ],
        },
      ],
    },
  });

  const { fields: criteriaFields, append: appendCriterion, remove: removeCriterion } = useFieldArray({
    control: form.control,
    name: "criteria",
  });

  useEffect(() => {
    if (existingRubric) {
      form.reset({
        name: existingRubric.name,
        description: existingRubric.description || "",
        totalPoints: existingRubric.totalPoints,
        criteria: existingRubric.criteria?.map((c: any) => ({
          name: c.name,
          description: c.description || "",
          maxPoints: c.maxPoints,
          order: c.order,
          levels: c.levels?.map((l: any) => ({
            name: l.name,
            description: l.description,
            points: l.points,
            order: l.order,
          })) || [],
        })) || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        totalPoints: assignmentMaxScore,
        criteria: [
          {
            name: "",
            description: "",
            maxPoints: 0,
            order: 0,
            levels: [
              { name: "", description: "", points: 0, order: 0 },
            ],
          },
        ],
      });
    }
  }, [existingRubric, assignmentMaxScore, form]);

  const onSubmit = async (values: RubricFormValues) => {
    setLoading(true);
    try {
      const url = existingRubric
        ? `${process.env.NEXT_PUBLIC_API_URL}/rubrics/${existingRubric.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/rubrics/assignment/${assignmentId}`;

      const response = await fetch(url, {
        method: existingRubric ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(existingRubric ? "Rubrik berhasil diperbarui" : "Rubrik berhasil dibuat");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || "Gagal menyimpan rubrik");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan rubrik");
    } finally {
      setLoading(false);
    }
  };

  const addCriterion = () => {
    appendCriterion({
      name: "",
      description: "",
      maxPoints: 0,
      order: criteriaFields.length,
      levels: [
        { name: "", description: "", points: 0, order: 0 },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingRubric ? "Edit Rubrik" : "Buat Rubrik Baru"}</DialogTitle>
          <DialogDescription>
            {existingRubric ? "Perbarui rubrik penilaian untuk tugas ini" : "Buat rubrik penilaian terstruktur untuk tugas ini"}
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Rubrik</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Rubrik Penilaian Essay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Poin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={true}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Sesuai dengan nilai maksimal tugas ({assignmentMaxScore})</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Jelaskan bagaimana rubrik ini digunakan..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Kriteria Penilaian</h3>
                <Button type="button" size="sm" onClick={addCriterion}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kriteria
                </Button>
              </div>

              {criteriaFields.map((criterion, criterionIndex) => (
                <CriterionForm
                  key={criterion.id}
                  criterionIndex={criterionIndex}
                  form={form}
                  onRemove={() => removeCriterion(criterionIndex)}
                />
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : existingRubric ? "Perbarui" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CriterionForm({
  criterionIndex,
  form,
  onRemove,
}: {
  criterionIndex: number;
  form: any;
  onRemove: () => void;
}) {
  const { fields: levelFields, append: appendLevel, remove: removeLevel } = useFieldArray({
    control: form.control,
    name: `criteria.${criterionIndex}.levels`,
  });

  const addCriterionLevel = () => {
    appendLevel({
      name: "",
      description: "",
      points: 0,
      order: levelFields.length,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex-1 space-y-2">
          <FormField
            control={form.control}
            name={`criteria.${criterionIndex}.name`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Kriteria</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Struktur & Organisasi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`criteria.${criterionIndex}.maxPoints`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poin Maksimal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`criteria.${criterionIndex}.order`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urutan</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`criteria.${criterionIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi (Opsional)</FormLabel>
                <FormControl>
                  <Input placeholder="Penjelasan kriteria..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Level Penilaian</h4>
          <Button type="button" size="sm" variant="outline" onClick={addCriterionLevel}>
            <Plus className="mr-2 h-3 w-3" />
            Tambah Level
          </Button>
        </div>

        {levelFields.map((level, levelIndex) => (
          <div key={level.id} className="grid grid-cols-12 gap-3 items-start p-3 border rounded-xl">
            <div className="col-span-1 flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="col-span-3">
              <FormField
                control={form.control}
                name={`criteria.${criterionIndex}.levels.${levelIndex}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Nama Level</FormLabel>
                    <FormControl>
                      <Input placeholder="Sangat Baik" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2">
              <FormField
                control={form.control}
                name={`criteria.${criterionIndex}.levels.${levelIndex}.points`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Poin</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-5">
              <FormField
                control={form.control}
                name={`criteria.${criterionIndex}.levels.${levelIndex}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Deskripsi</FormLabel>
                    <FormControl>
                      <Input placeholder="Keterangan level..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLevel(levelIndex)}
                className="text-destructive hover:text-destructive mt-4"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
