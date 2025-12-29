"use client";

import searchClient from "@/utils/algolia";
import Link from "next/link";
import Image from "next/image";
import { Josefin_Sans } from "next/font/google";
import { useState, useEffect } from "react";
import { getOrFetchRecipeImage } from "@/utils/unsplash";
import { recipeToUrl } from "@/utils/recipeUrl";

import {
  Pagination,
  InstantSearch,
  SearchBox,
  Hits,
  Stats,
  RefinementList,
} from "react-instantsearch";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Convert title to URL format and display each hit
const Hit: React.FC<{ hit: any }> = ({ hit }) => {
  const [imageUrl, setImageUrl] = useState(
    hit.imageUrls?.[0] ||
      hit.unsplashImageUrl ||
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/anh-nguyen-kcA-c3f_3FE-unsplash.jpg?alt=media&token=84d81dbd-d2ef-4035-8928-4526652bcd9c"
  );

  useEffect(() => {
    const loadImage = async () => {
      if (!hit.imageUrls?.[0] && !hit.unsplashImageUrl) {
        const url = await getOrFetchRecipeImage(hit.objectID, {
          id: hit.objectID,
          title: hit.title,
          tags: hit.tags,
          imageUrls: hit.imageUrls,
        });
        setImageUrl(url);
      }
    };
    loadImage();
  }, [hit]);

  const searchUrl = recipeToUrl(hit.title);

  const title = hit.title.toLowerCase();

  return (
    <>
      <Link
        className="block relative w-full h-full overflow-hidden rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
        href={`/${searchUrl}`}
      >
        {/* Image */}
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/anh-nguyen-kcA-c3f_3FE-unsplash.jpg?alt=media&token=84d81dbd-d2ef-4035-8928-4526652bcd9c"
          fill
          alt={title}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Sharp gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/95 via-black/70 to-transparent pointer-events-none z-10" />

        {/* Text overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10 text-left">
          <h4 className="text-base font-bold mb-1 line-clamp-2 capitalize">
            {title}
          </h4>
          {hit.createdBy && (
            <p className="text-xs opacity-90">By {hit.createdBy}</p>
          )}
        </div>
      </Link>
    </>
  );
};

function Content() {
  return (
    <div className="w-full ">
      <Stats />
      <Hits hitComponent={Hit} />
      <Pagination className="flex justify-center" />
    </div>
  );
}

function Main() {
  return (
    <>
      <section className="min-h-screen">
        <div className="w-full min-h-screen flex flex-col items-center p-4">
          <InstantSearch
            searchClient={searchClient}
            indexName="recipes"
            routing={true}
            // showSubmit={false}
          >
            <h1
              className={`text-8xl  mt-[5%] mb-10  text-white ${josefinSans.className} font-bold text-center uppercase tracking-wider`}
            >
              Joans Kitchen
            </h1>
            <SearchBox placeholder="Search by Title, Author or Notes" />
            <main className="w-full flex-1 flex  p-4 mt-10 bg-zinc-300/80 rounded-lg mb-4">
              <div className="w-[20%] mt-12 pl-4">
                <h2 className="text-2xl font-semibold mb-4">Categories</h2>
                <RefinementList attribute="category" limit={100} />
              </div>
              <Content />
            </main>
          </InstantSearch>
        </div>
      </section>
    </>
  );
}
export default Main;
