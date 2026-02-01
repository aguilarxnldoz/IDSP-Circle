import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
		seed: 'npx tsx prisma/seed.ts',
	},
	datasource: {
		// Use DIRECT_DATABASE_URL for migrations (direct PostgreSQL connection)
		// Falls back to DATABASE_URL if DIRECT_DATABASE_URL is not set
		url: env('DIRECT_DATABASE_URL') || env('DATABASE_URL'),
	},
});
