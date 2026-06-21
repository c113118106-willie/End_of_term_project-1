"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

const COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#6366f1",
];

interface SpotData    { id: string; name: string; count: number; }
interface SpeciesData { id: string; name: string; count: number; }
interface RigData     { name: string; count: number; }
interface RankData    { rank: number; fish: string; spot: string; length_cm: number; weight_kg: number | null; }

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AnalysisPage() {
  const [spots, setSpots] = useState<SpotData[]>([]);
  const [hoverSpot, setHoverSpot] = useState<number>(-1);
  const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);

  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [hoverSpecies, setHoverSpecies] = useState<number>(-1);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesData | null>(null);
  const [spotRigs, setSpotRigs] = useState<RigData[]>([]);
  const [fishRigs, setFishRigs] = useState<RigData[]>([]);
  const [rankings, setRankings] = useState<RankData[]>([]);
  const [loadingL2, setLoadingL2] = useState(false);

  useEffect(() => {
    supabase
      .from("catch_logs")
      .select("fishing_spot_id, fishing_spots(name)")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, { name: string; count: number }> = {};
        data.forEach((r: any) => {
          const id = r.fishing_spot_id;
          const name = r.fishing_spots?.name ?? "Unknown";
          if (!map[id]) map[id] = { name, count: 0 };
          map[id].count++;
        });
        setSpots(Object.entries(map).map(([id, v]) => ({ id, ...v })));
      });
  }, []);

  useEffect(() => {
    if (!selectedSpot) return;
    setLoadingL2(true);
    setSelectedSpecies(null);
    setFishRigs([]);

    Promise.all([
      supabase.from("catch_logs").select("fish_species_id, fish_species(common_name)").eq("fishing_spot_id", selectedSpot.id),
      supabase.from("catch_logs").select("fish_species_id").eq("fishing_spot_id", selectedSpot.id),
    ]).then(async ([speciesRes, catchRes]) => {
      const sm: Record<string, { name: string; count: number }> = {};
      (speciesRes.data ?? []).forEach((r: any) => {
        const id = r.fish_species_id;
        const name = r.fish_species?.common_name ?? "Unknown";
        if (!sm[id]) sm[id] = { name, count: 0 };
        sm[id].count++;
      });
      setSpeciesList(Object.entries(sm).map(([id, v]) => ({ id, ...v })));

      const speciesIds = [...new Set((catchRes.data ?? []).map((r: any) => r.fish_species_id))];
      if (speciesIds.length > 0) {
        const { data: rigData } = await supabase
          .from("fish_rig_mapping")
          .select("rigs(name)")
          .in("fish_species_id", speciesIds);
        const rm: Record<string, number> = {};
        (rigData ?? []).forEach((r: any) => {
          const name = r.rigs?.name ?? "Unknown";
          rm[name] = (rm[name] ?? 0) + 1;
        });
        setSpotRigs(Object.entries(rm).map(([name, count]) => ({ name, count })));
      } else {
        setSpotRigs([]);
      }

      const { data: rankData } = await supabase
        .from("catch_logs")
        .select("length_cm, weight_kg, fish_species(common_name), fishing_spots(name)")
        .eq("fishing_spot_id", selectedSpot.id)
        .order("length_cm", { ascending: false })
        .limit(5);
      setRankings((rankData ?? []).map((r: any, i: number) => ({
        rank: i + 1,
        fish: r.fish_species?.common_name ?? "Unknown",
        spot: r.fishing_spots?.name ?? "Unknown",
        length_cm: r.length_cm,
        weight_kg: r.weight_kg ?? null,
      })));

      setLoadingL2(false);
    });
  }, [selectedSpot]);

  useEffect(() => {
    if (!selectedSpecies) return;
    supabase.from("fish_rig_mapping").select("rigs(name)").eq("fish_species_id", selectedSpecies.id)
      .then(({ data }) => {
        const rm: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          const name = r.rigs?.name ?? "Unknown";
          rm[name] = (rm[name] ?? 0) + 1;
        });
        setFishRigs(Object.entries(rm).map(([name, count]) => ({ name, count })));
      });

    supabase.from("catch_logs")
      .select("length_cm, weight_kg, fish_species(common_name), fishing_spots(name)")
      .eq("fish_species_id", selectedSpecies.id)
      .eq("fishing_spot_id", selectedSpot!.id)
      .order("length_cm", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRankings((data ?? []).map((r: any, i: number) => ({
          rank: i + 1,
          fish: r.fish_species?.common_name ?? "Unknown",
          spot: r.fishing_spots?.name ?? "Unknown",
          length_cm: r.length_cm,
          weight_kg: r.weight_kg ?? null,
        })));
      });
  }, [selectedSpecies]);

  const rigData = selectedSpecies ? fishRigs : spotRigs;

  const spotPieData = spots.map((s, i) => ({
    ...s,
    fill: hoverSpot === i ? COLORS[i % COLORS.length] : COLORS[i % COLORS.length] + "cc",
    outerRadius: hoverSpot === i ? 145 : 130,
  }));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              Home
            </Link>
            <Link href="/leaderboard" className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
              Leaderboard
            </Link>
            <h1 className="text-xl font-bold">Analysis</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-16">

        {/* 第一層 */}
        <section>
          <h2 className="mb-2 text-2xl font-bold">Catch by Fishing Spot</h2>
          <p className="mb-8 text-sm text-muted-foreground">Click a spot card to explore details.</p>

          {spots.length === 0 ? (
            <p className="text-muted-foreground">No data yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie
                    data={spots}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {spots.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        opacity={hoverSpot === -1 || hoverSpot === i ? 1 : 0.5}
                        stroke={hoverSpot === i ? "#fff" : "none"}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} catches`, ""]} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {spots.map((spot, i) => (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedSpot(spot)}
                    onMouseEnter={() => setHoverSpot(i)}
                    onMouseLeave={() => setHoverSpot(-1)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                      selectedSpot?.id === spot.id
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border bg-card/60 hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-2 h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <p className="font-semibold text-sm">{spot.name}</p>
                    <p className="text-xs text-muted-foreground">{spot.count} catches</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 第二層 */}
        {selectedSpot && (
          <section className="space-y-10">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{selectedSpot.name}</h2>
              <button
                onClick={() => { setSelectedSpot(null); setSelectedSpecies(null); }}
                className="rounded-full border border-border px-3 py-1 text-xs hover:bg-muted transition-colors"
              >
                Clear
              </button>
            </div>

            {loadingL2 ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                  {/* 魚種圓餅 */}
                  <div className="rounded-2xl border border-border bg-card/60 p-6">
                    <h3 className="mb-4 font-semibold">Fish Species Distribution</h3>
                    {speciesList.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No data.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={speciesList}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            labelLine={false}
                            label={renderCustomLabel}
                          >
                            {speciesList.map((_, i) => (
                              <Cell
                                key={i}
                                fill={COLORS[i % COLORS.length]}
                                opacity={hoverSpecies === -1 || hoverSpecies === i ? 1 : 0.5}
                                stroke={hoverSpecies === i ? "#fff" : "none"}
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${v} catches`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* 釣組圓餅 */}
                  <div className="rounded-2xl border border-border bg-card/60 p-6">
                    <h3 className="mb-1 font-semibold">Rig Distribution</h3>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {selectedSpecies ? `Rigs for: ${selectedSpecies.name}` : `Rigs for: ${selectedSpot.name}`}
                    </p>
                    {rigData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No rig data.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={rigData}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            labelLine={false}
                            label={renderCustomLabel}
                          >
                            {rigData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => [`${v} records`, ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 魚種互動方塊 */}
                <div>
                  <h3 className="mb-3 font-semibold">Fish Species</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {speciesList.map((sp, i) => (
                      <button
                        key={sp.id}
                        onClick={() => setSelectedSpecies(selectedSpecies?.id === sp.id ? null : sp)}
                        onMouseEnter={() => setHoverSpecies(i)}
                        onMouseLeave={() => setHoverSpecies(-1)}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                          selectedSpecies?.id === sp.id
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border bg-card/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-2 h-3 w-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <p className="font-semibold text-sm">{sp.name}</p>
                        <p className="text-xs text-muted-foreground">{sp.count} catches</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 排行榜 */}
                <div>
                  <h3 className="mb-3 font-semibold">
                    {selectedSpecies ? `Top Catches · ${selectedSpecies.name}` : `Top Catches · ${selectedSpot.name}`}
                  </h3>
                  {rankings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No records.</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rank</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fish</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spot</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Length</th>
                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankings.map((r) => (
                            <tr key={r.rank} className="border-t border-border hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-bold">
                                {r.rank === 1 ? "Gold" : r.rank === 2 ? "Silver" : r.rank === 3 ? "Bronze" : `#${r.rank}`}
                              </td>
                              <td className="px-4 py-3 font-medium">{r.fish}</td>
                              <td className="px-4 py-3 text-muted-foreground">{r.spot}</td>
                              <td className="px-4 py-3">{r.length_cm} cm</td>
                              <td className="px-4 py-3">{r.weight_kg ? `${r.weight_kg} kg` : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}