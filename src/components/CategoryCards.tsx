"use client";

import Link from "next/link";

interface Category {
  name: string;
  urlValue: string;
  image: string;
}

const categories: Category[] = [
  {
    name: "Appetizers",
    urlValue: "Appetizers Hors D'Oeuvres",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/tim-toomey-STqHLqMne3k-unsplash_1600x1600.webp?alt=media&token=bfc9a035-471e-4d9e-9040-d992195d5170",
  },
  {
    name: "Chicken",
    urlValue: "Chicken",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/claudio-schwarz-4qJlXK4mYzU-unsplash_1600x1600.webp?alt=media&token=3b4325a8-a1a9-4f2f-9ab6-15985710cbe2",
  },
  {
    name: "Beef",
    urlValue: "Beef",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/madie-hamilton-GXehL5_crJ4-unsplash_1600x1600.webp?alt=media&token=c5fadb97-208d-45e2-8747-96eb5f05ae3a",
  },
  {
    name: "Cookies",
    urlValue: "Cookies",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/julissa-capdevilla-tDoHiqXl9b8-unsplash_1600x1600.webp?alt=media&token=f412111d-a43d-4ce3-85ab-ae64fae9f215",
  },
  {
    name: "Asian",
    urlValue: "Chinese",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/michele-blackwell-rAyCBQTH7ws-unsplash_1600x1600.webp?alt=media&token=6da0fb59-2617-4bba-b561-d67f5bb8afe0",
  },
  {
    name: "Drinks",
    urlValue: "Beverages Alcoholic",
    image:
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/kobby-mendez-xBFTjrMIC0c-unsplash_1600x1600.webp?alt=media&token=a77b9740-728f-426b-8ffe-c02fe8312bbd",
  },
];

export default function CategoryCards() {
  return (
    <div className="w-full max-w-6xl mt-8 mb-10">
      <h2 className="text-3xl font-bold text-white text-center mb-6">
        Browse by Category
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/search?recipes[refinementList][category][0]=${encodeURIComponent(
              category.urlValue
            )}`}
            className="group"
          >
            <div
              className="
              relative overflow-hidden rounded-xl shadow-lg
              h-32
              transform transition-all duration-300
              hover:scale-105 hover:shadow-2xl
            "
            >
              {/* Background Image */}
              <img
                src={category.image}
                alt={category.name}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center text-white z-10">
                <h3 className="text-2xl font-bold text-center tracking-wider">
                  {category.name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
