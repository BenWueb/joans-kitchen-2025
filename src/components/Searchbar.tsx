"use client";

import { redirect } from "next/navigation";
import { useState } from "react";
import { FaSistrix } from "react-icons/fa";
import { useRouter } from "next/navigation";

function SearchBar() {
  const [search, setSearch] = useState("");

  const router = useRouter();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  // http://localhost:3000/search?recipes%5Bquery%5D=chili
  const onSubmit = () => {
    router.push(`/search?recipes[query]=${search}`);
  };
  return (
    <>
      <form
        className="bg-white rounded-xl h-16 text-2xl flex  w-[50%]"
        onSubmit={onSubmit}
      >
        <input
          type="text"
          value={search}
          name="search"
          onChange={onChange}
          placeholder="Search by Title, Author or Notes"
          className="w-full focus:outline-none p-4"
        />
        <button
          type="submit"
          className="bg-red-500 p-4 rounded-xl w-24 flex items-center justify-center"
        >
          <FaSistrix
            style={{ height: "40px ", width: "40px", color: "white" }}
          />
        </button>
      </form>
    </>
  );
}
export default SearchBar;
