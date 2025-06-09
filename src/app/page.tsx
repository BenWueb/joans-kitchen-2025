"use client";

import searchClient from "@/utils/algolia";
import Link from "next/link";
import Image from "next/image";
import { Josefin_Sans } from "next/font/google";

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
const Hit: React.FC<{ hit: { title: string; createdBy: string } }> = ({
  hit,
}) => {
  const searchUrl = hit.title
    .replace(/[._~:/?#[\]@!$+;=%]/g, "")
    .replace(/\s/gi, "_");

  return (
    <>
      <Link
        className=" h-full flex flex-col justify-between"
        href={`/${searchUrl}`}
      >
        <div className=" w-full aspect-square">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/joans-recipes.appspot.com/o/images%2F96BI44rNPkZcSOZ3wCl4B197Xwr1-anh-nguyen-kcA-c3f_3FE-unsplash.jpg-e7d7932a-f73b-4d6c-8500-e733e7503520_800x800?alt=media&token=95d80d74-2134-42ee-b5ba-5f04df160312"
            height={200}
            width={200}
            alt="delicious food"
          />
        </div>
        <div className="flex justify-between items-center flex-col gap-2 h-full mt-4 mb-2 px-1">
          <h4 className="text-md">{hit.title}</h4>
          <p className="text-sm">Created by: {hit.createdBy}</p>
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
      <section className="">
        <div className="w-full h-full flex flex-col items-center  p-4 bg-cover bg-no-repeat bg-center bg-fixed   bg-[linear-gradient(to_top,rgba(0,0,0,0.4),rgba(0,0,0,0.7)),url('/images/bg.jpg')] ">
          <InstantSearch
            searchClient={searchClient}
            indexName="recipes"
            routing={true}
            showSubmit={false}
          >
            <h1
              className={`text-8xl  mt-[5%] mb-10  text-white ${josefinSans.className} font-bold text-center uppercase tracking-wider`}
            >
              Joans Kitchen
            </h1>
            <SearchBox
              placeholder="Search by Title, Author or Notes"
              // className={{
              //   root: "bg-white",
              //   form: "ais-SearchBox-form",
              //   input: "ais-SearchBox-form-input",
              //   reset: "display: none",
              //   resetIcon: "display: none",
              // }}
            />
            <main className="w-full h-full flex  p-4 mt-10 bg-zinc-300/80 rounded-lg ">
              <div className="w-[20%] mt-12 pl-4">
                <h2 className="text-2xl font-semibold mb-4">Categories</h2>
                <RefinementList attribute="category" />
                <h2 className="text-2xl font-semibold my-4">Creators</h2>
                <RefinementList attribute="createdBy" />
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
