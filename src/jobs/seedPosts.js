import { posts } from "../data/posts.js";
import { savePost } from "../db/posts.js";
import { pool } from "../db/client.js";

async function seedPosts() {
    for (const post of posts) {
        const savedPost = await savePost(post);

        console.log(
            `Saved post: ${savedPost.id} - ${savedPost.title}`
        );
    }

    await pool.end();

    console.log("Post seeding completed.");
}

seedPosts();