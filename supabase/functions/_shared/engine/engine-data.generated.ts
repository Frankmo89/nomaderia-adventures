// AUTO-GENERATED from web/engine_data.json (Frankmo89/us-parks-recommender @ f0dd8e27d7bfecfe92c84e013072eec3ce606a77) by scripts/sync-engine.ts — DO NOT EDIT BY HAND.
// engine_version 0.2.0 · content_hash 60db29d69bacc28a47e8070ee70f2bace63281806ae119f0206b5d65f393cf7d
// Re-sync: npm run sync:engine

import type { EngineData } from "./engine.ts";

export const ENGINE_DATA: EngineData = {
  "engine_version": "0.2.0",
  "content_hash": "60db29d69bacc28a47e8070ee70f2bace63281806ae119f0206b5d65f393cf7d",
  "weights": {
    "W_CONTENT": 0.55,
    "W_DAYS": 0.18,
    "W_DIFF": 0.14,
    "W_BUDGET": 0.08,
    "CROWD_PENALTY": 0.12,
    "W_MONTH_PENALTY": 0.35,
    "TIE_EPSILON": 0.001,
    "MONTH_DISTANCE_MAX": 6,
    "DRIVE_MPH": 65,
    "DRIVE_DETOUR": 1.25,
    "EARTH_RADIUS_MILES": 3958.8
  },
  "vocab": {
    "biomes": [
      "alpine",
      "canyon",
      "cave",
      "chaparral",
      "coast",
      "desert",
      "forest",
      "island",
      "prairie",
      "rainforest",
      "tundra",
      "urban",
      "volcano",
      "wetland"
    ],
    "tags": [
      "4x4",
      "archaeology",
      "backpacking",
      "beach",
      "bears",
      "biking",
      "birding",
      "boardwalk",
      "boat",
      "camping",
      "climbing",
      "easy_walk",
      "family",
      "fishing",
      "geothermal",
      "giant_trees",
      "glacier",
      "hiking",
      "history",
      "hot_springs",
      "kayak",
      "paleontology",
      "photography",
      "sand",
      "scenic_drive",
      "snorkeling",
      "stargazing",
      "sunrise",
      "water",
      "waterfalls",
      "wilderness",
      "wildflowers",
      "wildlife",
      "winter"
    ],
    "tag_idf": {
      "4x4": 3.4657359027997265,
      "archaeology": 3.4657359027997265,
      "backpacking": 1.2685113254635072,
      "beach": 3.4657359027997265,
      "bears": 3.4657359027997265,
      "biking": 3.4657359027997265,
      "birding": 3.060270794691562,
      "boardwalk": 3.4657359027997265,
      "boat": 1.8562979903656263,
      "camping": 1.9616585060234524,
      "climbing": 2.5494451709255714,
      "easy_walk": 2.0794415416798357,
      "family": 0.39768296766610944,
      "fishing": 3.4657359027997265,
      "geothermal": 3.4657359027997265,
      "giant_trees": 3.4657359027997265,
      "glacier": 3.4657359027997265,
      "hiking": 0.20763936477824455,
      "history": 2.367123614131617,
      "hot_springs": 3.060270794691562,
      "kayak": 3.4657359027997265,
      "paleontology": 3.060270794691562,
      "photography": 1.067840630001356,
      "sand": 3.060270794691562,
      "scenic_drive": 0.6325225587435105,
      "snorkeling": 3.060270794691562,
      "stargazing": 1.4508328822574619,
      "sunrise": 3.4657359027997265,
      "water": 1.5939337258981352,
      "waterfalls": 2.5494451709255714,
      "wilderness": 2.367123614131617,
      "wildflowers": 3.4657359027997265,
      "wildlife": 0.7248958788745256,
      "winter": 3.4657359027997265
    }
  },
  "ordinals": {
    "days": {
      "1": 0,
      "2-3": 1,
      "4-7": 2,
      "7+": 3
    },
    "difficulty": {
      "easy": 0,
      "moderate": 1,
      "challenging": 2
    },
    "budget": {
      "low": 0,
      "mid": 1,
      "high": 2
    },
    "crowd": {
      "low": 0,
      "medium": 1,
      "high": 2
    }
  },
  "catalog": [
    {
      "park_code": "acad",
      "name": "Acadia National Park",
      "states": "ME",
      "biomes": [
        "coast",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "wildlife",
        "camping"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 44.35,
      "lon": -68.21,
      "nps_url": "https://www.nps.gov/acad/"
    },
    {
      "park_code": "npsa",
      "name": "National Park of American Samoa",
      "states": "AS",
      "biomes": [
        "rainforest"
      ],
      "tags": [
        "hiking",
        "coast",
        "wildlife",
        "family"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "5",
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": -14.26,
      "lon": -170.68,
      "nps_url": "https://www.nps.gov/npsa/"
    },
    {
      "park_code": "arch",
      "name": "Arches National Park",
      "states": "UT",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "stargazing",
        "photography"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "3",
        "4",
        "5",
        "9",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 38.68,
      "lon": -109.57,
      "nps_url": "https://www.nps.gov/arch/"
    },
    {
      "park_code": "badl",
      "name": "Badlands National Park",
      "states": "SD",
      "biomes": [
        "prairie"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "wildlife",
        "family",
        "stargazing",
        "paleontology"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 43.75,
      "lon": -102.5,
      "nps_url": "https://www.nps.gov/badl/"
    },
    {
      "park_code": "bibe",
      "name": "Big Bend National Park",
      "states": "TX",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "backpacking",
        "stargazing",
        "wildlife",
        "scenic_drive",
        "camping"
      ],
      "difficulty": "moderate",
      "days_needed": "4-7",
      "crowd": "low",
      "budget_tier": "mid",
      "best_months": [
        "2",
        "3",
        "4",
        "10",
        "11"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 29.25,
      "lon": -103.25,
      "nps_url": "https://www.nps.gov/bibe/"
    },
    {
      "park_code": "bisc",
      "name": "Biscayne National Park",
      "states": "FL",
      "biomes": [
        "coast"
      ],
      "tags": [
        "water",
        "wildlife",
        "family",
        "boat"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "12"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 25.65,
      "lon": -80.08,
      "nps_url": "https://www.nps.gov/bisc/"
    },
    {
      "park_code": "blca",
      "name": "Black Canyon of the Gunnison National Park",
      "states": "CO",
      "biomes": [
        "canyon"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "photography",
        "stargazing"
      ],
      "difficulty": "moderate",
      "days_needed": "1",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.57,
      "lon": -107.72,
      "nps_url": "https://www.nps.gov/blca/"
    },
    {
      "park_code": "brca",
      "name": "Bryce Canyon National Park",
      "states": "UT",
      "biomes": [
        "canyon"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "photography",
        "stargazing"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 37.59,
      "lon": -112.19,
      "nps_url": "https://www.nps.gov/brca/"
    },
    {
      "park_code": "cany",
      "name": "Canyonlands National Park",
      "states": "UT",
      "biomes": [
        "canyon",
        "desert"
      ],
      "tags": [
        "hiking",
        "backpacking",
        "scenic_drive",
        "stargazing",
        "4x4"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "3",
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.2,
      "lon": -109.93,
      "nps_url": "https://www.nps.gov/cany/"
    },
    {
      "park_code": "care",
      "name": "Capitol Reef National Park",
      "states": "UT",
      "biomes": [
        "canyon",
        "desert"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "stargazing"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.2,
      "lon": -111.17,
      "nps_url": "https://www.nps.gov/care/"
    },
    {
      "park_code": "cave",
      "name": "Carlsbad Caverns National Park",
      "states": "NM",
      "biomes": [
        "cave"
      ],
      "tags": [
        "family",
        "wildlife",
        "easy_walk"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 32.17,
      "lon": -104.44,
      "nps_url": "https://www.nps.gov/cave/"
    },
    {
      "park_code": "chis",
      "name": "Channel Islands National Park",
      "states": "CA",
      "biomes": [
        "island",
        "coast"
      ],
      "tags": [
        "hiking",
        "wildlife",
        "water",
        "boat",
        "backpacking",
        "kayak"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "mid",
      "best_months": [
        "4",
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 34.01,
      "lon": -119.42,
      "nps_url": "https://www.nps.gov/chis/"
    },
    {
      "park_code": "cong",
      "name": "Congaree National Park",
      "states": "SC",
      "biomes": [
        "wetland"
      ],
      "tags": [
        "hiking",
        "family",
        "wildlife",
        "water",
        "boardwalk"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 33.78,
      "lon": -80.78,
      "nps_url": "https://www.nps.gov/cong/"
    },
    {
      "park_code": "crla",
      "name": "Crater Lake National Park",
      "states": "OR",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "photography",
        "winter"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 42.94,
      "lon": -122.1,
      "nps_url": "https://www.nps.gov/crla/"
    },
    {
      "park_code": "cuva",
      "name": "Cuyahoga Valley National Park",
      "states": "OH",
      "biomes": [
        "forest"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "easy_walk",
        "biking"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 41.24,
      "lon": -81.55,
      "nps_url": "https://www.nps.gov/cuva/"
    },
    {
      "park_code": "deva",
      "name": "Death Valley National Park",
      "states": "CA",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "stargazing",
        "photography",
        "family"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "1",
        "2",
        "3",
        "11",
        "12"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 36.24,
      "lon": -116.82,
      "nps_url": "https://www.nps.gov/deva/"
    },
    {
      "park_code": "dena",
      "name": "Denali National Park",
      "states": "AK",
      "biomes": [
        "tundra",
        "alpine"
      ],
      "tags": [
        "wildlife",
        "scenic_drive",
        "hiking",
        "backpacking",
        "photography"
      ],
      "difficulty": "challenging",
      "days_needed": "4-7",
      "crowd": "medium",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 63.33,
      "lon": -150.5,
      "nps_url": "https://www.nps.gov/dena/"
    },
    {
      "park_code": "drto",
      "name": "Dry Tortugas National Park",
      "states": "FL",
      "biomes": [
        "island"
      ],
      "tags": [
        "water",
        "wildlife",
        "boat",
        "history",
        "snorkeling"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "12"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 24.63,
      "lon": -82.87,
      "nps_url": "https://www.nps.gov/drto/"
    },
    {
      "park_code": "ever",
      "name": "Everglades National Park",
      "states": "FL",
      "biomes": [
        "wetland"
      ],
      "tags": [
        "wildlife",
        "water",
        "hiking",
        "family",
        "boat",
        "birding"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "1",
        "2",
        "3",
        "12"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 25.32,
      "lon": -80.93,
      "nps_url": "https://www.nps.gov/ever/"
    },
    {
      "park_code": "gaar",
      "name": "Gates of the Arctic National Park",
      "states": "AK",
      "biomes": [
        "tundra"
      ],
      "tags": [
        "backpacking",
        "wildlife",
        "wilderness",
        "remote"
      ],
      "difficulty": "challenging",
      "days_needed": "7+",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 67.78,
      "lon": -153.3,
      "nps_url": "https://www.nps.gov/gaar/"
    },
    {
      "park_code": "jeff",
      "name": "Gateway Arch National Park",
      "states": "MO",
      "biomes": [
        "urban"
      ],
      "tags": [
        "family",
        "history",
        "easy_walk"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "high",
      "budget_tier": "low",
      "best_months": [
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.63,
      "lon": -90.19,
      "nps_url": "https://www.nps.gov/jeff/"
    },
    {
      "park_code": "glac",
      "name": "Glacier National Park",
      "states": "MT",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "wildlife",
        "backpacking",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "4-7",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 48.76,
      "lon": -113.79,
      "nps_url": "https://www.nps.gov/glac/"
    },
    {
      "park_code": "glba",
      "name": "Glacier Bay National Park",
      "states": "AK",
      "biomes": [
        "coast"
      ],
      "tags": [
        "wildlife",
        "boat",
        "water",
        "photography",
        "remote"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 58.5,
      "lon": -137,
      "nps_url": "https://www.nps.gov/glba/"
    },
    {
      "park_code": "grca",
      "name": "Grand Canyon National Park",
      "states": "AZ",
      "biomes": [
        "canyon"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "photography",
        "backpacking"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 36.06,
      "lon": -112.14,
      "nps_url": "https://www.nps.gov/grca/"
    },
    {
      "park_code": "grte",
      "name": "Grand Teton National Park",
      "states": "WY",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "wildlife",
        "scenic_drive",
        "backpacking",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 43.73,
      "lon": -110.8,
      "nps_url": "https://www.nps.gov/grte/"
    },
    {
      "park_code": "grba",
      "name": "Great Basin National Park",
      "states": "NV",
      "biomes": [
        "alpine"
      ],
      "tags": [
        "hiking",
        "stargazing",
        "cave",
        "scenic_drive",
        "low_crowd"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 38.98,
      "lon": -114.3,
      "nps_url": "https://www.nps.gov/grba/"
    },
    {
      "park_code": "grsa",
      "name": "Great Sand Dunes National Park",
      "states": "CO",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "family",
        "stargazing",
        "sand",
        "photography"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 37.73,
      "lon": -105.51,
      "nps_url": "https://www.nps.gov/grsa/"
    },
    {
      "park_code": "grsm",
      "name": "Great Smoky Mountains National Park",
      "states": "TN",
      "biomes": [
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "wildlife",
        "waterfalls",
        "camping"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "low",
      "best_months": [
        "4",
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 35.68,
      "lon": -83.53,
      "nps_url": "https://www.nps.gov/grsm/"
    },
    {
      "park_code": "gumo",
      "name": "Guadalupe Mountains National Park",
      "states": "TX",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "backpacking",
        "low_crowd"
      ],
      "difficulty": "challenging",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "10",
        "11"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 31.92,
      "lon": -104.87,
      "nps_url": "https://www.nps.gov/gumo/"
    },
    {
      "park_code": "hale",
      "name": "Haleakala National Park",
      "states": "HI",
      "biomes": [
        "volcano"
      ],
      "tags": [
        "hiking",
        "sunrise",
        "scenic_drive",
        "stargazing"
      ],
      "difficulty": "moderate",
      "days_needed": "1",
      "crowd": "high",
      "budget_tier": "high",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 20.72,
      "lon": -156.17,
      "nps_url": "https://www.nps.gov/hale/"
    },
    {
      "park_code": "havo",
      "name": "Hawaii Volcanoes National Park",
      "states": "HI",
      "biomes": [
        "volcano"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "photography"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "high",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 19.38,
      "lon": -155.2,
      "nps_url": "https://www.nps.gov/havo/"
    },
    {
      "park_code": "hosp",
      "name": "Hot Springs National Park",
      "states": "AR",
      "biomes": [
        "forest"
      ],
      "tags": [
        "family",
        "easy_walk",
        "history",
        "hot_springs"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 34.51,
      "lon": -93.05,
      "nps_url": "https://www.nps.gov/hosp/"
    },
    {
      "park_code": "indu",
      "name": "Indiana Dunes National Park",
      "states": "IN",
      "biomes": [
        "coast",
        "prairie"
      ],
      "tags": [
        "hiking",
        "family",
        "easy_walk",
        "birding"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 41.65,
      "lon": -87.07,
      "nps_url": "https://www.nps.gov/indu/"
    },
    {
      "park_code": "isro",
      "name": "Isle Royale National Park",
      "states": "MI",
      "biomes": [
        "island",
        "forest"
      ],
      "tags": [
        "backpacking",
        "hiking",
        "wildlife",
        "water",
        "boat",
        "wilderness"
      ],
      "difficulty": "challenging",
      "days_needed": "4-7",
      "crowd": "low",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 48.1,
      "lon": -88.55,
      "nps_url": "https://www.nps.gov/isro/"
    },
    {
      "park_code": "jotr",
      "name": "Joshua Tree National Park",
      "states": "CA",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "climbing",
        "stargazing",
        "camping",
        "family",
        "photography"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "10",
        "11",
        "12"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 33.79,
      "lon": -115.9,
      "nps_url": "https://www.nps.gov/jotr/"
    },
    {
      "park_code": "katm",
      "name": "Katmai National Park",
      "states": "AK",
      "biomes": [
        "tundra"
      ],
      "tags": [
        "wildlife",
        "bears",
        "boat",
        "photography",
        "remote"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": true,
      "lat": 58.5,
      "lon": -155,
      "nps_url": "https://www.nps.gov/katm/"
    },
    {
      "park_code": "kefj",
      "name": "Kenai Fjords National Park",
      "states": "AK",
      "biomes": [
        "coast"
      ],
      "tags": [
        "wildlife",
        "boat",
        "hiking",
        "water",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 59.92,
      "lon": -149.65,
      "nps_url": "https://www.nps.gov/kefj/"
    },
    {
      "park_code": "kica",
      "name": "Kings Canyon National Park",
      "states": "CA",
      "biomes": [
        "forest",
        "alpine"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "backpacking",
        "waterfalls",
        "family"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 36.8,
      "lon": -118.55,
      "nps_url": "https://www.nps.gov/kica/"
    },
    {
      "park_code": "kova",
      "name": "Kobuk Valley National Park",
      "states": "AK",
      "biomes": [
        "tundra"
      ],
      "tags": [
        "wilderness",
        "remote",
        "wildlife",
        "backpacking"
      ],
      "difficulty": "challenging",
      "days_needed": "7+",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 67.55,
      "lon": -159.28,
      "nps_url": "https://www.nps.gov/kova/"
    },
    {
      "park_code": "lacl",
      "name": "Lake Clark National Park",
      "states": "AK",
      "biomes": [
        "tundra"
      ],
      "tags": [
        "wildlife",
        "wilderness",
        "water",
        "remote",
        "backpacking"
      ],
      "difficulty": "challenging",
      "days_needed": "4-7",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 60.97,
      "lon": -153.42,
      "nps_url": "https://www.nps.gov/lacl/"
    },
    {
      "park_code": "lavo",
      "name": "Lassen Volcanic National Park",
      "states": "CA",
      "biomes": [
        "volcano",
        "forest"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "camping"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 40.49,
      "lon": -121.51,
      "nps_url": "https://www.nps.gov/lavo/"
    },
    {
      "park_code": "maca",
      "name": "Mammoth Cave National Park",
      "states": "KY",
      "biomes": [
        "cave"
      ],
      "tags": [
        "family",
        "hiking",
        "easy_walk",
        "history"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "4",
        "5",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 37.18,
      "lon": -86.1,
      "nps_url": "https://www.nps.gov/maca/"
    },
    {
      "park_code": "meve",
      "name": "Mesa Verde National Park",
      "states": "CO",
      "biomes": [
        "canyon"
      ],
      "tags": [
        "family",
        "history",
        "scenic_drive",
        "archaeology",
        "hiking"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 37.18,
      "lon": -108.49,
      "nps_url": "https://www.nps.gov/meve/"
    },
    {
      "park_code": "mora",
      "name": "Mount Rainier National Park",
      "states": "WA",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "wildflowers",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 46.85,
      "lon": -121.75,
      "nps_url": "https://www.nps.gov/mora/"
    },
    {
      "park_code": "neri",
      "name": "New River Gorge National Park",
      "states": "WV",
      "biomes": [
        "forest"
      ],
      "tags": [
        "hiking",
        "climbing",
        "water",
        "scenic_drive",
        "family"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.07,
      "lon": -81.08,
      "nps_url": "https://www.nps.gov/neri/"
    },
    {
      "park_code": "noca",
      "name": "North Cascades National Park",
      "states": "WA",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "backpacking",
        "low_crowd",
        "photography",
        "wildlife"
      ],
      "difficulty": "challenging",
      "days_needed": "4-7",
      "crowd": "low",
      "budget_tier": "mid",
      "best_months": [
        "7",
        "8",
        "9"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 48.7,
      "lon": -121.2,
      "nps_url": "https://www.nps.gov/noca/"
    },
    {
      "park_code": "olym",
      "name": "Olympic National Park",
      "states": "WA",
      "biomes": [
        "rainforest",
        "coast"
      ],
      "tags": [
        "hiking",
        "hot_springs",
        "backpacking",
        "family"
      ],
      "difficulty": "moderate",
      "days_needed": "4-7",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 47.8,
      "lon": -123.7,
      "nps_url": "https://www.nps.gov/olym/"
    },
    {
      "park_code": "pefo",
      "name": "Petrified Forest National Park",
      "states": "AZ",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "paleontology"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "5",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 35.07,
      "lon": -109.78,
      "nps_url": "https://www.nps.gov/pefo/"
    },
    {
      "park_code": "pinn",
      "name": "Pinnacles National Park",
      "states": "CA",
      "biomes": [
        "chaparral"
      ],
      "tags": [
        "hiking",
        "climbing",
        "wildlife",
        "family",
        "cave"
      ],
      "difficulty": "moderate",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "2",
        "3",
        "4",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 36.48,
      "lon": -121.16,
      "nps_url": "https://www.nps.gov/pinn/"
    },
    {
      "park_code": "redw",
      "name": "Redwood National Park",
      "states": "CA",
      "biomes": [
        "rainforest",
        "coast"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "wildlife"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 41.3,
      "lon": -124,
      "nps_url": "https://www.nps.gov/redw/"
    },
    {
      "park_code": "romo",
      "name": "Rocky Mountain National Park",
      "states": "CO",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "wildlife",
        "family",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 40.4,
      "lon": -105.58,
      "nps_url": "https://www.nps.gov/romo/"
    },
    {
      "park_code": "sagu",
      "name": "Saguaro National Park",
      "states": "AZ",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "family",
        "stargazing",
        "easy_walk"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "11",
        "12"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 32.25,
      "lon": -110.5,
      "nps_url": "https://www.nps.gov/sagu/"
    },
    {
      "park_code": "seki",
      "name": "Sequoia National Park",
      "states": "CA",
      "biomes": [
        "forest",
        "alpine"
      ],
      "tags": [
        "hiking",
        "family",
        "scenic_drive",
        "giant_trees"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 36.49,
      "lon": -118.56,
      "nps_url": "https://www.nps.gov/seki/"
    },
    {
      "park_code": "shen",
      "name": "Shenandoah National Park",
      "states": "VA",
      "biomes": [
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "waterfalls",
        "camping"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "low",
      "best_months": [
        "4",
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 38.53,
      "lon": -78.35,
      "nps_url": "https://www.nps.gov/shen/"
    },
    {
      "park_code": "thro",
      "name": "Theodore Roosevelt National Park",
      "states": "ND",
      "biomes": [
        "prairie"
      ],
      "tags": [
        "hiking",
        "wildlife",
        "scenic_drive",
        "family",
        "low_crowd"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 46.97,
      "lon": -103.45,
      "nps_url": "https://www.nps.gov/thro/"
    },
    {
      "park_code": "viis",
      "name": "Virgin Islands National Park",
      "states": "VI",
      "biomes": [
        "coast"
      ],
      "tags": [
        "water",
        "hiking",
        "family",
        "snorkeling",
        "beach"
      ],
      "difficulty": "easy",
      "days_needed": "2-3",
      "crowd": "medium",
      "budget_tier": "high",
      "best_months": [
        "1",
        "2",
        "3",
        "4",
        "12"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 18.33,
      "lon": -64.73,
      "nps_url": "https://www.nps.gov/viis/"
    },
    {
      "park_code": "voya",
      "name": "Voyageurs National Park",
      "states": "MN",
      "biomes": [
        "forest"
      ],
      "tags": [
        "water",
        "boat",
        "wildlife",
        "camping",
        "fishing"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "low",
      "budget_tier": "mid",
      "best_months": [
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 48.5,
      "lon": -92.88,
      "nps_url": "https://www.nps.gov/voya/"
    },
    {
      "park_code": "whsa",
      "name": "White Sands National Park",
      "states": "NM",
      "biomes": [
        "desert"
      ],
      "tags": [
        "hiking",
        "family",
        "sand",
        "photography",
        "stargazing"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "medium",
      "budget_tier": "low",
      "best_months": [
        "3",
        "4",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 32.78,
      "lon": -106.17,
      "nps_url": "https://www.nps.gov/whsa/"
    },
    {
      "park_code": "wica",
      "name": "Wind Cave National Park",
      "states": "SD",
      "biomes": [
        "prairie",
        "cave"
      ],
      "tags": [
        "wildlife",
        "hiking",
        "family"
      ],
      "difficulty": "easy",
      "days_needed": "1",
      "crowd": "low",
      "budget_tier": "low",
      "best_months": [
        "5",
        "6",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 43.57,
      "lon": -103.48,
      "nps_url": "https://www.nps.gov/wica/"
    },
    {
      "park_code": "wrst",
      "name": "Wrangell-St. Elias National Park",
      "states": "AK",
      "biomes": [
        "alpine"
      ],
      "tags": [
        "wilderness",
        "backpacking",
        "remote",
        "glacier",
        "wildlife"
      ],
      "difficulty": "challenging",
      "days_needed": "7+",
      "crowd": "low",
      "budget_tier": "high",
      "best_months": [
        "6",
        "7",
        "8"
      ],
      "remote": true,
      "permit_likely": false,
      "lat": 61,
      "lon": -142,
      "nps_url": "https://www.nps.gov/wrst/"
    },
    {
      "park_code": "yell",
      "name": "Yellowstone National Park",
      "states": "WY",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "wildlife",
        "scenic_drive",
        "family",
        "hiking",
        "geothermal",
        "camping"
      ],
      "difficulty": "easy",
      "days_needed": "4-7",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "7",
        "8",
        "9"
      ],
      "remote": false,
      "permit_likely": false,
      "lat": 44.6,
      "lon": -110.5,
      "nps_url": "https://www.nps.gov/yell/"
    },
    {
      "park_code": "yose",
      "name": "Yosemite National Park",
      "states": "CA",
      "biomes": [
        "alpine",
        "forest"
      ],
      "tags": [
        "hiking",
        "scenic_drive",
        "family",
        "waterfalls",
        "backpacking",
        "climbing",
        "photography"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "5",
        "6",
        "7",
        "8",
        "9",
        "10"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 37.75,
      "lon": -119.6,
      "nps_url": "https://www.nps.gov/yose/"
    },
    {
      "park_code": "zion",
      "name": "Zion National Park",
      "states": "UT",
      "biomes": [
        "canyon"
      ],
      "tags": [
        "hiking",
        "family",
        "photography",
        "scenic_drive",
        "permits"
      ],
      "difficulty": "moderate",
      "days_needed": "2-3",
      "crowd": "high",
      "budget_tier": "mid",
      "best_months": [
        "3",
        "4",
        "5",
        "10",
        "11"
      ],
      "remote": false,
      "permit_likely": true,
      "lat": 37.3,
      "lon": -113.05,
      "nps_url": "https://www.nps.gov/zion/"
    }
  ]
};
