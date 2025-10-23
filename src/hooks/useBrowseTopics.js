import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

const CATEGORY_MAP = {
  "Database expert": "Database Expert",
  "website": "Website",
  "mobile app": "Mobile App",
  "cai (E-Learning/Computer-Aided Instruction Systems)": "CAI",
  "software/hardware": "Software/Hardware",
};

const DEFAULT_CATEGORIES = [
  { id: "database-expert", name: "Database Expert", original_name: "Database expert" },
  { id: "website", name: "Website", original_name: "website" },
  { id: "mobile-app", name: "Mobile App", original_name: "mobile app" },
  { id: "cai", name: "CAI", original_name: "cai (E-Learning/Computer-Aided Instruction Systems)" },
  { id: "software-hardware", name: "Software/Hardware", original_name: "software/hardware" },
];

export function useBrowseTopics() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      // 1. Get all unique categories
      const { data: catData, error: catError } = await supabase
        .from("research_papers")
        .select("category")
        .neq("category", null)
        .neq("category", "");

      if (catError) {
        setCategories(DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          paper_count: 0,
          papers: [],
        })));
        setLoading(false);
        return;
      }

      // Get unique categories
      const uniqueCategories = [
        ...new Set(catData.map(row => row.category)),
      ];

      let cats = [];
      for (const category of uniqueCategories) {
        // Get top 3 most viewed papers for this category
        const { data: papers } = await supabase
          .from("research_papers")
          .select("id, title, abstract, year_published, views, authors")
          .eq("category", category)
          .order("views", { ascending: false })
          .order("uploaded_at", { ascending: false })
          .limit(3);

        // Get paper count for this category
        const { count } = await supabase
          .from("research_papers")
          .select("id", { count: "exact", head: true })
          .eq("category", category);

        cats.push({
          id: category
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-"),
          name: CATEGORY_MAP[category] || category,
          original_name: category,
          paper_count: count || 0,
          papers: (papers && papers.length > 0)
            ? papers.map(paper => ({
                id: paper.id,
                title: paper.title,
                authors: paper.authors || "Unknown Author",
                year: paper.year_published,
                abstract: paper.abstract,
                views: paper.views || 0,
              }))
            : [],
        });
      }

      // If no categories found, use defaults
      if (cats.length === 0) {
        cats = DEFAULT_CATEGORIES.map(cat => ({
          ...cat,
          paper_count: 0,
          papers: [],
        }));
      }

      setCategories(cats);
      setLoading(false);
    }
    fetchTopics();
  }, []);

  return { categories, loading };
}