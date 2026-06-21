"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface Species { id: string; common_name: string; scientific_name: string; season: string; size_description: string; }
interface BaitEntry { name: string; bait_type: string; effectiveness: string; }
interface RigEntry { name: string; binding_description: string; suitability: string; }
interface SpotEntry { id: string; name: string; abundance: string; best_season: string; }

export default function SpeciesDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [species, setSpecies] = useState<Species | null>(null);
  const [baits, setBaits] = useState<BaitEntry[]>([]);
  const [rigs, setRigs] = useState<RigEntry[]>([]);
  const [spots, setSpots] = useState<SpotEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [spRes, baitRes, rigRes, spotRes] = await Promise.all([
        supabase.from("fish_species").select("*").eq("id", id).single(),
        supabase.from("fish_bait_mapping").select("baits(name, bait_type), effectiveness").eq("fish_species_id", id),
        supabase.from("fish_rig_mapping").select("rigs(name, binding_description), suitability").eq("fish_species_id", id),
        supabase.from("spot_fish_mapping").select("fishing_spots(id, name), abundance, best_season").eq("fish_species_id", id),
      ]);
      setSpecies(spRes.data);
      setBaits((baitRes.data ?? []).map((b: any) => ({ name: b.baits?.name, bait_type: b.baits?.bait_type, effectiveness: b.effectiveness })));
      setRigs((rigRes.data ?? []).map((r: any) => ({ name: r.rigs?.name, binding_description: r.rigs?.binding_description, suitability: r.suitability })));
      setSpots((spotRes.data ?? []).map((s: any) => ({ id: s.fishing_spots?.id, name: s.fishing_spots?.name, abundance: s.abundance, best_season: s.best_season })));
      setLoading(false);
    }
    load();
  }, [id]);

  const baitTypeColor: Record<string, string> = {
    "假餌": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "活餌": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    "粉餌": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!species) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Species not found.</div>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">Home</Link>
            <Link href="/species" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">Species</Link>
            <h1 className="text-xl font-bold">{species.common_name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-10">

        {/* 基本資訊 */}
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="mb-1 text-2xl font-bold">{species.common_name}</h2>
          {species.scientific_name && <p className="mb-3 text-sm italic text-muted-foreground">{species.scientific_name}</p>}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {species.season && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Season</p>
                <p className="font-semibold">{species.season}</p>
              </div>
            )}
            {species.size_description && (
              <div className="rounded-xl bg-muted/50 p-3 col-span-2">
                <p className="text-xs text-muted-foreground">Size</p>
                <p className="text-sm">{species.size_description}</p>
              </div>
            )}
          </div>
        </section>

        {/* 推薦餌料 */}
        <section>
          <h3 className="mb-4 text-lg font-bold">Recommended Baits</h3>
          {baits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bait data.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {baits.map((b) => (
                <div key={b.name} className="rounded-2xl border border-border bg-card/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold">{b.name}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${baitTypeColor[b.bait_type] ?? ""}`}>
                      {b.bait_type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Effectiveness: {b.effectiveness}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 推薦釣組 */}
        <section>
          <h3 className="mb-4 text-lg font-bold">Recommended Rigs</h3>
          {rigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rig data.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {rigs.map((r) => (
                <div key={r.name} className="rounded-2xl border border-border bg-card/60 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold">{r.name}</p>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{r.suitability}</span>
                  </div>
                  {r.binding_description && <p className="text-xs text-muted-foreground">{r.binding_description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 可在哪些釣點找到 */}
        <section>
          <h3 className="mb-4 text-lg font-bold">Where to Find This Fish</h3>
          {spots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spot data.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {spots.map((s) => (
                <Link
                  key={s.id}
                  href={`/spots/${s.id}`}
                  className="rounded-2xl border border-border bg-card/60 p-4 transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-md"
                >
                  <p className="font-semibold">{s.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Abundance: {s.abundance}</p>
                  <p className="text-xs text-muted-foreground">Best season: {s.best_season}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}