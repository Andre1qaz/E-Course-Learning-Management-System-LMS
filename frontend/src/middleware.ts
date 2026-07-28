import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password"];

const roleRoutes: Record<string, string[]> = {
  ADMIN: ["/admin"],
  DOSEN: ["/dosen"],
  MAHASISWA: ["/mahasiswa"],
};

// Heuristic #5: Error Prevention — prevent unauthorized access to course content
// Students must be enrolled to access course content
async function checkStudentEnrollment(token: string, courseId: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    return result.success;
  } catch {
    return false;
  }
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
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
      if (courseMatch && courseMatch[1] && token) {
        const courseId = courseMatch[1];
        // Skip enrollment check for join page
        if (!pathname.includes("/join")) {
          const isEnrolled = await checkStudentEnrollment(token, courseId);
          if (!isEnrolled) {
            return NextResponse.redirect(new URL("/mahasiswa/courses/join", req.url));
          }
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