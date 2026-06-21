"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  season: string;
  size_description: string;
}

export default function SpeciesPage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("fish_species").select("*").then(({ data }) => {
      setSpecies(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">首頁</Link>
            <Link href="/spots" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">熱門釣點</Link>
            <h1 className="text-xl font-bold">魚種圖鑑</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="mb-2 text-2xl font-bold">台灣魚種指南</h2>
        <p className="mb-8 text-sm text-muted-foreground">點擊特定魚種，即可查看推薦的餌料與釣組搭配組合。</p>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-card/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {species.map((sp) => (
              <Link
                key={sp.id}
                href={`/species/${sp.id}`}
                className="group rounded-2xl border border-border bg-card/60 p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50"
              >
                <h3 className="mb-1 text-lg font-bold group-hover:text-primary transition-colors">{sp.common_name}</h3>
                {sp.scientific_name && <p className="mb-2 text-xs italic text-muted-foreground">{sp.scientific_name}</p>}
                {sp.season && <p className="text-xs text-muted-foreground">適合季節：{sp.season}</p>}
                {sp.size_description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sp.size_description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}