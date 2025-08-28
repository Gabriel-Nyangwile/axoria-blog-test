import React from 'react'
import { getPostsByTag } from '@/lib/serverMethods/blog/postMethods';
import BlogCard from '@/components/BlogCard';

export default async function page({ params }) {
    const { tag } = await params;
    const posts = await getPostsByTag(tag);
    console.log("Posts by tag:", posts);

  return (
    <main className='u-main-container u-padding-content-container'>
      <h1 className='t-main-title'>Posts from the #{tag} tag.🏷️</h1>
      <p className='t-main-subtitle'>All posts that use this tag :</p>
      <p className='mr-4 text-md-zinc-900'>Latest articles</p>
      <ul className='u-articles-grid'>
        {posts.length > 0 ? (
          posts.map(post => <BlogCard key={post._id} post={post} />)
        ) : (
          <li>No article found for this tag. 🤖🤖🤖</li>
        )}
      </ul>
    </main>
  )
}
