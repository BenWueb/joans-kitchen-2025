"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeSearchBox() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query parameter
      router.push(`/search?recipes[query]=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-8 md:mb-12 px-2 md:px-0">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by Title, Author or Notes"
        className="w-full mx-auto block px-4 py-2 bg-white text-gray-400 placeholder-gray-400 border rounded-lg focus:outline-none h-14 md:h-20 text-lg md:text-4xl font-bold"
      />
    </form>
  );
}
