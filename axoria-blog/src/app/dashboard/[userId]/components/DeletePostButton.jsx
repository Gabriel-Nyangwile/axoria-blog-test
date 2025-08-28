
"use client"
import { deletePost } from "@/lib/serverActions/blog/postServerActions"

export default function DeletePostButton({ id }) {

  return (
    <button 
        onClick={() => deletePost(id)}
        className="bg-red-500 hover:bg-red-700 text-white font-bold text-center min-w-20 py-2 px-4 rounded mr-2"
    >
        Delete
    </button>
  )
}
