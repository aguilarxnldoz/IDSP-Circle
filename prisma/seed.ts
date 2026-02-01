import {PrismaClient, User, Circle, Post, Role, Album} from "../src/generated/prisma";
import {withAccelerate} from "@prisma/extension-accelerate";

const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function main() {
    console.log("Start seeding the database...");

    // Clean up existing data (optional - be careful in production)
    await cleanDatabase();

    // Create users
    const users = await createUsers();

    // Create circles
    const circles = await createCircles(users);

    // Create memberships (users joining circles)
    await createMemberships(users, circles);

    // Create albums
    const albums = await createAlbums(users);

    // Create photos for albums
    await createPhotos(albums);

    // Create album likes
    await createAlbumLikes(users, albums);

    // Create album comments
    await createAlbumComments(users, albums);

    // Create posts
    const posts = await createPosts(users, circles);

    // Create comments
    await createComments(users, posts);

    // Create likes
    await createLikes(users, posts);

    // Create follows
    await createFollows(users);

    // Create user settings
    await createUserSettings(users);

    console.log("Seeding completed successfully!");
}

async function cleanDatabase() {
    console.log("Cleaning up existing data...");

    // Delete in order to respect foreign key constraints
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.albumLike.deleteMany();
    await prisma.albumComment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.album.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.circle.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.user.deleteMany();
}

async function createUsers() {
    console.log("Creating users...");

    const userData = [
        {
            email: "john.doe@example.com",
            name: "John Doe",
            username: "johndoe",
            password: "password123", // In a real app, this should be hashed
            bio: "Music lover and avid concert-goer",
            profileImage: "/images/profile1.jpg",
            coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
        },
        {
            email: "jane.smith@example.com",
            name: "Jane Smith",
            username: "janesmith",
            password: "password123",
            bio: "Amateur DJ and electronic music producer",
            profileImage: "/images/profile2.jpg",
            coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
        },
        {
            email: "alex.johnson@example.com",
            name: "Alex Johnson",
            username: "alexj",
            password: "password123",
            bio: "Rock music enthusiast and guitarist",
            profileImage: "/images/profile3.jpg",
            coverImage: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34",
        },
        {
            email: "maria.garcia@example.com",
            name: "Maria Garcia",
            username: "mariag",
            password: "password123",
            bio: "Classical music lover and pianist",
            profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
            coverImage: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
        },
        {
            email: "david.wilson@example.com",
            name: "David Wilson",
            username: "davidw",
            password: "password123",
            bio: "Hip-hop producer and music collector",
            profileImage: "https://randomuser.me/api/portraits/men/46.jpg",
            coverImage: "https://images.unsplash.com/photo-1526328828355-69b01f8048b9",
        },
    ];

    const users = [];

    for (const user of userData) {
        const createdUser = await prisma.user.create({
            data: user,
        });
        users.push(createdUser);
    }

    return users;
}

async function createCircles(users: User[]) {
    console.log("Creating circles...");

    const circlesData = [
        {
            name: "Rock Enthusiasts",
            description: "A circle for fans of rock music from all eras",
            avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
            coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
            isPrivate: false,
            creatorId: users[0].id,
        },
        {
            name: "Electronic Music Producers",
            description: "Share your tracks, get feedback, and collaborate",
            avatar: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
            coverImage: "https://images.unsplash.com/photo-1516280440614-37939bbacd81",
            isPrivate: false,
            creatorId: users[1].id,
        },
        {
            name: "Classical Music Appreciation",
            description: "Discussing the great composers and their works",
            avatar: "https://images.unsplash.com/photo-1507838153414-b4b713384a76",
            coverImage: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c",
            isPrivate: false,
            creatorId: users[3].id,
        },
        {
            name: "Hip-Hop Collective",
            description: "Celebrating hip-hop culture and music",
            avatar: "https://images.unsplash.com/photo-1526328828355-69b01f8048b9",
            coverImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
            isPrivate: true,
            creatorId: users[4].id,
        },
        {
            name: "Indie Music Discovery",
            description: "Find and share hidden gems in the indie music scene",
            avatar: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34",
            coverImage: "https://images.unsplash.com/photo-1532293064532-7083e5bd8974",
            isPrivate: false,
            creatorId: users[2].id,
        },
    ];

    const circles = [];

    for (const circle of circlesData) {
        const createdCircle = await prisma.circle.create({
            data: circle,
        });
        circles.push(createdCircle);
    }

    return circles;
}

async function createMemberships(users: User[], circles: Circle[]) {
    console.log("Creating memberships...");

    // Each user is automatically a member (and admin) of their own circle
    // Let's add cross-memberships
    const memberships = [
        // User 0 joins other circles
        {userId: users[0].id, circleId: circles[1].id, role: Role.MEMBER},
        {userId: users[0].id, circleId: circles[2].id, role: Role.MEMBER},

        // User 1 joins other circles
        {userId: users[1].id, circleId: circles[0].id, role: Role.MEMBER},
        {userId: users[1].id, circleId: circles[4].id, role: Role.MODERATOR},

        // User 2 joins other circles
        {userId: users[2].id, circleId: circles[0].id, role: Role.MODERATOR},
        {userId: users[2].id, circleId: circles[3].id, role: Role.MEMBER},

        // User 3 joins other circles
        {userId: users[3].id, circleId: circles[1].id, role: Role.MEMBER},
        {userId: users[3].id, circleId: circles[4].id, role: Role.MEMBER},

        // User 4 joins other circles
        {userId: users[4].id, circleId: circles[0].id, role: Role.MEMBER},
        {userId: users[4].id, circleId: circles[2].id, role: Role.MODERATOR},
    ];

    for (const membership of memberships) {
        await prisma.membership.create({
            data: membership,
        });
    }
}

// New function to create albums
async function createAlbums(users: User[]) {
    console.log("Creating albums...");

    const albumsData = [
        {
            title: "Summer Memories",
            description: "Photos from our beach trip",
            coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            isPrivate: false,
            creatorId: users[0].id,
        },
        {
            title: "Concert Night",
            description: "Amazing concert at the stadium",
            coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
            isPrivate: false,
            creatorId: users[1].id,
        },
        {
            title: "Family Reunion",
            description: "Annual family get-together",
            coverImage: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac",
            isPrivate: true,
            creatorId: users[2].id,
        },
        {
            title: "City Exploration",
            description: "Walking through downtown",
            coverImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b",
            isPrivate: false,
            creatorId: users[3].id,
        },
        {
            title: "Studio Sessions",
            description: "Recording new tracks",
            coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04",
            isPrivate: false,
            creatorId: users[4].id,
        },
        // Add albums for friends to show on home page
        {
            title: "Road Trip Adventures",
            description: "Cross-country adventures",
            coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
            isPrivate: false,
            creatorId: users[1].id, // Friend of user[0]
        },
        {
            title: "Art Exhibition",
            description: "My artwork showcase",
            coverImage: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5",
            isPrivate: false,
            creatorId: users[2].id, // Friend of user[0]
        },
    ];

    const albums = [];

    for (const album of albumsData) {
        const createdAlbum = await prisma.album.create({
            data: album,
        });
        albums.push(createdAlbum);
    }

    return albums;
}

// New function to create photos for albums
async function createPhotos(albums: Album[]) {
    console.log("Creating photos for albums...");

    const photosData = [
        // Photos for Summer Memories album
        {
            url: "https://images.unsplash.com/photo-1520454974749-611b7248ffdb",
            description: "Beautiful sunset at the beach",
            albumId: albums[0].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a",
            description: "Building sandcastles",
            albumId: albums[0].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a",
            description: "Beach volleyball with friends",
            albumId: albums[0].id,
            updatedAt: new Date(),
        },
        // Photos for Concert Night album
        {
            url: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14",
            description: "Main stage performance",
            albumId: albums[1].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
            description: "Crowd going wild",
            albumId: albums[1].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1563841930606-67e2bce48b78",
            description: "Backstage with the band",
            albumId: albums[1].id,
            updatedAt: new Date(),
        },
        // Photos for other albums...
        {
            url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d",
            description: "Grandparents with the kids",
            albumId: albums[2].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1517456793572-1d8efd6dc135",
            description: "Skyscrapers downtown",
            albumId: albums[3].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81",
            description: "Studio mixing board",
            albumId: albums[4].id,
            updatedAt: new Date(),
        },
        // Add more photos for the friends' albums
        {
            url: "https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b",
            description: "Mountain stop during road trip",
            albumId: albums[5].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1541300613936-40806962bdfd",
            description: "Desert sunrise",
            albumId: albums[5].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1501554728187-ce583db33af7",
            description: "Watercolor painting",
            albumId: albums[6].id,
            updatedAt: new Date(),
        },
        {
            url: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968",
            description: "Oil on canvas",
            albumId: albums[6].id,
            updatedAt: new Date(),
        },
    ];

    for (const photo of photosData) {
        await prisma.photo.create({
            data: photo,
        });
    }
}

async function createPosts(users: User[], circles: Circle[]) {
    console.log("Creating posts...");

    const postsData = [
        {
            content: "Just discovered this amazing song! What do you think?",
            userId: users[0].id,
            circleId: circles[0].id,
        },
        {
            content: "Working on a new remix of this track. Will share the final version soon!",
            userId: users[1].id,
            circleId: circles[1].id,
            imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81",
        },
        {
            content: "This guitar solo is absolutely mind-blowing!",
            userId: users[2].id,
            circleId: circles[0].id,
        },
        {
            content: "One of the most beautiful compositions of all time. What's your favorite movement?",
            userId: users[3].id,
            circleId: circles[2].id,
        },
        {
            content: "Throwback to this classic hip-hop track that changed the game.",
            userId: users[4].id,
            circleId: circles[3].id,
            imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
        },
        {
            content: "Perfect song for summer road trips!",
            userId: users[0].id,
            circleId: circles[4].id,
        },
        {
            content: "Been listening to this on repeat all week.",
            userId: users[1].id,
            circleId: circles[0].id,
        },
        {
            content: "What's your favorite indie track right now?",
            userId: users[2].id,
            circleId: circles[4].id,
        },
        {
            content: "Classical music helps me focus while working. Anyone else?",
            userId: users[3].id,
            circleId: circles[2].id,
        },
        {
            content: "The best workout motivation song!",
            userId: users[4].id,
            circleId: circles[0].id,
        },
    ];

    const posts = [];

    for (const post of postsData) {
        const createdPost = await prisma.post.create({
            data: post,
        });
        posts.push(createdPost);
    }

    return posts;
}

async function createComments(users: User[], posts: Post[]) {
    console.log("Creating comments...");

    const commentsData = [
        {
            content: "Totally agree! This is a masterpiece!",
            userId: users[1].id,
            postId: posts[0].id,
        },
        {
            content: "Can't wait to hear the final version!",
            userId: users[2].id,
            postId: posts[1].id,
        },
        {
            content: "Best guitar solo of all time, hands down.",
            userId: users[0].id,
            postId: posts[2].id,
        },
        {
            content: "The third movement is my absolute favorite.",
            userId: users[4].id,
            postId: posts[3].id,
        },
        {
            content: "This track never gets old!",
            userId: users[3].id,
            postId: posts[4].id,
        },
        {
            content: "Added to my road trip playlist!",
            userId: users[2].id,
            postId: posts[5].id,
        },
        {
            content: "Such a classic tune.",
            userId: users[3].id,
            postId: posts[6].id,
        },
        {
            content: "I've been loving the new album by Tame Impala.",
            userId: users[0].id,
            postId: posts[7].id,
        },
        {
            content: "Absolutely! Mozart works best for me.",
            userId: users[1].id,
            postId: posts[8].id,
        },
        {
            content: "This is my go-to gym song!",
            userId: users[2].id,
            postId: posts[9].id,
        },
        {
            content: "The lyrics are so meaningful.",
            userId: users[4].id,
            postId: posts[0].id,
        },
        {
            content: "What software are you using for the remix?",
            userId: users[3].id,
            postId: posts[1].id,
        },
    ];

    for (const comment of commentsData) {
        await prisma.comment.create({
            data: comment,
        });
    }
}

async function createLikes(users: User[], posts: Post[]) {
    console.log("Creating likes...");

    const likes = [
        {userId: users[1].id, postId: posts[0].id},
        {userId: users[2].id, postId: posts[0].id},
        {userId: users[3].id, postId: posts[0].id},
        {userId: users[0].id, postId: posts[1].id},
        {userId: users[2].id, postId: posts[1].id},
        {userId: users[0].id, postId: posts[2].id},
        {userId: users[1].id, postId: posts[2].id},
        {userId: users[4].id, postId: posts[2].id},
        {userId: users[0].id, postId: posts[3].id},
        {userId: users[4].id, postId: posts[3].id},
        {userId: users[0].id, postId: posts[4].id},
        {userId: users[2].id, postId: posts[5].id},
        {userId: users[3].id, postId: posts[6].id},
        {userId: users[0].id, postId: posts[7].id},
        {userId: users[1].id, postId: posts[8].id},
        {userId: users[2].id, postId: posts[9].id},
    ];

    for (const like of likes) {
        await prisma.like.create({
            data: like,
        });
    }
}

async function createFollows(users: User[]) {
    console.log("Creating follows...");

    const follows = [
        {followerId: users[1].id, followingId: users[0].id},
        {followerId: users[2].id, followingId: users[0].id},
        {followerId: users[3].id, followingId: users[0].id},
        {followerId: users[0].id, followingId: users[1].id},
        {followerId: users[2].id, followingId: users[1].id},
        {followerId: users[0].id, followingId: users[2].id},
        {followerId: users[1].id, followingId: users[2].id},
        {followerId: users[4].id, followingId: users[2].id},
        {followerId: users[1].id, followingId: users[3].id},
        {followerId: users[2].id, followingId: users[4].id},
    ];

    for (const follow of follows) {
        await prisma.follow.create({
            data: follow,
        });
    }
}

async function createUserSettings(users: User[]) {
    console.log("Creating user settings...");

    for (const user of users) {
        await prisma.userSettings.create({
            data: {
                userId: user.id,
                // Using defaults for most settings
                // But customizing a few for variety
                darkMode: Math.random() > 0.3, // 70% chance of dark mode
                highContrast: Math.random() > 0.8, // 20% chance of high contrast
                fontSize: Math.random() > 0.7 ? "large" : Math.random() > 0.4 ? "medium" : "small",
            },
        });
    }
}

async function createAlbumLikes(users: User[], albums: Album[]) {
    console.log("Creating album likes...");

    const albumLikes = [
        {userId: users[1].id, albumId: albums[0].id},
        {userId: users[2].id, albumId: albums[0].id},
        {userId: users[3].id, albumId: albums[0].id},
        {userId: users[0].id, albumId: albums[1].id},
        {userId: users[2].id, albumId: albums[1].id},
        {userId: users[0].id, albumId: albums[2].id},
        {userId: users[1].id, albumId: albums[2].id},
        {userId: users[4].id, albumId: albums[2].id},
        {userId: users[0].id, albumId: albums[3].id},
        {userId: users[4].id, albumId: albums[3].id},
        {userId: users[0].id, albumId: albums[4].id},
        {userId: users[2].id, albumId: albums[5].id},
        {userId: users[3].id, albumId: albums[6].id},
    ];

    for (const like of albumLikes) {
        await prisma.albumLike.create({
            data: like,
        });
    }
}

async function createAlbumComments(users: User[], albums: Album[]) {
    console.log("Creating album comments...");

    const commentsData = [
        {
            content: "Beautiful sunset photos!",
            userId: users[1].id,
            albumId: albums[0].id,
            updatedAt: new Date(),
        },
        {
            content: "Looks like an amazing concert!",
            userId: users[2].id,
            albumId: albums[1].id,
            updatedAt: new Date(),
        },
        {
            content: "Great family memories!",
            userId: users[0].id,
            albumId: albums[2].id,
            updatedAt: new Date(),
        },
        {
            content: "I love the city architecture",
            userId: users[4].id,
            albumId: albums[3].id,
            updatedAt: new Date(),
        },
        {
            content: "Nice studio setup!",
            userId: users[3].id,
            albumId: albums[4].id,
            updatedAt: new Date(),
        },
        {
            content: "That mountain view is breathtaking!",
            userId: users[2].id,
            albumId: albums[5].id,
            updatedAt: new Date(),
        },
        {
            content: "You're so talented with watercolors",
            userId: users[3].id,
            albumId: albums[6].id,
            updatedAt: new Date(),
        },
        {
            content: "When was this taken?",
            userId: users[0].id,
            albumId: albums[0].id,
            updatedAt: new Date(),
        },
        {
            content: "Who was performing that night?",
            userId: users[1].id,
            albumId: albums[1].id,
            updatedAt: new Date(),
        },
    ];

    for (const comment of commentsData) {
        await prisma.albumComment.create({
            data: comment,
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
