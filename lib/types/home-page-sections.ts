// Types for the "Manage Home Page" admin feature.
// Persisted as a single JSON array in store_settings.home_page_sections.

// A product snapshot embedded directly in the section JSON (id + display
// fields), so the admin UI and homepage don't need a live products lookup
// just to show a preview. Deliberately excludes `description`/`stock` (kept
// out of the persisted snapshot; the homepage still fetches those fresh).
export interface HomePageSectionProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  discount_percentage: number | null;
  is_active: boolean;
  is_out_of_stock: boolean;
  is_new_arrival: boolean;
  is_featured: boolean;
  average_rating?: number;
  review_count?: number;
}

export interface HomePageSection {
  id: string;
  title: string;
  products: HomePageSectionProduct[];
}

// Older saved rows only stored product ids — accepted when parsing so
// existing data keeps working until the section is next saved.
export interface LegacyHomePageSection {
  id: string;
  title: string;
  productIds?: string[];
  products?: HomePageSectionProduct[];
}
