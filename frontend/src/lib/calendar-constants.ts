import { EventCategory } from "@/lib/api";

export const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "PERKULIAHAN", label: "Perkuliahan", color: "#1a365d" },
  { value: "MATERI_BARU", label: "Materi Baru", color: "#2d6a4f" },
  { value: "ASSIGNMENT", label: "Assignment", color: "#f4a261" },
  { value: "QUIZ", label: "Quiz", color: "#e07a5f" },
  { value: "UTS", label: "UTS", color: "#e07a5f" },
  { value: "UAS", label: "UAS", color: "#c1121f" },
  { value: "SEMINAR", label: "Seminar", color: "#457b9d" },
  { value: "PROJECT", label: "Project", color: "#1d3557" },
  { value: "MEETING", label: "Meeting", color: "#6c757d" },
  { value: "DEADLINE", label: "Deadline", color: "#f4a261" },
  { value: "PENGUMUMAN_AKADEMIK", label: "Pengumuman Akademik", color: "#1a365d" },
];

export function getCategoryInfo(category: EventCategory) {
  return EVENT_CATEGORIES.find((c) => c.value === category) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];
}

export function getCategoryStyle(category: EventCategory, customColor?: string) {
  const info = getCategoryInfo(category);
  const color = customColor || info.color;
  return {
    backgroundColor: `${color}1a`,
    color,
    borderColor: `${color}40`,
  };
}

export function getActivityLink(
  relatedActivityType: string,
  relatedActivityId: string | null,
  courseId: string | null,
  basePath = "/mahasiswa",
) {
  if (!relatedActivityId || !courseId) return null;

  switch (relatedActivityType) {
    case "ASSIGNMENT":
      return `${basePath}/courses/${courseId}/assignments/${relatedActivityId}`;
    case "EXAM":
      return `${basePath}/courses/${courseId}/exams/${relatedActivityId}`;
    case "MODULE":
      return `${basePath}/courses/${courseId}/modules/${relatedActivityId}`;
    case "ACTIVITY":
      return `${basePath}/courses/${courseId}?activity=${relatedActivityId}`;
    default:
      return null;
  }
}

export function getActivityLabel(relatedActivityType: string) {
  switch (relatedActivityType) {
    case "ASSIGNMENT":
      return "Tugas";
    case "EXAM":
      return "Ujian";
    case "MODULE":
      return "Materi";
    case "ACTIVITY":
      return "Aktivitas";
    default:
      return "Aktivitas";
  }
}
