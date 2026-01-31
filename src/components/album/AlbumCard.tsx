'use client';

import Link from 'next/link';
import { FaHeart, FaRegHeart, FaComment, FaImages } from 'react-icons/fa';
import CircleHolder from '../circle_holders';
import { useState, useMemo, useCallback, memo } from 'react';
import CommentModal from './CommentModal';
import { useAlbumLikes } from './AlbumLikesContext';
import OptimizedImage from '../common/OptimizedImage';
import { toast } from 'react-hot-toast';

/**
 * Gets the display URL for an album cover image
 */
function getDisplayUrl(coverImage: string | null): string | null {
	if (!coverImage) return null;
	return coverImage;
}

interface AlbumCardProps {
	albumId: number;
	albumImage: string;
	albumName: string;
	userProfileImage: string;
	photoCount?: number;
	sourceName?: string;
	sourceType?: 'user' | 'circle';
	creatorName?: string;
	circleName?: string;
	circleImage?: string;
	isGuest?: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = memo(({ albumId, albumImage, albumName, userProfileImage, photoCount, sourceName, sourceType, creatorName, circleName, circleImage, isGuest = false }) => {
	const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
	const { likeStatuses, toggleLike, pendingAlbums } = useAlbumLikes();

	const displayImageUrl = useMemo(() => {
		return albumImage || '/images/albums/default.svg';
	}, [albumImage]);

	const objectPosition = useMemo(() => 'center', []);

	const handleLikeClick = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (isGuest) {
				toast.error('Please sign in to like albums', {
					icon: '🔒',
				});
				return;
			}

			if (pendingAlbums.has(albumId)) return;
			await toggleLike(albumId);
		},
		[albumId, pendingAlbums, toggleLike, isGuest]
	);

	const openCommentModal = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsCommentModalOpen(true);
	}, []);

	const closeCommentModal = useCallback(() => {
		setIsCommentModalOpen(false);
	}, []);

	const isLiked = likeStatuses[albumId]?.liked || false;
	const isPending = pendingAlbums.has(albumId);
	return (
		<div
			className='relative w-full rounded-lg overflow-hidden'
			style={{ aspectRatio: '2/3', backgroundColor: 'rgba(0,0,0,0.1)' }}
		>
			<Link
				href={`/album/${albumId}`}
				className='relative w-full h-full block'
			>
				{' '}
				<div className='relative w-full h-full overflow-hidden'>
					{' '}
					<OptimizedImage
						src={displayImageUrl}
						alt={`${albumName} album cover`}
						width={400}
						height={600}
						sizes='(max-width: 768px) 100vw, 33vw'
						className='object-cover w-full h-full'
						fallbackSrc='/images/albums/default.svg'
						priority
						objectFit='cover'
					/>{' '}
					<div className='absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.5)] via-transparent to-[rgba(0,0,0,0.3)]' />
					{/* User profile image in top right */}
					<div className='absolute top-3 right-3 z-10'>
						<CircleHolder
							imageSrc={userProfileImage}
							circleSize={40}
							showName={false}
						/>
					</div>
					{/* Circle image if available */}
					{circleName && circleImage && (
						<div className='absolute top-3 right-16 z-10'>
							<CircleHolder
								imageSrc={circleImage}
								circleSize={40}
								showName={false}
							/>
						</div>
					)}
					{photoCount !== undefined && (
						<div className='absolute top-3 left-3 z-10 flex items-center gap-1 bg-[rgba(0,0,0,0.4)] px-2 py-1 rounded text-white text-sm'>
							<FaImages className='text-white' />
							<span>{photoCount}</span>
						</div>
					)}
					<div className='absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4 z-10'>
						<div
							className='flex flex-col'
							style={{ maxWidth: 'calc(100% - 80px)' }}
						>
							<h3
								className='black-outline text-sm font-medium'
								style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
							>
								{albumName}
							</h3>

							{/* Show creator name */}
							{creatorName && <span className='text-xs opacity-90 black-outline flex items-center gap-1'>• By {creatorName}</span>}

							{/* Show circle if available */}
							{circleName && <span className='text-xs opacity-90 black-outline flex items-center gap-1'>◉ {circleName}</span>}

							{/* Fallback to old source display if needed */}
							{!creatorName && !circleName && sourceName && (
								<span className='text-xs opacity-90 black-outline flex items-center gap-1'>
									{sourceType === 'circle' ? '◉' : '•'} {sourceName}
								</span>
							)}
						</div>

						<div className='flex items-center gap-3'>
							{' '}
							<button
								className={`flex items-center gap-1 hover:cursor-pointer ${isPending ? 'opacity-60' : ''} ${isGuest ? 'opacity-50' : ''}`}
								aria-label={isGuest ? 'Sign in to like' : isLiked ? 'Unlike album' : 'Like album'}
								onClick={handleLikeClick}
								disabled={isPending}
								title={isGuest ? 'Sign in to like albums' : ''}
							>
								{' '}
								{isLiked ? (
									<>
										<FaHeart className={`text-xl text-[#e8083e] ${isPending ? 'animate-pulse' : ''}`} />
									</>
								) : (
									<>
										<FaRegHeart className={`text-xl text-white text-shadow-black ${isPending ? 'animate-pulse' : ''}`} />
									</>
								)}
							</button>
							<button
								className={`black-outline hover:cursor-pointer ${isGuest ? 'opacity-50' : ''}`}
								aria-label={isGuest ? 'Sign in to comment' : 'Comment on album'}
								onClick={openCommentModal}
								title={isGuest ? 'Sign in to comment' : ''}
							>
								<FaComment className='text-xl' />
							</button>
						</div>
					</div>
				</div>
			</Link>
			{isCommentModalOpen && (
				<CommentModal
					albumId={albumId}
					isOpen={isCommentModalOpen}
					onClose={() => setIsCommentModalOpen(false)}
					isGuest={isGuest}
				/>
			)}{' '}
		</div>
	);
});

AlbumCard.displayName = 'AlbumCard';

export default AlbumCard;
