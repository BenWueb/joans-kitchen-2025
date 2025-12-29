import Link from "next/link";
import { recipeToUrl } from "@/utils/recipeUrl";

function RecipeCard({ title, createdBy }) {
  if (!title) {
    return;
  }

  const recipeUrl = recipeToUrl(title);

  return (
    <>
      <Link
        className="block relative aspect-square overflow-hidden rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
        href={`/${recipeUrl}`}
      >
        <div className="relative w-full h-full">
          {/* Image */}
          <img
            src="https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/anh-nguyen-kcA-c3f_3FE-unsplash.jpg?alt=media&token=84d81dbd-d2ef-4035-8928-4526652bcd9c"
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Sharp gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/90 via-black/60 to-transparent" />

          {/* Text overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h4 className="text-lg font-bold mb-1 line-clamp-2">{title}</h4>
            {createdBy && <p className="text-sm opacity-90">By {createdBy}</p>}
          </div>
        </div>
      </Link>
    </>
  );
}
export default RecipeCard;
