import prisma from '@/lib/prisma';
import CircleHolder from '@/components/circle_holders';
import NavBar from '@/components/bottom_bar/NavBar';
import { auth } from '@/auth';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default async function CirclesListPage() {
	const session = await auth();
	const isGuest = !session || !session.user;

	// Fetch all public circles
	const circles = await prisma.circle.findMany({
		where: {
			isPrivate: false,
		},
		select: {
			id: true,
			name: true,
			avatar: true,
			description: true,
			_count: {
				select: {
					members: true,
					Album: true,
				},
			},
		},
		orderBy: {
			members: {
				_count: 'desc',
			},
		},
		take: 50,
	});

	return (
		<main className='w-full max-w-xl mx-auto min-h-screen bg-background flex flex-col items-center px-4 pb-24'>
			{/* Header with back button */}
			<header className='w-full flex items-center justify-between py-4 mt-2'>
				<Link
					href='/home'
					className='flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--primary)] transition-colors'
				>
					<FaArrowLeft className='text-xl' />
					<span className='text-sm font-medium'>Back</span>
				</Link>
				<h1 className='text-xl font-bold'>Circles</h1>
				<div className='w-16'></div> {/* Spacer for alignment */}
			</header>

			{/* Create Circle Button (only for authenticated users) */}
			{!isGuest && (
				<div className='w-full mb-6'>
					<Link
						href='/create/circle'
						className='w-full block text-center px-4 py-3 bg-circles-dark-blue rounded-lg hover:bg-opacity-90 transition'
					>
						<span className='text-circles-light font-medium'>Create New Circle</span>
					</Link>
				</div>
			)}

			{/* Circles List */}
			<section className='w-full'>
				{circles.length > 0 ? (
					<div className='space-y-4'>
						{circles.map(circle => (
							<Link
								key={circle.id}
								href={`/circle/${circle.id}`}
								className='flex items-center gap-4 p-4 bg-[var(--background-secondary)] rounded-xl hover:bg-opacity-80 transition'
							>
								<CircleHolder
									imageSrc={circle.avatar || '/images/circles/default.svg'}
									name={circle.name}
									circleSize={60}
									showName={false}
								/>
								<div className='flex-1 min-w-0'>
									<h3 className='font-semibold text-[var(--foreground)] truncate'>
										{circle.name}
									</h3>
									{circle.description && (
										<p className='text-sm text-[var(--foreground-secondary)] truncate mt-0.5'>
											{circle.description}
										</p>
									)}
									<div className='flex items-center gap-3 mt-1 text-xs text-[var(--foreground-secondary)]'>
										<span>{circle._count.members} {circle._count.members === 1 ? 'member' : 'members'}</span>
										<span>•</span>
										<span>{circle._count.Album} {circle._count.Album === 1 ? 'album' : 'albums'}</span>
									</div>
								</div>
							</Link>
						))}
					</div>
				) : (
					<div className='text-center py-12'>
						<p className='text-[var(--foreground-secondary)] mb-4'>No circles found</p>
						{!isGuest && (
							<Link
								href='/create/circle'
								className='inline-block px-6 py-3 bg-circles-dark-blue rounded-lg hover:bg-opacity-90 transition'
							>
								<span className='text-circles-light'>Create the First Circle</span>
							</Link>
						)}
					</div>
				)}
			</section>

			<NavBar />
		</main>
	);
}
