import { EventCategory } from "@/lib/api";

export const EVENT_CATEGORIES: { value: EventCategory; label: string; bgClass: string; textClass: string }[] = [
  { value: "PERKULIAHAN", label: "Perkuliahan", bgClass: "bg-semantic-blue", textClass: "text-semantic-blue" },
  { value: "MATERI_BARU", label: "Materi Baru", bgClass: "bg-semantic-green", textClass: "text-semantic-green" },
  { value: "ASSIGNMENT", label: "Assignment", bgClass: "bg-semantic-amber", textClass: "text-semantic-amber" },
  { value: "QUIZ", label: "Quiz", bgClass: "bg-semantic-orange", textClass: "text-semantic-orange" },
  { value: "UTS", label: "UTS", bgClass: "bg-semantic-orange", textClass: "text-semantic-orange" },
  { value: "UAS", label: "UAS", bgClass: "bg-semantic-red", textClass: "text-semantic-red" },
  { value: "SEMINAR", label: "Seminar", bgClass: "bg-semantic-indigo", textClass: "text-semantic-indigo" },
  { value: "PROJECT", label: "Project", bgClass: "bg-semantic-slate", textClass: "text-semantic-slate" },
  { value: "MEETING", label: "Meeting", bgClass: "bg-semantic-slate", textClass: "text-semantic-slate" },
  { value: "DEADLINE", label: "Deadline", bgClass: "bg-semantic-amber", textClass: "text-semantic-amber" },
  { value: "PENGUMUMAN_AKADEMIK", label: "Pengumuman Akademik", bgClass: "bg-semantic-blue", textClass: "text-semantic-blue" },
];

export function getCategoryInfo(category: EventCategory) {
  return EVENT_CATEGORIES.find((c) => c.value === category) ?? EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];
}

export function getCategoryClasses(category: EventCategory, customBgClass?: string) {
  const info = getCategoryInfo(category);
  const bgClass = customBgClass || info.bgClass;
  const textClass = info.textClass;
  return {
    bgClass,
    textClass,
    lightBgClass: bgClass.replace('bg-', 'bg-').replace('bg-', '-light'),
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
