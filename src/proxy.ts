import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
	'/',
	'/home',
	'/auth/login',
	'/auth/register',
	'/auth/session-error',
	'/circle',
	'/search',
];

// Public path patterns (regex)
const publicPathPatterns = [
	/^\/circle\/\d+$/, // /circle/[id]
	/^\/circle\/\d+\/[^\/]+$/, // /circle/[id]/invite, /circle/[id]/joinrequests, etc.
	/^\/album\/\d+$/, // /album/[id]
	/^\/api\/.*/, // All API routes
	/^\/.+$/, // /[username] - profile pages
	/^\/.+\/followers$/, // /[username]/followers
	/^\/.+\/following$/, // /[username]/following
];

// Check if user is authenticated by looking for session cookie
// This is lightweight and doesn't require importing heavy auth libraries
function isAuthenticated(req: NextRequest): boolean {
	// Check for NextAuth session cookie
	const sessionCookie = req.cookies.get('next-auth.session-token') || 
	                     req.cookies.get('__Secure-next-auth.session-token');
	return !!sessionCookie;
}

export default function middleware(req: NextRequest) {
	const { nextUrl } = req;
	const pathname = nextUrl.pathname;

	// Skip middleware for static files and API routes
	if (
		pathname.startsWith('/_next/') ||
		pathname.startsWith('/api/') ||
		pathname.startsWith('/images/') ||
		pathname.includes('.') ||
		pathname === '/favicon.ico'
	) {
		return NextResponse.next();
	}

	// Check if path is public
	const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
	const matchesPublicPattern = publicPathPatterns.some(pattern => pattern.test(pathname));

	// Allow access to public paths regardless of auth status
	if (isPublicPath || matchesPublicPattern) {
		return NextResponse.next();
	}

	// Check authentication via cookie (lightweight)
	const isLoggedIn = isAuthenticated(req);

	// Redirect to login if not authenticated and trying to access protected route
	if (!isLoggedIn) {
		const loginUrl = new URL('/auth/login', nextUrl);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
