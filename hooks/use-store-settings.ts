"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StoreSetting, SettingsMap } from "@/lib/types/settings";

/**
 * Hook to fetch and use store settings
 * @param keys Optional array of specific setting keys to fetch. If not provided, fetches all settings.
 * @returns Object containing settings map, loading state, and refresh function
 */
export function useStoreSettings(keys?: string[]) {
  const supabase = createClient();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [rawSettings, setRawSettings] = useState<StoreSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("store_settings").select("*");

      if (keys && keys.length > 0) {
        query = query.in("setting_key", keys);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setRawSettings(data);
        const settingsMap: SettingsMap = {};
        data.forEach((setting) => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
        setSettings(settingsMap);
      }
    } catch (err) {
      console.error("Error fetching store settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * Get a setting value with optional default
   */
  const getSetting = (key: string, defaultValue: string = ""): string => {
    return settings[key] ?? defaultValue;
  };

  /**
   * Get a boolean setting
   */
  const getBooleanSetting = (
    key: string,
    defaultValue: boolean = false,
  ): boolean => {
    const value = settings[key];
    if (value === null || value === undefined) return defaultValue;
    return value === "true";
  };

  /**
   * Get a number setting
   */
  const getNumberSetting = (key: string, defaultValue: number = 0): number => {
    const value = settings[key];
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  /**
   * Get a JSON setting
   */
  const getJsonSetting = <T>(key: string, defaultValue: T): T => {
    const value = settings[key];
    if (value === null || value === undefined) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  };

  return {
    settings,
    rawSettings,
    loading,
    error,
    refresh: fetchSettings,
    getSetting,
    getBooleanSetting,
    getNumberSetting,
    getJsonSetting,
  };
}

/**
 * Commonly used settings keys grouped by functionality
 */
export const SETTING_KEYS = {
  store: [
    "store_name",
    "store_logo",
    "store_favicon",
    "store_description",
    "store_tagline",
  ],
  currency: ["currency_code", "currency_symbol"],
  contact: [
    "contact_email",
    "contact_phone",
    "contact_whatsapp",
    "store_address",
    "store_city",
    "store_state",
    "store_country",
    "store_pincode",
  ],
  tax: [
    "tax_enabled",
    "tax_type",
    "tax_rate",
    "tax_inclusive",
    "gst_number",
    "cgst_rate",
    "sgst_rate",
    "igst_rate",
  ],
  shipping: [
    "shipping_enabled",
    "free_shipping_threshold",
    "flat_shipping_rate",
    "express_shipping_rate",
    "shipping_countries",
  ],
  social: [
    "social_facebook",
    "social_instagram",
    "social_twitter",
    "social_youtube",
    "social_linkedin",
  ],
  business: [
    "business_name",
    "business_type",
    "business_pan",
    "business_registration",
  ],
  orders: [
    "order_prefix",
    "invoice_prefix",
    "order_confirmation_email",
    "low_stock_threshold",
    "allow_guest_checkout",
  ],
};
