import React from 'react'
import Link from 'next/link';
import { getUserPostsFromUserID } from "@/lib/serverMethods/blog/postMethods";
import DeletePostButton from './components/DeletePostButton';


export default async function page({params}) {

  const {userId} = await params;
 /*  console.log("[Dashboard] userId param:", userId);
  if (!userId || userId === "undefined") {
    throw new Error("Dashboard: userId param is missing or invalid");
  } */

  const posts = await getUserPostsFromUserID(userId);

  /* const posts = [
    {
        "_id": "689ca30446e5e6e3e25c68d4",
        "title": "latest test",
        "markdownArticle": "Un essai pour la route !",
        "markdownHTMLResult": "<p>Un essai pour la route !</p>\n",
        "author": {
            "_id": "6898c67116403f1ef25d5b26",
            "userName": "Gabriel Lwabeya",
            "normalizedUserName": "gabriel-lwabeya"
        "coverImageUrl": "https://scofexblogeducationpullzone.b-cdn.net/69c5cf72-f3f5-498f-a0f9-b828aa52ee4d_multiple-cursors-thumb.jpg",
        "tags": [
            "6886392d15bd6b62bac77a61",
            "6886392d15bd6b62bac77a63",

            "689a5884c99db60dd54df9ed"
        ],
        "createdAt": "2025-08-13T14:36:52.540Z",
        "updatedAt": "2025-08-13T14:36:52.540Z",
        "slug": "latest-test",
        "__v": 0
    }
] */


  return (
  <main 
    className='u-main-container u-padding-content-container'>
      <h1 className='text-3xl mb-5'>Dashboard - Your articles</h1>

      <ul>
        {posts.length > 0 ? (
          posts.map((post) => (
            <li 
              key={post._id}
              className='flex items-center mb-2 bg-slate-50 py-2 pl-4'
            >
              <Link 
                href={`/article/${post.slug}`}
                className='mr-auto underline underline-offset-2 text-lg text-violet-600'
              >
               {post.title}
              </Link>
              <Link 
                href={`/dashboard/edit/${post._id}`}
                className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold text-center min-w-20 py-2 px-4 rounded mr-2'
                >
                  Edit
              </Link>
              <DeletePostButton id={post._id.toString()} />
            </li>

          ))
        ) : (
          <li>You haven't created any articles yet.</li>
        )}
      </ul>
  </main>
  )
}
