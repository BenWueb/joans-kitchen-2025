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
      "/images/static/tim-toomey-STqHLqMne3k-unsplash_1600x1600.webp",
  },
  {
    name: "Chicken",
    urlValue: "Chicken",
    image:
      "/images/static/claudio-schwarz-4qJlXK4mYzU-unsplash_1600x1600.webp",
  },
  {
    name: "Beef",
    urlValue: "Beef",
    image:
      "/images/static/madie-hamilton-GXehL5_crJ4-unsplash_1600x1600.webp",
  },
  {
    name: "Cookies",
    urlValue: "Cookies",
    image:
      "/images/static/julissa-capdevilla-tDoHiqXl9b8-unsplash_1600x1600.webp",
  },
  {
    name: "Asian",
    urlValue: "Chinese",
    image:
      "/images/static/michele-blackwell-rAyCBQTH7ws-unsplash_1600x1600.webp",
  },
  {
    name: "Drinks",
    urlValue: "Beverages Alcoholic",
    image:
      "/images/static/kobby-mendez-xBFTjrMIC0c-unsplash_1600x1600.webp",
  },
];

export default function CategoryCards() {
  return (
    <div className="w-full max-w-6xl mt-6 md:mt-8 mb-6 md:mb-10 px-2 md:px-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4 md:mb-6">
        Browse by Category
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
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
              h-28 sm:h-32
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
              <div className="relative h-full flex flex-col items-center justify-center text-white z-10 px-2">
                <h3 className="text-base sm:text-lg md:text-2xl font-bold text-center tracking-wider">
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
