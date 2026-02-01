import prisma from './prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Utility class for optimizing prisma queries
 */
export class PrismaUtils {
	/**
	 * Enhanced findMany with batching capabilities
	 * Use this when you need to load many related records to avoid N+1 issues
	 */
	static async batchedFindMany<T, R>(items: T[], keyExtractor: (item: T) => number | string, queryExecutor: (ids: (number | string)[]) => Promise<R[]>, keyInResult: (result: R) => number | string): Promise<Map<number | string, R[]>> {
		if (items.length === 0) return new Map();

		const ids = items.map(keyExtractor);
		const results = await queryExecutor([...new Set(ids)]);

		return results.reduce((acc, result) => {
			const key = keyInResult(result);
			if (!acc.has(key)) {
				acc.set(key, []);
			}
			acc.get(key)!.push(result);
			return acc;
		}, new Map<number | string, R[]>());
	}

	/**
	 * Create a dataloader-like function for batching similar queries
	 */ static createBatchLoader<T extends number, R>(loadFn: (ids: T[]) => Promise<R[]>, keyExtractor: (item: R) => T | null) {
		return async (ids: T[]): Promise<Map<T, R>> => {
			if (ids.length === 0) return new Map();

			const uniqueIds = [...new Set(ids)];
			const results = await loadFn(uniqueIds);

			return results.reduce((acc, result) => {
				const key = keyExtractor(result);
				if (key !== null) {
					acc.set(key, result);
				}
				return acc;
			}, new Map<T, R>());
		};
	}

	/**
	 * Execute queries in transaction for better performance
	 * Use this when you need to make multiple related database operations
	 */ static async transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
		return prisma.$transaction(fn) as Promise<T>;
	}

	/**
	 * Pagination utility that uses cursor-based pagination for better performance
	 * with large datasets compared to offset-based pagination
	 */ static async paginateCursor<T, C extends keyof any>(
		model: any,
		{
			take = 10,
			cursor,
			cursorField = 'id' as C,
			where = {},
			orderBy = { [cursorField]: 'desc' },
			include = {},
		}: {
			take?: number;
			cursor?: any;
			cursorField?: C;
			where?: any;
			orderBy?: any;
			include?: any;
		}
	): Promise<{ items: T[]; nextCursor: any | null }> {
		const items = (await model.findMany({
			take: take + 1, // take one extra to check if there are more
			cursor: cursor ? { [cursorField]: cursor } : undefined,
			where,
			orderBy,
			include,
		})) as any[];

		const hasMore = items.length > take;
		const data = hasMore ? items.slice(0, take) : items;
		const nextCursor = hasMore ? data[data.length - 1][cursorField] : null;

		return {
			items: data as T[],
			nextCursor,
		};
	}
}

/**
 * Performance-optimized query utilities for common operations
 */
export class QueryOptimizer {
	/**
	 * Batch load user follow status for multiple users
	 * Prevents N+1 queries when checking follow status for many users
	 */
	static async batchLoadFollowStatus(currentUserId: number, targetUserIds: number[]): Promise<Map<number, boolean>> {
		if (targetUserIds.length === 0) return new Map();

		const follows = await prisma.follow.findMany({
			where: {
				followerId: currentUserId,
				followingId: { in: targetUserIds },
			},
			select: { followingId: true },
		});

		const followMap = new Map<number, boolean>();
		targetUserIds.forEach(id => followMap.set(id, false));
		follows.forEach(follow => followMap.set(follow.followingId, true));

		return followMap;
	}

	/**
	 * Batch load circle membership status for a user across multiple circles
	 */
	static async batchLoadCircleMembership(userId: number, circleIds: number[]): Promise<Map<number, { isMember: boolean; role: string | null }>> {
		if (circleIds.length === 0) return new Map();

		const memberships = await prisma.membership.findMany({
			where: {
				userId,
				circleId: { in: circleIds },
			},
			select: { circleId: true, role: true },
		});

		const membershipMap = new Map<number, { isMember: boolean; role: string | null }>();
		circleIds.forEach(id => membershipMap.set(id, { isMember: false, role: null }));
		memberships.forEach(membership => membershipMap.set(membership.circleId, { isMember: true, role: membership.role }));

		return membershipMap;
	}

	/**
	 * Batch load like status for albums
	 */
	static async batchLoadAlbumLikes(userId: number, albumIds: number[]): Promise<Map<number, { isLiked: boolean; likeCount: number }>> {
		if (albumIds.length === 0) return new Map();

		const [userLikes, likeCounts] = await Promise.all([
			prisma.albumLike.findMany({
				where: {
					userId,
					albumId: { in: albumIds },
				},
				select: { albumId: true },
			}),
			prisma.album.findMany({
				where: { id: { in: albumIds } },
				select: {
					id: true,
					_count: { select: { AlbumLike: true } },
				},
			}),
		]);

		const resultMap = new Map<number, { isLiked: boolean; likeCount: number }>();
		const likedAlbumIds = new Set(userLikes.map(like => like.albumId));

		likeCounts.forEach(album => {
			resultMap.set(album.id, {
				isLiked: likedAlbumIds.has(album.id),
				likeCount: album._count.AlbumLike,
			});
		});

		return resultMap;
	}

	/**
	 * Efficiently get user's accessible circles (created + member)
	 */
	static async getUserAccessibleCircles(userId: number): Promise<number[]> {
		const [createdCircles, memberCircles] = await Promise.all([
			prisma.circle.findMany({
				where: { creatorId: userId },
				select: { id: true },
			}),
			prisma.membership.findMany({
				where: { userId },
				select: { circleId: true },
			}),
		]);

		const accessibleIds = new Set([...createdCircles.map(c => c.id), ...memberCircles.map(m => m.circleId)]);

		return Array.from(accessibleIds);
	}
}

/**
 * Optimized select helpers - reduces over-fetching by selecting only needed fields
 */
export const userBasicSelect = {
	id: true,
	username: true,
	name: true,
	profileImage: true,
};

export const circleBasicSelect = {
	id: true,
	name: true,
	avatar: true,
	isPrivate: true,
};

export const albumBasicSelect = {
	id: true,
	title: true,
	coverImage: true,
	isPrivate: true,
	createdAt: true,
	creatorId: true,
};

export const photoBasicSelect = {
	id: true,
	url: true,
	createdAt: true,
};
