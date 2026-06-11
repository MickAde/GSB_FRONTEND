import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Tokens are stored in sessionStorage/localStorage (not cookies), so
// this proxy cannot read them. Route protection is handled client-side
// via RoleGuard in each route group layout.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
