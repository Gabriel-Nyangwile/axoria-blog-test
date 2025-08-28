/* utilisation de mongoose t création du schéma et du modèle */
import mongoose from "mongoose";
import slugify from "slugify";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    markdownArticle: {
      type: String,
      required: true,
    },
    markdownHTMLResult: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true, //Il sert à identifier une ressource.
    },
    //l'auteur est un modèle lié au modèle 'user'
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    coverImageUrl: {
      type: String,
      required: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag", // On fait référence au modèle Tag
      },
    ],
  },
  { timestamps: true }
); // la date de mise en ligne du document.

postSchema.pre("save", async function (next) {
  if (!this.slug) {
    let slugCandidate = slugify(this.title, { lower: true, strict: true });

    /* Vérifier si le slug existe déjà */
    let slugExists = await mongoose.models.Post.findOne({
      slug: slugCandidate,
    });
    let counter = 1;
    while (slugExists) {
      slugCandidate = `${slugCandidate}-${counter}`;
      slugExists = await mongoose.models.Post.findOne({ slug: slugCandidate });
      counter++;
    }
    this.slug = slugCandidate;
    console.log("Final slug", slugCandidate);
  }
  next();
});
export const Post = mongoose.models?.Post || mongoose.model("Post", postSchema);
