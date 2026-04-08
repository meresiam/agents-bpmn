import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

function hasSession(request: NextRequest): boolean {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value === '1';
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isLogin = path === '/login';
  const ok = hasSession(request);

  if (!ok && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const from = path + request.nextUrl.search;
    if (from && from !== '/login') {
      url.searchParams.set('from', from);
    }
    return NextResponse.redirect(url);
  }

  if (ok && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/bpmn/:path*'],
};
