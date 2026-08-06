const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export { API_URL };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    // Heuristic #9: descriptive error messages
    throw new ApiError(
      data.message || "Terjadi kesalahan. Silakan coba lagi.",
      response.status,
    );
  }

  return data;
}

// Calendar API functions
export type EventCategory = 
  | "PERKULIAHAN"
  | "MATERI_BARU"
  | "ASSIGNMENT"
  | "QUIZ"
  | "UTS"
  | "UAS"
  | "SEMINAR"
  | "PROJECT"
  | "MEETING"
  | "DEADLINE"
  | "PENGUMUMAN_AKADEMIK";

export type EventTargetAudience = "ALL_STUDENTS" | "COURSE_STUDENTS";

export type RelatedActivityType = "ASSIGNMENT" | "EXAM" | "MODULE" | "ACTIVITY" | "NONE";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  isOnline: boolean;
  meetingLink: string | null;
  category: EventCategory;
  color: string;
  type: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
  targetAudience: EventTargetAudience;
  relatedActivityType: RelatedActivityType;
  relatedActivityId: string | null;
  isPublished: boolean;
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
  userId: string | null;
  courseId: string | null;
  course?: {
    id: string;
    name: string;
    code: string;
    thumbnailColor: string;
  };
  createdAt: string;
  updatedAt: string;
  timeRemaining?: string; // Added by backend for upcoming events
}

export async function getCalendarEvents(
  token: string,
  filters?: {
    courseId?: string;
    category?: EventCategory;
    startDate?: string;
    endDate?: string;
  }
) {
  const params = new URLSearchParams();
  if (filters?.courseId) params.append("courseId", filters.courseId);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  
  const queryString = params.toString();
  return apiFetch<CalendarEvent[]>(`/calendar${queryString ? `?${queryString}` : ""}`, {}, token);
}

export async function getCalendarEventsByMonth(token: string, year: number, month: number) {
  return apiFetch<CalendarEvent[]>(`/calendar/month?year=${year}&month=${month}`, {}, token);
}

export async function getUpcomingEvents(token: string, days: number = 7) {
  return apiFetch<CalendarEvent[]>(`/calendar/upcoming?days=${days}`, {}, token);
}

export async function getEventById(token: string, eventId: string) {
  return apiFetch<CalendarEvent>(`/calendar/${eventId}`, {}, token);
}

export async function createCalendarEvent(
  token: string,
  data: {
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isOnline?: boolean;
    meetingLink?: string;
    category?: EventCategory;
    color?: string;
    type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
    targetAudience?: EventTargetAudience;
    relatedActivityType?: RelatedActivityType;
    relatedActivityId?: string;
    isPublished?: boolean;
    attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
    courseId?: string;
  },
) {
  // Filter out empty strings for optional UUID fields
  const cleanedData = {
    ...data,
    courseId: data.courseId && data.courseId.trim() !== '' ? data.courseId : undefined,
    relatedActivityId: data.relatedActivityId && data.relatedActivityId.trim() !== '' ? data.relatedActivityId : undefined,
  };
  
  return apiFetch<CalendarEvent>("/calendar", {
    method: "POST",
    body: JSON.stringify(cleanedData),
  }, token);
}

export async function updateCalendarEvent(
  token: string,
  eventId: string,
  data: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isOnline?: boolean;
    meetingLink?: string;
    category?: EventCategory;
    color?: string;
    type?: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
    targetAudience?: EventTargetAudience;
    relatedActivityType?: RelatedActivityType;
    relatedActivityId?: string;
    isPublished?: boolean;
    attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
  },
) {
  // Filter out empty strings for optional UUID fields
  const cleanedData = {
    ...data,
    relatedActivityId: data.relatedActivityId !== undefined ? (data.relatedActivityId && data.relatedActivityId.trim() !== '' ? data.relatedActivityId : null) : undefined,
  };
  
  return apiFetch<CalendarEvent>(`/calendar/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(cleanedData),
  }, token);
}

export async function deleteCalendarEvent(token: string, eventId: string) {
  return apiFetch<null>(`/calendar/${eventId}`, {
    method: "DELETE",
  }, token);
}

export async function toggleEventPublish(token: string, eventId: string) {
  return apiFetch<CalendarEvent>(`/calendar/${eventId}/publish`, {
    method: "PUT",
  }, token);
}

// Legacy function for backward compatibility
export async function getUpcomingDeadlines(token: string) {
  return getUpcomingEvents(token, 7);
}

// Announcements API functions
export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPublished: boolean;
  validFrom: string | null;
  validUntil: string | null;
  courseId: string | null;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
  };
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize: string }>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    reads: number;
  };
}

export async function getAnnouncements(
  token: string,
  filters?: {
    courseId?: string;
    unreadOnly?: boolean;
  }
) {
  const params = new URLSearchParams();
  if (filters?.courseId) params.append("courseId", filters.courseId);
  if (filters?.unreadOnly) params.append("unreadOnly", filters.unreadOnly.toString());
  
  const queryString = params.toString();
  return apiFetch<Announcement[]>(`/announcements${queryString ? `?${queryString}` : ""}`, {}, token);
}

export async function createAnnouncement(
  token: string,
  data: {
    title: string;
    content: string;
    priority?: string;
    isPublished?: boolean;
    validFrom?: string;
    validUntil?: string;
    courseId?: string;
    attachments?: Array<{ fileName: string; fileUrl: string; fileSize: string }>;
  }
) {
  // Filter out empty strings for optional UUID fields
  const cleanedData = {
    ...data,
    courseId: data.courseId && data.courseId.trim() !== '' ? data.courseId : undefined,
  };
  
  return apiFetch<Announcement>("/announcements", {
    method: "POST",
    body: JSON.stringify(cleanedData),
  }, token);
}

export async function updateAnnouncement(
  token: string,
  announcementId: string,
  data: {
    title?: string;
    content?: string;
    priority?: string;
    isPublished?: boolean;
    validFrom?: string;
    validUntil?: string;
    attachments?: Array<{ fileName: string; fileUrl: string; fileSize: string }>;
  }
) {
  return apiFetch<Announcement>(`/announcements/${announcementId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteAnnouncement(token: string, announcementId: string) {
  return apiFetch<null>(`/announcements/${announcementId}`, {
    method: "DELETE",
  }, token);
}

export async function markAnnouncementAsRead(token: string, announcementId: string) {
  return apiFetch<null>(`/announcements/${announcementId}/read`, {
    method: "POST",
  }, token);
}

export async function markAllAnnouncementsAsRead(token: string) {
  return apiFetch<null>("/announcements/mark-all-read", {
    method: "POST",
  }, token);
}

export async function getUnreadAnnouncementCount(token: string) {
  return apiFetch<{ count: number }>("/announcements/unread-count", {}, token);
}

// Forum API functions
export interface ForumAuthor {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ForumReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
}

export interface ForumThread {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  bestReplyId?: string;
  bestReply?: ForumReply;
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  replies: ForumReply[];
  unreadCount?: number;
  _count?: {
    replies: number;
  };
}

export async function getForumThreads(token: string, courseId: string) {
  return apiFetch<ForumThread[]>(`/forum/course/${courseId}`, {}, token);
}

export async function getForumThread(token: string, threadId: string) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}`, {}, token);
}

export async function createForumThread(
  token: string,
  data: {
    courseId: string;
    title: string;
    content: string;
  },
) {
  return apiFetch<ForumThread>("/forum/thread", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateForumThread(
  token: string,
  threadId: string,
  data: {
    title?: string;
    content?: string;
  },
) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export async function deleteForumThread(token: string, threadId: string) {
  return apiFetch<null>(`/forum/thread/${threadId}`, {
    method: "DELETE",
  }, token);
}

export async function togglePinThread(token: string, threadId: string) {
  return apiFetch<ForumThread>(`/forum/thread/${threadId}/pin`, {
    method: "PUT",
  }, token);
}

export async function createForumReply(
  token: string,
  threadId: string,
  content: string,
) {
  return apiFetch<ForumReply>(`/forum/thread/${threadId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }, token);
}

export async function updateForumReply(
  token: string,
  replyId: string,
  content: string,
) {
  return apiFetch<ForumReply>(`/forum/reply/${replyId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  }, token);
}

export async function deleteForumReply(token: string, replyId: string) {
  return apiFetch<null>(`/forum/reply/${replyId}`, {
    method: "DELETE",
  }, token);
}

// Notifications API functions
export interface Notification {
  id: string;
  userId: string;
  type: "DEADLINE_REMINDER" | "EXAM_REMINDER" | "GRADE_RELEASED" | "FORUM_REPLY" | "SYSTEM";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(token: string, unreadOnly = false) {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  return apiFetch<Notification[]>(`/notifications${params}`, {}, token);
}

export async function getUnreadCount(token: string) {
  return apiFetch<{ count: number }>("/notifications/unread-count", {}, token);
}

export async function markNotificationAsRead(token: string, notificationId: string) {
  return apiFetch<null>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  }, token);
}

export async function markAllNotificationsAsRead(token: string) {
  return apiFetch<null>("/notifications/read-all", {
    method: "PUT",
  }, token);
}

export async function deleteNotification(token: string, notificationId: string) {
  return apiFetch<null>(`/notifications/${notificationId}`, {
    method: "DELETE",
  }, token);
}

// Private Files API functions
export interface PrivateFile {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  folderPath: string;
  mimeType: string | null;
  createdAt: string;
}

export interface QuotaInfo {
  used: number;
  limit: number;
}

export interface PrivateFilesResponse {
  files: PrivateFile[];
  quota: QuotaInfo;
}

export async function getPrivateFiles(token: string, folderPath = "/") {
  const params = new URLSearchParams({ folderPath });
  return apiFetch<PrivateFilesResponse>(`/private-files?${params.toString()}`, {}, token);
}

export async function getPrivateFilesQuota(token: string) {
  return apiFetch<QuotaInfo>("/private-files/quota", {}, token);
}

export async function uploadPrivateFile(
  token: string,
  data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    folderPath?: string;
  },
) {
  return apiFetch<{ uploadUrl: string; fileUrl: string; file: PrivateFile }>("/private-files/upload", {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function deletePrivateFile(token: string, fileId: string) {
  return apiFetch<null>(`/private-files/${fileId}`, {
    method: "DELETE",
  }, token);
}

export async function createPrivateFolder(token: string, folderPath: string) {
  return apiFetch<{ folderPath: string }>("/private-files/folder", {
    method: "POST",
    body: JSON.stringify({ folderPath }),
  }, token);
}

export async function getPrivateFileDownloadUrl(token: string, fileId: string) {
  return apiFetch<{ downloadUrl: string; fileName: string }>(`/private-files/${fileId}/download`, {}, token);
}

export async function renamePrivateFile(token: string, fileId: string, newFileName: string) {
  return apiFetch<PrivateFile>(`/private-files/${fileId}/rename`, {
    method: "PUT",
    body: JSON.stringify({ newFileName }),
  }, token);
}

export async function movePrivateFile(token: string, fileId: string, newFolderPath: string) {
  return apiFetch<PrivateFile>(`/private-files/${fileId}/move`, {
    method: "PUT",
    body: JSON.stringify({ newFolderPath }),
  }, token);
}

// Courses API functions
export interface Course {
  id: string;
  name: string;
  code: string;
  enrollmentCode: string;
  enrollmentEnabled: boolean;
  description: string | null;
  learningObjectives: string | null;
  thumbnailColor: string;
  isLinear: boolean;
  isActive: boolean;
  instructorId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    academicYear: string;
    isActive: boolean;
  } | null;
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    enrollments: number;
    modules: number;
    assignments: number;
    exams: number;
  };
}

export async function getCourses(token: string) {
  return apiFetch<Course[]>("/courses/dashboard", {}, token);
}

export async function getCourse(token: string, courseId: string) {
  return apiFetch<Course>(`/courses/${courseId}`, {}, token);
}

export async function enrollCourse(token: string, enrollmentCode: string) {
  return apiFetch<{ courseId: string; courseName: string }>("/courses/enroll", {
    method: "POST",
    body: JSON.stringify({ enrollmentCode }),
  }, token);
}

export async function unenrollCourse(token: string, courseId: string) {
  return apiFetch<null>(`/courses/${courseId}/unenroll`, {
    method: "POST",
  }, token);
}

export async function directEnrollCourse(
  token: string,
  courseId: string,
  userId: string,
  role: "STUDENT" | "ASSISTANT"
) {
  return apiFetch<{ courseId: string; userId: string; userName: string }>(`/courses/${courseId}/direct-enroll`, {
    method: "POST",
    body: JSON.stringify({ userId, role }),
  }, token);
}

export async function updateEnrollmentKey(
  token: string,
  courseId: string,
  data: {
    enrollmentCode?: string;
    enrollmentEnabled?: boolean;
  }
) {
  return apiFetch<{ enrollmentCode: string; enrollmentEnabled: boolean }>(`/courses/${courseId}/enrollment-key`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, token);
}

export interface Participant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "STUDENT" | "ASSISTANT";
  joinedAt: string;
}

export interface ParticipantsResponse {
  courseId: string;
  courseName: string;
  totalParticipants: number;
  participants: Participant[];
}

export async function getCourseParticipants(token: string, courseId: string) {
  return apiFetch<ParticipantsResponse>(`/courses/${courseId}/participants`, {}, token);
}

export async function removeCourseParticipant(token: string, courseId: string, participantId: string) {
  return apiFetch<null>(`/courses/${courseId}/participants/${participantId}`, {
    method: "DELETE",
  }, token);
}

// Users API functions (Admin only)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function getUsers(token: string) {
  return apiFetch<User[]>("/auth/users", {}, token);
}

// Activity Logs API functions (Admin only)
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function getActivityLogs(token: string) {
  return apiFetch<ActivityLog[]>("/auth/activity-logs", {}, token);
}
