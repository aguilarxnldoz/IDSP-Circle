import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
	const session = await auth();
	if (!session) {
		redirect('/auth/login');
	}

	// Check if username exists in session
	const username = session.user?.username;
	if (!username) {
		// If username is missing, redirect to home and let the user navigate manually
		// This can happen right after signup before the session is fully populated
		redirect('/home');
	}

	// Redirect to the user's profile page using their username
	redirect(`/${username}`);
}
