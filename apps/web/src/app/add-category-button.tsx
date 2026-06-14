"use client";

import { useState } from "react";
import { addCategoryAction } from "./actions";

export function AddCategoryButton() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await addCategoryAction(name);
    if (res.success) {
      setName("");
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="New Category..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
