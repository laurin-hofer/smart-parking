import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminSessionToken, getAdminSessionCookieName } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin pages require session cookie
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = request.cookies.get(getAdminSessionCookieName());
    const expected = adminSessionToken();
    if (!session || session.value !== expected) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
