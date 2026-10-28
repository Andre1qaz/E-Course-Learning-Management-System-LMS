import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/403"];

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin", "/dosen"], // Admin can also access dosen routes
  DOSEN: ["/dosen"],
  MAHASISWA: ["/mahasiswa"],
};

// Routes below /mahasiswa/courses/ that are not course IDs.
const NON_COURSE_SEGMENTS = new Set(["available", "join"]);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Heuristic #5: Error Prevention — prevent unauthorized access to course content
// Students must be enrolled to access course content.
// Returns false when the backend explicitly denies access, null when the
// result is unknown (network/backend error) so we don't wrongly redirect.
async function checkStudentEnrollment(
  token: string,
  courseId: string,
): Promise<boolean | null> {
  if (!API_URL) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    }

    if ([401, 403, 404].includes(response.status)) {
      return false;
    }

    return null;
  } catch {
    return null;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Allow API proxy and auth routes without authentication
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/proxy")) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const token = req.auth?.accessToken;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    if (isLoggedIn && role) {
      const dashboardMap: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        DOSEN: "/dosen/dashboard",
        MAHASISWA: "/mahasiswa/dashboard",
      };
      return NextResponse.redirect(new URL(dashboardMap[role] ?? "/", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role) {
    const allowedPrefixes = roleRoutes[role] ?? [];
    const hasAccess = allowedPrefixes.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (
      !hasAccess &&
      !pathname.startsWith("/api") &&
      pathname !== "/"
    ) {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    // Check enrollment for students accessing course content
    if (role === "MAHASISWA" && pathname.startsWith("/mahasiswa/courses/")) {
      const courseMatch = pathname.match(/^\/mahasiswa\/courses\/([^\/]+)/);
      const courseId = courseMatch?.[1];
      if (courseId && !NON_COURSE_SEGMENTS.has(courseId) && token) {
        const isEnrolled = await checkStudentEnrollment(token, courseId);
        // Only redirect when the backend explicitly says "not enrolled".
        if (isEnrolled === false) {
          return NextResponse.redirect(
            new URL("/mahasiswa/courses/join", req.url),
          );
        }
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};