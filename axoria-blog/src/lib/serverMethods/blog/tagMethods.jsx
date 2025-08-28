import { connectToDB } from "@/lib/utils/db/connectToDB";
import { Tag } from "@/lib/models/tag";

export async function getTags(){

    await connectToDB();
    const tags = await Tag.aggregate([
        {
            $lookup: {
                from: "posts",
                localField: "_id",
                foreignField: "tags",
                as: "postsWithTag"// on rajoute un post
            }
        },
        {
            $addFields: {
                postsCount: { $size: "$postsWithTag" }// on compte le nombre de posts
            }
        },
        {
            $match: { postsCount: { $gt: 0 } }// on filtre les tags avec des posts
        },
        {
            $sort: { postsCount: -1 }// on trie les tags par nombre de posts
        },
        {
            $project: {
                postsWithTag: 0
            }// on exclut les posts avec le tag
        }
    ])
    return tags;
}