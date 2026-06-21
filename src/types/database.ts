export type Question = {
  id: string;
  content: string;
  likes: number;
  created_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  content: string;
  created_at: string;
};

// 釣魚相關類型
export type FishingSpot = {
  id: string;
  name: string;
  location: string;
  coordinates: string; // point type
  water_type: "海" | "溪" | "池";
  description?: string;
  created_at: string;
  updated_at: string;
};

export type FishSpecies = {
  id: string;
  common_name: string;
  scientific_name?: string;
  season?: string;
  size_description?: string;
  created_at: string;
  updated_at: string;
};

export type CatchLog = {
  id: string;
  user_id: string;
  fishing_spot_id: string;
  fish_species_id: string;
  bait_id?: string;
  length_cm?: number;
  weight_kg?: number;
  photo_url?: string;
  notes?: string;
  tide_status?: string;
  wind_direction?: string;
  water_temperature_celsius?: number;
  fishing_period?: string;
  created_at: string;
  updated_at: string;
};

export type CatchLogWithDetails = CatchLog & {
  fish_species?: FishSpecies;
  fishing_spots?: FishingSpot;
};
