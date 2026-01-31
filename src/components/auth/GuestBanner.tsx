'use client';

import Link from 'next/link';
import { FaInfoCircle } from 'react-icons/fa';

export default function GuestBanner() {
	return (
		<div className='w-full bg-gradient-to-r from-circles-dark-blue to-blue-600 text-white px-4 py-3 rounded-lg mb-4 shadow-md'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<FaInfoCircle className='text-lg flex-shrink-0' />
					<p className='text-sm'>
						<span className='font-semibold'>Guest Mode:</span> You&apos;re browsing as a guest.{' '}
						<span className='hidden sm:inline'>Sign in to like, comment, and create content.</span>
					</p>
				</div>
				<Link
					href='/auth/login'
					className='bg-white text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-opacity-90 transition flex-shrink-0 ml-2'
				>
					Sign In
				</Link>
			</div>
		</div>
	);
}
