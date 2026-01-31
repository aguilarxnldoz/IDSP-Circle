'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Comment {
	id: number;
	content: string;
	createdAt: string;
	User: {
		id: number;
		username: string;
		name: string | null;
		profileImage: string | null;
	};
}

interface CommentModalProps {
	albumId: number;
	isOpen: boolean;
	onClose: () => void;
	isGuest?: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({ albumId, isOpen, onClose, isGuest = false }) => {
	const [comments, setComments] = useState<Comment[]>([]);
	const [newComment, setNewComment] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
	const [optimisticComments, setOptimisticComments] = useState<Set<string>>(new Set());

	// Create a reference to the portal container
	useEffect(() => {
		// Make sure we're in the browser environment
		if (typeof window !== 'undefined') {
			// Check if portal container exists, create if not
			let portalContainer = document.getElementById('portal-root');

			if (!portalContainer) {
				portalContainer = document.createElement('div');
				portalContainer.id = 'portal-root';
				document.body.appendChild(portalContainer);
			}

			setPortalElement(portalContainer);
		}
	}, []);

	// Prevent body scrolling when modal is open
	useEffect(() => {
		const originalStyle = window.getComputedStyle(document.body).overflow;
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.body.style.overflow = originalStyle;
		};
	}, [isOpen]);

	const fetchComments = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await fetch(`/api/albums/${albumId}/comments`);
			if (!response.ok) {
				throw new Error('Failed to fetch comments');
			}
			const data = await response.json();
			setComments(data);
			// Clear optimistic comments after successful fetch
			setOptimisticComments(new Set());
		} catch (error) {
			console.error('Error fetching comments:', error);
			toast.error('Could not load comments');
		} finally {
			setIsLoading(false);
		}
	}, [albumId]);

	useEffect(() => {
		if (isOpen && albumId) {
			fetchComments();
		}
	}, [isOpen, albumId, fetchComments]);

	const handleSubmitComment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newComment.trim() === '') return;

		setIsSubmitting(true);
		const commentContent = newComment;
		setNewComment(''); // Clear input immediately for better UX

		// Create optimistic comment with temporary ID
		const tempId = `temp-${Date.now()}`;
		const optimisticComment: Comment = {
			id: -1, // temporary ID that will be replaced
			content: commentContent,
			createdAt: new Date().toISOString(),
			User: {
				id: -1, // Will be replaced with actual user ID from API response
				username: 'you',
				name: 'You',
				profileImage: null, // This will use the default avatar
			},
		};

		// Add to optimistic set to track pending comments
		setOptimisticComments(prev => new Set(prev).add(tempId));

		// Optimistically update UI
		setComments(prev => [optimisticComment, ...prev]);

		// Show loading toast
		const toastId = toast.loading('Posting comment...');

		try {
			const response = await fetch(`/api/albums/${albumId}/comments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content: commentContent }),
			});

			if (!response.ok) {
				throw new Error('Failed to submit comment');
			}

			const addedComment = await response.json();

			// Replace the optimistic comment with the real one
			setComments(prev => {
				const updated = prev.filter(c => c.id !== -1 || c.content !== commentContent);
				return [addedComment, ...updated];
			});

			// Remove from optimistic set
			setOptimisticComments(prev => {
				const updated = new Set(prev);
				updated.delete(tempId);
				return updated;
			});

			toast.success('Comment posted', { id: toastId });
		} catch (error) {
			console.error('Error submitting comment:', error);

			// Revert the optimistic update on error
			setComments(prev => prev.filter(c => c.id !== -1 || c.content !== commentContent));

			// Remove from optimistic set
			setOptimisticComments(prev => {
				const updated = new Set(prev);
				updated.delete(tempId);
				return updated;
			});

			toast.error('Failed to post comment', { id: toastId });

			// Restore the comment text to allow the user to try again
			setNewComment(commentContent);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Format date to a readable string
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
		});
	};

	if (!isOpen || !portalElement) return null;

	// Create portal to render the modal at the document body level
	return createPortal(
		<>
			<div
				className='fixed inset-0 bg-[rgba(0,0,0,0.6)] flex  items-end justify-center z-[100]'
				onClick={e => {
					if (e.target === e.currentTarget) onClose();
				}}
			>
				<div
					className='bg-[var(--background)] w-full max-w-xl transition-all opacity-100 max-h-[80vh] sm:max-h-[70vh] rounded-t-xl flex flex-col shadow-lg'
					onClick={e => e.stopPropagation()}
				>
					<div className='relative border-b border-[var(--border)] px-6 py-4 flex justify-between items-center'>
						<div className='absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-[var(--border)] rounded-full'></div>

						<h2 className='text-xl font-semibold text-[var(--foreground)] mt-1'>Comments</h2>
						<button
							className='text-[var(--foreground)] text-xl hover:opacity-70 transition-opacity'
							onClick={onClose}
							aria-label='Close comments'
						>
							<FaTimes />
						</button>
					</div>

					{/* Comments List */}
					<div className='flex-1 overflow-y-auto p-4 max-h-[50vh] sm:max-h-[40vh] overscroll-contain'>
						{isLoading ? (
							<div className='flex items-center justify-center py-8'>
								<div className='w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin'></div>
							</div>
						) : comments.length > 0 ? (
							<ul className='space-y-4'>
								{comments.map((comment, index) => {
									const isOptimistic = comment.id === -1;
									return (
										<li
											key={comment.id === -1 ? `optimistic-${index}` : comment.id}
											className='flex gap-3'
										>
											<div className='flex-shrink-0'>
												<Image
													src={comment.User.profileImage || '/images/default-avatar.png'}
													alt={comment.User.username}
													width={36}
													height={36}
													className='rounded-full object-cover aspect-square'
												/>
											</div>
											<div className={`flex-1 ${isOptimistic ? 'bg-[var(--background-secondary)] bg-opacity-70 animate-pulse' : 'bg-[var(--background-secondary)]'} rounded-xl p-3`}>
												<div className='flex justify-between mb-1'>
													<span className='font-medium text-sm'>{comment.User.name || comment.User.username}</span>
													<span className='text-xs text-[var(--foreground-secondary)]'>{isOptimistic ? 'Posting...' : formatDate(comment.createdAt)}</span>
												</div>
												<p className='text-sm break-words leading-relaxed'>{comment.content}</p>
											</div>
										</li>
									);
								})}
							</ul>
						) : (
							<div className='text-center py-8 text-[var(--foreground-secondary)]'>
								<p className='font-medium mb-2'>No comments yet</p>
								<p className='text-sm opacity-70'>Be the first to share your thoughts!</p>
							</div>
						)}
					</div>

					{/* Comment Form - Hidden for guests */}
					{isGuest ? (
						<div className='p-4 pt-3 pb-6 sm:pb-8 border-t border-[var(--border)] bg-[var(--background)]'>
							<div className='flex flex-col items-center justify-center gap-3 py-4'>
								<p className='text-sm text-[var(--foreground-secondary)]'>
									Sign in to join the conversation
								</p>
								<Link
									href='/auth/login'
									className='bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg px-6 py-2 transition-colors text-sm'
									onClick={onClose}
								>
									Sign In
								</Link>
							</div>
						</div>
					) : (
						<form
							onSubmit={handleSubmitComment}
							className='p-4 pt-3 pb-6 sm:pb-8 border-t border-[var(--border)] bg-[var(--background)]'
						>
							<div className='flex gap-2'>
								<input
									type='text'
									value={newComment}
									onChange={e => setNewComment(e.target.value)}
									placeholder='Write a comment...'
									className='flex-1 border border-[var(--border)] rounded-lg py-2 px-4 bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]'
									disabled={isSubmitting}
								/>
								<button
									type='submit'
									className='bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
									disabled={isSubmitting || newComment.trim() === ''}
								>
									{isSubmitting ? 'Posting...' : 'Post'}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</>,
		portalElement
	);
};

export default CommentModal;
