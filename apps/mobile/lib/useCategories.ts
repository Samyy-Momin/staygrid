import { useState, useEffect } from "react";
import { MapPin, Star, Tent, Droplet, Users, Dog, Sparkles, Tag } from "lucide-react-native";
import { getApiUrl } from "./config";

const API_URL = getApiUrl();

export interface CategoryItem {
  id: string | number;
  name: string;
  filterKey: string;
  imageUrl?: string | null;
  image?: string | null;
  Icon?: any;
  color?: string;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "cat_loc", name: "Location", Icon: MapPin, color: "#0066CC", filterKey: "location" },
  { id: "cat_featured", name: "Featured", Icon: Sparkles, color: "#F59E0B", filterKey: "featured" },
  { id: "cat_cancelled", name: "Cancellation Deals", Icon: Tag, color: "#EF4444", filterKey: "cancelled" },
  { id: "cat_turf", name: "Turf", Icon: Tent, color: "#10B981", filterKey: "hasTurf" },
  { id: "cat_pool", name: "Big Pools", Icon: Droplet, color: "#0066CC", filterKey: "hasPool" },
  { id: "cat_couple", name: "Couple Friendly", Icon: Users, color: "#f43f5e", filterKey: "isCoupleFriendly" },
  { id: "cat_pet", name: "Pet Friendly", Icon: Dog, color: "#f59e0b", filterKey: "isPetFriendly" },
];

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: CategoryItem[] = data.map((c) => {
            let IconComponent = MapPin;
            if (c.filterKey === "featured") IconComponent = Sparkles;
            else if (c.filterKey === "cancelled") IconComponent = Tag;
            else if (c.filterKey === "hasTurf") IconComponent = Tent;
            else if (c.filterKey === "hasPool" || c.name === "Big Pools") IconComponent = Droplet;
            else if (c.filterKey === "isCoupleFriendly") IconComponent = Users;
            else if (c.filterKey === "isPetFriendly") IconComponent = Dog;
            else if (c.filterKey === "sortBy=rating") IconComponent = Star;

            const rawImg = c.imageUrl || c.image || null;
            return {
              id: c.id,
              name: c.name,
              filterKey: c.filterKey,
              imageUrl: rawImg,
              Icon: IconComponent,
              color: "#0066CC",
            };
          });

          // Ensure Location is always present at position 0 if missing
          const hasLocation = mapped.some((m) => m.filterKey === "location");
          if (!hasLocation) {
            mapped.unshift(DEFAULT_CATEGORIES[0]);
          }

          // Ensure Featured and Cancellation Deals are present if missing from API
          const hasFeatured = mapped.some((m) => m.filterKey === "featured");
          if (!hasFeatured) mapped.splice(1, 0, DEFAULT_CATEGORIES[1]);

          const hasCancelled = mapped.some((m) => m.filterKey === "cancelled");
          if (!hasCancelled) mapped.splice(2, 0, DEFAULT_CATEGORIES[2]);

          setCategories(mapped);
        }
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
