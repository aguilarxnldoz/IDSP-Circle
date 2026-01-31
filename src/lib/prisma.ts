import { PrismaClient } from '@/generated/prisma/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const createPrismaClient = () => {
	// Create a base Prisma client with Accelerate URL for edge runtime
	const prismaBase = new PrismaClient({
		accelerateUrl: process.env.DATABASE_URL,
	});

	// Finally, extend with Accelerate after applying middleware
	return prismaBase.$extends(withAccelerate());
};

type PrismaClientWithExtensions = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
	prisma: PrismaClientWithExtensions;
};

// Use a single Prisma Client instance
const prisma: PrismaClientWithExtensions = process.env.NODE_ENV === 'production' ? createPrismaClient() : globalForPrisma.prisma || (globalForPrisma.prisma = createPrismaClient());

export default prisma;
