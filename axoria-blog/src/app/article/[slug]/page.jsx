import React from 'react'
import { getPost } from "@/lib/serverMethods/blog/postMethods";
import Link from 'next/link';
import "./article-styles.css"
import 'prism-themes/themes/prism-vsc-dark-plus.css'
import Image  from 'next/image';
import NotFound from "next/navigation"

export default async function page({params}) {

    const { slug } = await params;
    const post = await getPost(slug);

    if(!post) return <NotFound />;

    // Debug: vérifier le contenu de markdownHTMLResult
    console.log("markdownHTMLResult type:", typeof post.markdownHTMLResult);
    console.log("markdownHTMLResult value:", post.markdownHTMLResult);

  return (
    <main className="u-main-container u-padding-content-container">
        <h1 className='text-4xl mb-3'>{post.title}</h1>
        <p className='mb-6'>
          By:&nbsp;
          <Link 
            href={`/categories/author/${post.author.normalizedUserName}`}
            className='mr-4 underline'>
              {post.author.userName}
          </Link>
          {post.tags.map((tag) => (
            <Link 
              key={tag.slug} 
              href={`/categories/tag/${tag.slug}`} className='mr-4 underline'
            >
              #{tag.name}
            </Link>
          ))}

        </p>
        {/* Insertion de l'Image */}
        <Image
          src={post.coverImageUrl}
          alt={post.title}
          width={1280}
          height={720}
          className="mb-10"
        />
        <div className='article-styles'>
          <div 
            className='markdown-content mb-10'
            dangerouslySetInnerHTML={{ __html: post.markdownHTMLResult || '<p>Contenu vide</p>' }}
          />
        </div>
        {/* <p className='text-gray-500 mb-5'>{post.markdownArticle}</p>
 */}

    </main>
  )
}
