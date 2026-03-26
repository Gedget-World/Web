import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { StoreSetting, SettingsMap } from "@/lib/types/settings";

/**
 * Create Supabase server client for settings operations
 */
async function createSettingsClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Fetch all store settings (Server-side)
 * Use this in Server Components or API routes
 */
export async function getStoreSettings(): Promise<SettingsMap> {
  const supabase = await createSettingsClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select("setting_key, setting_value");

  if (error) {
    console.error("Error fetching store settings:", error);
    return {};
  }

  const settingsMap: SettingsMap = {};
  data?.forEach((setting) => {
    settingsMap[setting.setting_key] = setting.setting_value;
  });

  return settingsMap;
}

/**
 * Fetch specific store settings by keys (Server-side)
 */
export async function getStoreSettingsByKeys(
  keys: string[],
): Promise<SettingsMap> {
  const supabase = await createSettingsClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select("setting_key, setting_value")
    .in("setting_key", keys);

  if (error) {
    console.error("Error fetching store settings:", error);
    return {};
  }

  const settingsMap: SettingsMap = {};
  data?.forEach((setting) => {
    settingsMap[setting.setting_key] = setting.setting_value;
  });

  return settingsMap;
}

/**
 * Fetch a single store setting (Server-side)
 */
export async function getStoreSetting(
  key: string,
  defaultValue: string = "",
): Promise<string> {
  const supabase = await createSettingsClient();

  const { data, error } = await supabase
    .from("store_settings")
    .select("setting_value")
    .eq("setting_key", key)
    .single();

  if (error || !data) {
    return defaultValue;
  }

  return data.setting_value ?? defaultValue;
}

/**
 * Get tax configuration
 */
export async function getTaxSettings(): Promise<{
  enabled: boolean;
  type: string;
  rate: number;
  inclusive: boolean;
  gstNumber: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}> {
  const settings = await getStoreSettingsByKeys([
    "tax_enabled",
    "tax_type",
    "tax_rate",
    "tax_inclusive",
    "gst_number",
    "cgst_rate",
    "sgst_rate",
    "igst_rate",
  ]);

  return {
    enabled: settings.tax_enabled === "true",
    type: settings.tax_type || "GST",
    rate: parseFloat(settings.tax_rate || "18"),
    inclusive: settings.tax_inclusive === "true",
    gstNumber: settings.gst_number || "",
    cgstRate: parseFloat(settings.cgst_rate || "9"),
    sgstRate: parseFloat(settings.sgst_rate || "9"),
    igstRate: parseFloat(settings.igst_rate || "18"),
  };
}

/**
 * Get shipping configuration
 */
export async function getShippingSettings(): Promise<{
  enabled: boolean;
  freeThreshold: number;
  flatRate: number;
  expressRate: number;
  countries: string[];
}> {
  const settings = await getStoreSettingsByKeys([
    "shipping_enabled",
    "free_shipping_threshold",
    "flat_shipping_rate",
    "express_shipping_rate",
    "shipping_countries",
  ]);

  let countries: string[] = ["India"];
  try {
    if (settings.shipping_countries) {
      countries = JSON.parse(settings.shipping_countries);
    }
  } catch {
    countries = ["India"];
  }

  return {
    enabled: settings.shipping_enabled === "true",
    freeThreshold: parseFloat(settings.free_shipping_threshold || "500"),
    flatRate: parseFloat(settings.flat_shipping_rate || "50"),
    expressRate: parseFloat(settings.express_shipping_rate || "150"),
    countries,
  };
}

/**
 * Get store basic info
 */
export async function getStoreInfo(): Promise<{
  name: string;
  logo: string;
  favicon: string;
  description: string;
  tagline: string;
  currencyCode: string;
  currencySymbol: string;
}> {
  const settings = await getStoreSettingsByKeys([
    "store_name",
    "store_logo",
    "store_favicon",
    "store_description",
    "store_tagline",
    "currency_code",
    "currency_symbol",
  ]);

  return {
    name: settings.store_name || "Store",
    logo: settings.store_logo || "",
    favicon: settings.store_favicon || "",
    description: settings.store_description || "",
    tagline: settings.store_tagline || "",
    currencyCode: settings.currency_code || "INR",
    currencySymbol: settings.currency_symbol || "₹",
  };
}

/**
 * Get contact info
 */
export async function getContactInfo(): Promise<{
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}> {
  const settings = await getStoreSettingsByKeys([
    "contact_email",
    "contact_phone",
    "contact_whatsapp",
    "store_address",
    "store_city",
    "store_state",
    "store_country",
    "store_pincode",
  ]);

  return {
    email: settings.contact_email || "",
    phone: settings.contact_phone || "",
    whatsapp: settings.contact_whatsapp || "",
    address: settings.store_address || "",
    city: settings.store_city || "",
    state: settings.store_state || "",
    country: settings.store_country || "India",
    pincode: settings.store_pincode || "",
  };
}

/**
 * Get social media links
 */
export async function getSocialLinks(): Promise<{
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  linkedin: string;
}> {
  const settings = await getStoreSettingsByKeys([
    "social_facebook",
    "social_instagram",
    "social_twitter",
    "social_youtube",
    "social_linkedin",
  ]);

  return {
    facebook: settings.social_facebook || "",
    instagram: settings.social_instagram || "",
    twitter: settings.social_twitter || "",
    youtube: settings.social_youtube || "",
    linkedin: settings.social_linkedin || "",
  };
}
