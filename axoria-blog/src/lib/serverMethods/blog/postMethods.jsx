import { Post } from "@/lib/models/Post";
import { Tag } from "@/lib/models/tag";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { notFound } from "next/navigation";
import { User } from "@/lib/models/user";

export const dynamic = "force-dynamic";

export async function getPost(slug) {
    try {
        await connectToDB();

        const post = await Post.findOne({slug}).populate({
            path: "author",
            select: "userName normalizedUserName"
        }).populate({ 
            path: "tags", 
            select: "name slug" 
        });

        if(!post) return null;

        return post

    } catch (err) {
        console.error("Error while fetching a post:", err);

        throw new Error(err.message || "An error occurred while fetching the post!");
    }
}
export async function getPosts() {
    try {
        await connectToDB();

        const posts = await Post.find({})
            .sort({createdAt: -1})
            .populate({
                path: "author",
                select: "userName normalizedUserName"
            });

        return posts;
    } catch (err) {
        
    }
}

export async function getUserPostsFromUserID(userId) {
    if (!userId) {
        console.error("getUserPostsFromUserID: userId is undefined");
        throw new Error("userId is undefined");
    }
    await connectToDB();

    const posts = await Post.find({author: userId}).select("title _id slug");//<--- Manquait author:

    return posts
}

export async function getPostsByTag(tagSlug) {
    await connectToDB();

    const tag = await Tag.findOne({ slug: tagSlug })

       if(!tag){
        notFound();
       }

       const posts = await Post.find({ tags: tag._id })
       .populate({
           path: "author",
           select: "userName"
       })
       .select("title _id coverImageUrl slug createdAt") //On selectionne  les champs qu'on voudrait voir affichés
       .sort({createdAt: -1})

       return posts;
}

export async function getPostsByAuthor(normalizedUserName) {
    await connectToDB();

    const author = await User.findOne({ normalizedUserName })
    if(!author){
        notFound();
    }

    const posts = await Post.find({ author: author._id })
        .populate({
            path: "author",
            select: "userName normalizedUserName"
        })
        .select("title coverImageUrl slug createdAt")
        .sort({ createdAt: -1 });

    return { author, posts };
}

export async function getPostForEdit(id) {
    try {
        await connectToDB();

        const post = await Post.findOne({ _id: id }).populate({
            path: "author",
            select: "userName normalizedUserName"
        }).populate({
            path: "tags",
            select: "name slug"
        });

        if (!post) {
            notFound();
        }

        return post;

    } catch (err) {
        console.error("Error while fetching a post for edit:", err);

        throw new Error(err.message || "An error occurred while fetching the post for edit!");
    }
}
