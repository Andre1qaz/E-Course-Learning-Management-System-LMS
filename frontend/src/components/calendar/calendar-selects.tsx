"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { EVENT_CATEGORIES } from "@/lib/calendar-constants";

interface CategoryNativeSelectProps {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
  id?: string;
  className?: string;
}

export function CategoryNativeSelect({
  value,
  onChange,
  includeAll = false,
  id,
  className,
}: CategoryNativeSelectProps) {
  return (
    <NativeSelect
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {includeAll && <option value="ALL">Semua Kategori</option>}
      {EVENT_CATEGORIES.map((cat) => (
        <option key={cat.value} value={cat.value}>
          {cat.label}
        </option>
      ))}
    </NativeSelect>
  );
}

interface CourseNativeSelectProps {
  value: string;
  onChange: (value: string) => void;
  courses: { id: string; name: string; code: string }[];
  id?: string;
  className?: string;
}

export function CourseNativeSelect({
  value,
  onChange,
  courses,
  id,
  className,
}: CourseNativeSelectProps) {
  return (
    <NativeSelect
      id={id}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Pilih Course</option>
      {courses.map((course) => (
        <option key={course.id} value={course.id}>
          {course.code} - {course.name}
        </option>
      ))}
    </NativeSelect>
  );
}
