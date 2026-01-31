import { auth } from './auth';
import { NextResponse } from 'next/server';

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
	/^\/.+$/, // /[username] - profile pages
	/^\/.+\/followers$/, // /[username]/followers
	/^\/.+\/following$/, // /[username]/following
];

export default auth(req => {
	const { nextUrl } = req;
	const isLoggedIn = !!req.auth;
	const pathname = nextUrl.pathname;

	// Check if path is public
	const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
	const matchesPublicPattern = publicPathPatterns.some(pattern => pattern.test(pathname));

	// Allow access to public paths regardless of auth status
	if (isPublicPath || matchesPublicPattern) {
		return NextResponse.next();
	}

	// Redirect to login if not authenticated and trying to access protected route
	if (!isLoggedIn) {
		const loginUrl = new URL('/auth/login', nextUrl);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
