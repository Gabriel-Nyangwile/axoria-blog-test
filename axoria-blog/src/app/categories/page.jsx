import React from "react";
import Link from "next/link";
import { getTags } from "@/lib/serverMethods/blog/tagMethods";

export const revalidate = 60;
export default async function page() {
  const tags = await getTags();
  console.log(tags, "tagsConsole");

  return (
    <main className="u-main-container u-padding-content-container">
      <h1 className="t-main-title">All categories</h1>
      <p className="t-main-subtitle">Find articles sorted by category tag.</p>
      <ul className="u-articles-grid">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <li
              key={tag._id}
              className=" bg-gray-100 border rounded shadow-md"
            >
              <Link
                href={`/categories/tag/${tag.slug}`}
                className="flex p-4 pb-6 items-baseline"
              >
                <span className="text-lg font-semibold underline">#{tag.name}</span>
                <span className="ml-auto">Articles count: <span className="font-semibold">{tag.postsCount}</span></span>

              </Link>
            </li>
          ))
        ) : (
          <li>No categories found !</li>
        )}
      </ul>
    </main>
  );
}
