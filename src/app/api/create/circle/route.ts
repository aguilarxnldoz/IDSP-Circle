import {NextResponse} from "next/server";
import prisma from "../../../../lib/prisma";
import { PrismaUtils } from '@/lib/prisma-utils';
import { auth } from '@/auth';

export async function POST(req: Request) {
    try {
        const {formData} = await req.json();
        console.log("Server hit!");
        console.log("backend: ", formData);

        // Get current user from session to ensure the request is authenticated
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const creatorId = parseInt(formData.creatorId, 10);

        if (isNaN(creatorId)) {
            return NextResponse.json({error: "Invalid creator ID"}, {status: 400});
        }

        // Verify the user creating the circle is the authenticated user
        if (creatorId !== parseInt(session.user.id, 10)) {
            return NextResponse.json({ error: 'Unauthorized - User ID mismatch' }, { status: 403 });
        }        // OPTIMIZATION: Use transaction to batch circle creation and all membership operations
        const newCircle = await PrismaUtils.transaction(async (tx) => {
            // Create the circle
            const circle = await tx.circle.create({
                data: {
                    creatorId: formData.creatorId,
                    name: formData.name,
                    avatar: formData.avatar || null,
                    isPrivate: formData.isPrivate,
                },
            });

            // Create creator membership as ADMIN
            await tx.membership.create({
                data: {
                    userId: creatorId,
                    circleId: circle.id,
                    role: "ADMIN",
                },
            });

            // Create member memberships in batch
            const memberUserIds: number[] = formData.members || [];
            if (memberUserIds.length > 0) {
                await tx.membership.createMany({
                    data: memberUserIds.map((userId) => ({
                        userId,
                        circleId: circle.id,
                        role: "MEMBER",
                    })),
                });
            }

            return circle;
        });

        console.log(`Created circle: ${newCircle.name}`);

        return NextResponse.json(
            {
                message: "Successfully created circle",
                circle: newCircle,
            },
            {status: 200}
        );
    } catch (err) {
        console.error("Error creating circle:", err);
        return NextResponse.json({error: "Failed to create circle"}, {status: 500});
    }
}
