"use client";

import searchClient from "@/utils/algolia";
import Link from "next/link";
import Image from "next/image";
import { Josefin_Sans } from "next/font/google";
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
  const imageUrl =
    hit.imageUrls?.[0] ||
    "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/anh-nguyen-kcA-c3f_3FE-unsplash.jpg?alt=media&token=84d81dbd-d2ef-4035-8928-4526652bcd9c";

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
            <p className="hidden md:block text-xs opacity-90">
              By {hit.createdBy}
            </p>
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
        <div className="w-full min-h-screen flex flex-col items-center px-4 py-6 md:p-4">
          <InstantSearch
            searchClient={searchClient}
            indexName="recipes"
            routing={true}
            // showSubmit={false}
          >
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-8xl mt-4 sm:mt-8 md:mt-[5%] mb-6 md:mb-10 text-white ${josefinSans.className} font-bold text-center uppercase tracking-wider`}
            >
              Joans Kitchen
            </h1>
            <SearchBox placeholder="Search by Title, Author or Notes" />
            <main className="w-full flex-1 flex flex-col md:flex-row p-4 mt-6 md:mt-10 bg-zinc-300/80 rounded-lg mb-4">
              <div className="hidden md:block w-full md:w-[20%] mb-6 md:mb-0 md:mt-12 md:pl-4">
                <h2 className="text-xl md:text-2xl font-semibold mb-4">
                  Categories
                </h2>
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
