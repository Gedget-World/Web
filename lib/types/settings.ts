// Store Settings Types

export type SettingType =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | "image"
  | "email_list";

export type SettingCategory =
  | "general"
  | "contact"
  | "tax"
  | "shipping"
  | "social"
  | "business"
  | "orders"
  | "notifications";

export interface StoreSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: SettingType;
  category: SettingCategory;
  label: string;
  description: string | null;
  display_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsMap {
  [key: string]: string | null;
}

export interface CategoryInfo {
  id: SettingCategory;
  label: string;
  description: string;
  icon: string;
}

export const CATEGORY_INFO: CategoryInfo[] = [
  {
    id: "general",
    label: "General",
    description: "Basic store information and branding",
    icon: "Store",
  },
  {
    id: "contact",
    label: "Contact",
    description: "Contact information and location",
    icon: "Phone",
  },
  {
    id: "tax",
    label: "Tax Configuration",
    description: "GST, VAT, and other tax settings",
    icon: "Receipt",
  },
  {
    id: "shipping",
    label: "Shipping",
    description: "Shipping rates and options",
    icon: "Truck",
  },
  {
    id: "social",
    label: "Social Media",
    description: "Social media links and profiles",
    icon: "Share2",
  },
  {
    id: "business",
    label: "Business Details",
    description: "Legal and regulatory information",
    icon: "Building",
  },
  {
    id: "orders",
    label: "Order Settings",
    description: "Order processing configuration",
    icon: "ShoppingBag",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email and notification settings",
    icon: "AlertCircle",
  },
];
