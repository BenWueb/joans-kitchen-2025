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
    <form onSubmit={handleSubmit} className="w-full mb-12">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by Title, Author or Notes"
        className="w-[80%] mx-auto block px-4 py-2 bg-white text-gray-400 placeholder-gray-400 border rounded-lg focus:outline-none"
      />
    </form>
  );
}
