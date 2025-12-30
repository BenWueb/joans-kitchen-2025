"use client";

import { Josefin_Sans } from "next/font/google";
import RecipeCarousel from "@/components/RecipeCarousel";
import HomeSearchBox from "@/components/HomeSearchBox";
import CategoryCards from "@/components/CategoryCards";
import RecentlyFavorited from "@/components/RecentlyFavorited";

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function Main() {
  return (
    <>
      <section className="min-h-screen">
        <div className="w-full min-h-screen flex flex-col items-center px-4 py-6 md:p-4">
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-8xl mt-4 sm:mt-8 md:mt-[5%] mb-6 md:mb-10 text-white ${josefinSans.className} font-bold text-center uppercase tracking-wider`}
          >
            Joans Kitchen
          </h1>

          {/* Search Box */}
          <HomeSearchBox />

          {/* Recipe Carousel */}
          <div className="w-full max-w-6xl mb-6 md:mb-10">
            <RecipeCarousel
              recipeIds={[
                "wf0nKK44FBLgFs1z8B6p",
                "vbfbxujDRIEQOvrt5m6C",
                "recipe-id-3",
                "recipe-id-4",
                "recipe-id-5",
              ]}
            />
          </div>

          {/* Category Cards */}
          <CategoryCards />

          {/* Recently Favorited */}
          <RecentlyFavorited />
        </div>
      </section>
    </>
  );
}
export default Main;
