import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route protection is handled client-side by RoleGuard in each route group
// layout. Tokens live in sessionStorage/localStorage (not cookies), so this
// proxy cannot verify them server-side. The only server-safe signal we have is
// the gsb_auth presence cookie, but setting it via document.cookie right before
// router.push() causes a race: the RSC navigation request reaches the proxy
// before the browser commits the cookie. We therefore let all routes through
// here and rely on RoleGuard for auth enforcement.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
