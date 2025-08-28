
"use client";
import { editPost } from "@/lib/serverActions/blog/postServerActions";
import { useState, useRef} from "react";
import { useRouter } from "next/navigation";
import { areTagsSimilar } from "@/lib/utils/general/utils";


export default function ClientEditForm({ post }) {
  const [tags, setTags] = useState(post.tags.map(tag => tag.name.toLowerCase()));
  const tagInputRef = useRef(null);
  const submitButtonRef = useRef(null);
  const serverValidationText = useRef(null);
  const router = useRouter();
  const imgUploadValidationText = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const readableFormData = Object.fromEntries(formData);
    const areSameTags = areTagsSimilar(tags, post.tags);
    if (readableFormData.coverImage.size === 0 && readableFormData.title.trim() === post.title && readableFormData.markdownArticle.trim() === post.markdownArticle.trim() && areSameTags) {
      serverValidationText.current.textContent = "You must make a change before submitting."
      return
    } else {
      serverValidationText.current.textContent = ""
    }

    formData.set("tags", JSON.stringify(tags)); // Convert tags array to JSON string
    formData.set("postToEditStringified", JSON.stringify(post)); // Set the post to edit

    serverValidationText.current.textContent = ""
    submitButtonRef.current.textContent = "Updating Post ..."
    submitButtonRef.current.disabled = true


    /* for (const [key, value] of formData.entries()) {
      console.log(key, value); // Log each key-value pair for debugging
    } */
   
    try {
      const result = await editPost(formData);
      if (result.success) {
        submitButtonRef.current.textContent = "Post updated ✅!";

        let countdown = 3

        serverValidationText.current.textContent = `Redirecting in ${countdown} seconds...`;

        const interval = setInterval(() => {
          countdown -= 1;

          serverValidationText.current.textContent = `Redirecting in ${countdown} seconds...`;
          
          if (countdown === 0) {
            clearInterval(interval);
            router.push(`/article/${result.slug}`); // Redirect to the new post
          }
        }, 1000);
      } 
    } catch (error) {
      submitButtonRef.current.textContent = "Submit";
      serverValidationText.current.textContent = `${error.message}`;
      
      submitButtonRef.current.textContent = false;  
    }
    
  }

  function handleAddTag() {
    const newTag = tagInputRef.current.value.trim().toLowerCase();
    if (newTag !== "" && !tags.includes(newTag) && tags.length <= 4) {
      setTags([...tags, newTag]);
      tagInputRef.current.value = "";
    }
  }
  function handleRemoveTag(tagToRemove) {
    return () => {
      setTags(tags.filter(tag => tag !== tagToRemove));
    };
  }
  function handleEnterOnTagInput(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  }
  function handleFileChange(e){
    const file = e.target.files[0];
    const validImageTypes = ["image/jpeg","image/jpeg", "image/png", "image/webp"]

    if(!validImageTypes.includes(file.type)){
      imgUploadValidationText.current.textContent = "Invalid image type. Please upload a JPEG, PNG, or WEBP image.";
      e.target.value = ""; // Reset the file input
      return;
    } else {
      imgUploadValidationText.current.textContent = "";
    }

    const img = new Image();
    img.addEventListener("load", checkImgSizeOnLoad);

    function checkImgSizeOnLoad() {
      const { width, height } = img;
      if (width < 1280 || height < 720) {
        imgUploadValidationText.current.textContent = "Image is too small. Please upload an image at least 1280x720.";
        e.target.value = ""; // Reset the file input
        URL.revokeObjectURL(img.src);
        return
      } else {
        imgUploadValidationText.current.textContent = "";
        URL.revokeObjectURL(img.src);//cleanup
      }
    }
    img.src = URL.createObjectURL(file); // Create a temporary URL for the image

  }


  return (
    <main className='u-main-container bg-white p-7 mt-32 mb-44'>
        <h1 className='text-4xl mb-4'>Edit the article ✍️</h1>
        <form onSubmit={handleSubmit} className='pb-6'>
            <label 
                htmlFor="title" className='f-label'>Title</label>
            <input 
                type="text"
                name="title"
                id="title" 
                className='shadow border text-gray-700 mb-7 p-3 rounded w-full focus:outline-slate-400'
                placeholder='Title'
                required
                defaultValue={post.title} // Pre-fill with existing title
            />
            <label 
              htmlFor="coverImage" className='f-label'
            >
              <span>Cover Image (1280x720 for best quality, or less)</span>
              <span className="block font-normal">Changing image is <span className="font-semibold">optional</span> in edit mode</span>
            </label>

            <input 
              type="file"
              name="coverImage"
              id="coverImage"
              className='shadow cursor-pointer border text-gray-700 mb-2 p-3 rounded w-full focus:outline-none focus:shadow-outline'
              placeholder="Article's cover image"
              onChange={handleFileChange}
            />
            <p 
              ref={imgUploadValidationText}
              className="text-red-700 mb-7"></p>

            <div className="mb-10">
              <label htmlFor="tag" className='f-label'>Add a Tag(s) (optional, max 5)</label>
                <div className="flex">
                  <input 
                    type="text" 
                    className="shadow border rounded p-3 text-gray-700 focus:outline-slate-400" 
                    id="tag"
                    placeholder="Add a tag"
                    ref={tagInputRef}
                    onKeyDown={handleEnterOnTagInput}
                  />
                  <button
                    type="button"
                    className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold p-4 rounded mx-4"
                    onClick={handleAddTag}
                  >
                    Add
                  </button>
                    <div className="flex items-center grow whitespace-nowrap overflow-y-auto shadow border rounded px-3">
                      {tags.map(tag =>(
                        <span key={tag} 
                          className="inline-block whitespace-nowrap bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-semi-bold mr-2"
                        >
                          {tag}
                          <button 
                            type="button"
                            onClick={handleRemoveTag(tag)}
                            className="text-red-500 ml-2">
                              &times;
                          </button>
                      </span>))}
                    </div>    
                  
                </div>
              
              
            </div>
            <textarea 
                name="markdownArticle" id="markdownArticle" className='min-h-44 shadow appearance-none border text-gray-700 mb-4 p-8 rounded w-full focus:outline-slate-400' 
                placeholder='Write your article here...' 
                required
                defaultValue={post.markdownArticle} >

            </textarea>
            <button 
                ref={submitButtonRef}
                type="submit" 
                className='min-w-44 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded border-none mb-4'>
                Submit
            </button>
            <p ref={serverValidationText}></p>
        </form>
    </main>
  )
}
