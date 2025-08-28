"use server";
import { connectToDB } from "@/lib/utils/db/connectToDB";
import { Post } from "@/lib/models/Post";
import { Tag } from "@/lib/models/tag";
import slugify from "slugify";
import { marked } from "marked";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";
import Prism from "prismjs";
import { markedHighlight } from "marked-highlight"; //Pour styliser les éléments du code;
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import { sessionInfo } from "@/lib/serverMethods/session/sessionMethods";
import AppError from "@/lib/utils/errorHandling/customError";
import crypto from "crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { areTagsSimilar, generateUniqueSlug } from "@/lib/utils/general/utils";
import { log } from "console";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

export async function addPost(formData) {
  const { title, markdownArticle, tags, coverImage } =
    Object.fromEntries(formData); //On extrait des donnéées du formulaire

  try {
    if (typeof title !== "string" || title.trim().length < 3) {
      throw new AppError("Invalid data");
    }
    if (
      typeof markdownArticle !== "string" ||
      markdownArticle.trim().length === 0
    ) {
      throw new AppError("Invalid data");
    }

    await connectToDB(); // On attend ensuite une connection à la base des données et on réutilise la connexion qui existe si jamais

    // Vérification sessionInfo
    let session = null;
    if (typeof sessionInfo === "function") {
      try {
        session = await sessionInfo();
        if (!session || !session.success) {
          throw new AppError("Session failed");
        }
      } catch (err) {
        console.log("SessionInfo error:", err);
        throw new AppError("Session failed");
      }
    } else {
      console.log("sessionInfo n'est pas défini ou importé");
      // Si la session n'est pas obligatoire, on peut continuer
    }

    //Gestion de l'upload de l'image
    // Vérification coverImage
    if (!coverImage) {
      throw new AppError("coverImage is missing");
    }
    // Si coverImage est un objet File côté client, côté serveur ce sera un Blob ou un Buffer
    // On vérifie qu'il a bien les propriétés attendues
    if (!coverImage.arrayBuffer && !coverImage.buffer) {
      throw new AppError("coverImage is not a valid file object");
    }
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!validImageTypes.includes(coverImage.type)) {
      throw new AppError("Invalid image type.");
    }
    const imageBuffer = Buffer.from(await coverImage.arrayBuffer()); // On convertit l'image en buffer

    const { width, height } = await sharp(imageBuffer).metadata(); // On récupère les dimensions de l'image

    if (width > 1280 || height > 720) {
      throw new AppError("Image must be at least 1280x720 pixels.");
    }

    const uniqueFileName = `${crypto.randomUUID()}_${coverImage.name.trim()}`;

    const uploadUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${uniqueFileName}`;

    const publicImageUrl = `https://scofexblogeducationpullzone.b-cdn.net/${uniqueFileName}`;
    // On utilise BunnyCDN pour uploader l'image

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: process.env.BUNNY_STORAGE_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      throw new AppError(`Failed to upload image: ${response.statusText}`);
    }

    //Gestion des tags
    if (typeof tags !== "string") {
      throw new AppError("Invalid data");
    }
    const tagNamesArray = JSON.parse(tags); // On parse les tags qui sont en format JSON
    if (!Array.isArray(tagNamesArray)) {
      throw new AppError("Tags must be valid array");
    }
    console.log(tagNamesArray, "Parsed tags array");
    const tagIds = await Promise.all(
      tagNamesArray.map(async (tagName) => {
        const normalizedTagName = tagName.trim().toLowerCase();

        let tag = await Tag.findOne({ name: normalizedTagName });

        if (!tag) {
          tag = await Tag.create({
            name: normalizedTagName,
            slug: slugify(normalizedTagName, { strict: true }),
          });
        }
        return tag._id; // Retourne l'ID du tag
      })
    );

    // Gestion du markdown

    marked.use(
      markedHighlight({
        highlight: (code, lang) => {
          const validLang = Prism.languages[lang] ? lang : "plaintext";

          return Prism.highlight(code, Prism.languages[validLang], validLang); // Si le langage n'est pas supporté, retourne le code brut
        },
      })
    );

    let markdownHTMLResult = marked(markdownArticle); // On convertit le markdown
    /* console.log(markdownHTMLResult, "Markdown HTML Result"); */
    markdownHTMLResult = purify.sanitize(markdownHTMLResult); // On nettoie le HTML pour éviter les injections XSS

    const newPost = new Post({
      title,
      markdownArticle,
      markdownHTMLResult,
      tags: tagIds, // On utilise les IDs des tags
      coverImageUrl: publicImageUrl,
      author: session.userId,
    }); // on utilise le modèle Post pour créer une instance de document avec un titre et le contenu de l'article.

    const savedPost = await newPost.save(
      console.log("Post saved succesfully !")
    ); // on sauvegarde ce poste dans la base des données

    return { succes: true, slug: savedPost.slug }; // On retourne succès  et le slug

    /* un slug est un texte qui représente un titre */
  } catch (error) {
    // Log détaillé pour debug Mongoose
    if (error && error.name === "ValidationError") {
      console.log("Mongoose ValidationError:", error.errors);
    }
    console.log("Error while creating the post:", error);
    /* Gestion des nouvelles erreurs */
    if (error instanceof AppError) {
      throw error;
    }
    throw new Error("An error occurred while creating the post !");
  }
}

export async function editPost(formData) {
  const { postToEditStringified, title, markdownArticle, tags, coverImage } =
    Object.fromEntries(formData);
  const postToEdit = JSON.parse(postToEditStringified);
  console.log(
    postToEdit,
    postToEditStringified,
    title,
    markdownArticle,
    tags,
    coverImage
  );


  try {
    await connectToDB();
    const sessionInfo = await sessionInfo();
    if (!sessionInfo.success) {
      throw new Error();
    }

    //Validation de titre
    const updatedData = {};

    if (typeof title !== "string") throw new Error();
    if (title.trim() !== postToEdit.title) {
      updatedData.title = title;
      updatedData.slug = await generateUniqueSlug(title);
    }

    //Validation du markdown

    if (typeof markdownArticle !== "string") throw new Error();
    if (markdownArticle.trim() !== postToEdit.markdownArticle) {
      updatedData.markdownHTMLResult = purify.sanitize(
        marked(markdownArticle)
      );
      updatedData.markdownArticle = markdownArticle;
    }

    // Gestion de l'image
    if (typeof coverImage !== "object") throw new Error();

    if (coverImage.size > 0) {
      const validImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!validImageTypes.includes(coverImage.type)) {
        throw new Error();
      }

      const imageBuffer = Buffer.from(await coverImage.arrayBuffer()); // On convertit l'image en buffer
      const { width, height } = await sharp(imageBuffer).metadata(); // On récupère les dimensions de l'image
      if (width > 1280 || height > 720) {
        throw new Error("Image must be at least 1280x720 pixels.");
      }
      const toDeleteImageFileName = postToEdit.coverImageUrl.split("/").pop();
      const deleteUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${toDeleteImageFileName}`;
      const imageDeletionResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
        },
      });
      if (!imageDeletionResponse.ok) {
        throw new AppError(
          `Failed to delete old image: ${imageDeletionResponse.statusText}`
        );
      }

      //upload new image
      const imageToUploadFileName = `${crypto.randomUUID()}.${coverImage.name}`;
      const imageToUploadUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${imageToUploadFileName}`;

      const imageToUploadPublicUrl = `https://scofexblogeducationpullzone.b-cdn.net/${imageToUploadUrl}`;

      const imageToUploadResponse = await fetch(imageToUploadUrl, {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      });

      if (!imageToUploadResponse.ok) {
        throw new Error(
          `Error while uploading new image: ${imageToUploadResponse.statusText}`
        );
      }
      updatedData.coverImageUrl = imageToUploadPublicUrl;
    }

    //Gestion des tags
    if (typeof tags !== "string") throw new Error();
    const tagNamesArray = JSON.parse(tags);
    if (!Array.isArray(tagNamesArray)) throw new Error();
    if (!areTagsSimilar(tagNamesArray, postToEdit.tags)) {
      const tagIds = await Promise.all(
        tagNamesArray.map(async (tag) => findOrCreateTag(tag))
      );
      updatedData.tags = tagIds;
    }

    if (Object.keys(updatedData).length === 0) throw new Error(); // Si aucun changement, on arrête le processus

    const updatedPost = await Post.findByIdAndUpdate(
      postToEdit._id,
      updatedData,
      { new: true }
    );

    revalidatePath(`/article/${postToEdit.slug}`);

    return { success: true, slug: updatedPost.slug };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.log("Error while editing the post:", error);
    throw new Error("An error occurred while editing the post !");
  }
}

// DELETE POST
export async function deletePost(id) {
  revalidatePath(`/article/${post.slug}`);
  try {
    await connectToDB();
    const user = await sessionInfo();
    if (!user) {
      throw new AppError("Authentication required");
    }
    const post = await Post.findById(id);

    if (!post) {
      throw new AppError("Post not found");
    }

    await Post.findByIdAndDelete(id);

    if (post.coverImageUrl) {
      const fileName = post.coverImageUrl.split("/").pop();
      if (!fileName) {
        throw new AppError("Invalid cover image URL");
      }
      const deleteUrl = `${process.env.BUNNY_STORAGE_HOST}/${process.env.BUNNY_STORAGE_ZONE}/${fileName}`;

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          AccessKey: process.env.BUNNY_STORAGE_API_KEY,
        },
      });
      if (!response.ok) {
        throw new AppError(`Failed to delete image: ${response.statusText}`);
      }
      revalidatePath(`/article/${post.slug}`);
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error; // Propagation de l'erreur personnalisée
    }
    console.log("Error while deleting the post:", error);
    throw new Error("An error occurred while deleting the post !");
  }
}
