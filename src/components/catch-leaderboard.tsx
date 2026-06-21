"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CatchRecord {
  id: string;
  length_cm: number;
  weight_kg?: number;
  notes?: string;
  tide_status?: string;
  wind_direction?: string;
  water_temperature_celsius?: number;
  fishing_period?: string;
  created_at: string;
  fish_species?: {
    common_name: string;
  };
  fishing_spots?: {
    name: string;
  };
}

export function CatchLeaderboard() {
  const [records, setRecords] = useState<CatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("catch_logs")
          .select(
            `
            id,
            length_cm,
            weight_kg,
            notes,
            tide_status,
            wind_direction,
            water_temperature_celsius,
            fishing_period,
            created_at,
            fish_species:fish_species_id(common_name),
            fishing_spots:fishing_spot_id(name)
          `
          )
          .order("length_cm", { ascending: false })
          .limit(5);

        if (fetchError) {
          throw fetchError;
        }

        setRecords(data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Query failed";
        setError(message);
        console.error("Leaderboard query error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCatches();
  }, []);

  if (loading) {
    return (
      <section aria-label="Catch Leaderboard" className="w-full">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Loading Leaderboard...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching top catches...
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Catch Leaderboard" className="w-full">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              Error: {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Catch Leaderboard" className="w-full bg-gradient-to-b from-blue-50 to-white py-12 dark:from-gray-900 dark:to-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-3">
          <h2 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-600">
            Top 5 Catches
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Biggest fish caught by all anglers
          </p>
        </div>

        {records.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-center text-gray-500 dark:text-gray-400">
                No catch records yet. Go fishing!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {records.map((record, index) => {
              const rank = index + 1;
              const badgeColor = {
                1: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                2: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
                3: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
              }[rank as keyof typeof badgeColor] || "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

              const fishName =
                (record.fish_species as any)?.common_name || "Unknown species";
              const spotName =
                (record.fishing_spots as any)?.name || "Unknown spot";
              const date = new Date(record.created_at);
              const dateStr = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });

              return (
                <Card
                  key={record.id}
                  className="overflow-hidden border-0 bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-gray-800"
                >
                  <div className="flex items-stretch">
                    <div
                      className={cn(
                        "flex w-20 flex-shrink-0 items-center justify-center font-bold text-white",
                        {
                          "bg-yellow-400 dark:bg-yellow-500": rank === 1,
                          "bg-gray-400 dark:bg-gray-600": rank === 2,
                          "bg-orange-400 dark:bg-orange-600": rank === 3,
                          "bg-blue-400 dark:bg-blue-600": rank > 3,
                        }
                      )}
                    >
                      <span className="text-3xl">#{rank}</span>
                    </div>

                    <div className="flex-grow p-6">
                      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {fishName}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {spotName}
                          </p>
                        </div>
                        <div className={cn("rounded-full px-4 py-1 text-sm font-semibold", badgeColor)}>
                          {record.length_cm} cm
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {record.weight_kg && (
                          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Weight
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {record.weight_kg} kg
                            </p>
                          </div>
                        )}
                        {record.water_temperature_celsius && (
                          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Water Temp
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {record.water_temperature_celsius}C
                            </p>
                          </div>
                        )}
                        {record.tide_status && (
                          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Tide
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {record.tide_status}
                            </p>
                          </div>
                        )}
                        {record.wind_direction && (
                          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Wind
                            </p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {record.wind_direction}
                            </p>
                          </div>
                        )}
                      </div>

                      {record.notes && (
                        <div className="mb-3 rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-2 dark:border-blue-600 dark:bg-blue-900/30">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Note: {record.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 text-xs text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                        {record.fishing_period && (
                          <span>Time: {record.fishing_period}</span>
                        )}
                        <span>Date: {dateStr}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-lg bg-blue-50 p-6 text-center dark:bg-blue-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-bold text-gray-900 dark:text-white">{records.length}</span> catch records
          </p>
        </div>
      </div>
    </section>
  );
}
