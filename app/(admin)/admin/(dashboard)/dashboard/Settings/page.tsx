"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  Phone,
  Receipt,
  Truck,
  Share2,
  Building,
  ShoppingBag,
  Save,
  Loader2,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import type {
  StoreSetting,
  SettingCategory,
  CATEGORY_INFO as CategoryInfoType,
} from "@/lib/types/settings";

// Category info with icons
const CATEGORY_INFO = [
  {
    id: "general" as SettingCategory,
    label: "General",
    description: "Basic store information and branding",
    icon: Store,
  },
  {
    id: "contact" as SettingCategory,
    label: "Contact",
    description: "Contact information and location",
    icon: Phone,
  },
  {
    id: "tax" as SettingCategory,
    label: "Tax Configuration",
    description: "GST, VAT, and other tax settings",
    icon: Receipt,
  },
  {
    id: "shipping" as SettingCategory,
    label: "Shipping",
    description: "Shipping rates and options",
    icon: Truck,
  },
  {
    id: "social" as SettingCategory,
    label: "Social Media",
    description: "Social media links and profiles",
    icon: Share2,
  },
  {
    id: "business" as SettingCategory,
    label: "Business Details",
    description: "Legal and regulatory information",
    icon: Building,
  },
  {
    id: "orders" as SettingCategory,
    label: "Order Settings",
    description: "Order processing configuration",
    icon: ShoppingBag,
  },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingCategory>("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [originalValues, setOriginalValues] = useState<
    Record<string, string | null>
  >({});
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch all settings via API
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/settings");
        const result = await response.json();

        if (response.ok && result.data) {
          setSettings(result.data);
          // Store original values for comparison
          const originals: Record<string, string | null> = {};
          result.data.forEach((s: StoreSetting) => {
            originals[s.setting_key] = s.setting_value;
          });
          setOriginalValues(originals);
        } else {
          console.error("Error fetching settings:", result.error);
          showNotification("error", "Failed to load settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        showNotification("error", "Failed to load settings");
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Update setting value in state
  const updateSetting = (key: string, value: string | null) => {
    setSettings((prev) => {
      const updated = prev.map((s) =>
        s.setting_key === key ? { ...s, setting_value: value } : s,
      );
      // Check if there are any changes compared to original
      const hasAnyChanges = updated.some(
        (s) => s.setting_value !== originalValues[s.setting_key],
      );
      setHasChanges(hasAnyChanges);
      return updated;
    });
  };

  // Save all settings via API
  const handleSave = async () => {
    setSaving(true);

    try {
      // Get all changed settings
      const changedSettings = settings.filter(
        (s) => s.setting_value !== originalValues[s.setting_key],
      );

      if (changedSettings.length === 0) {
        showNotification("success", "No changes to save");
        setSaving(false);
        return;
      }

      // Send to API
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: changedSettings.map((s) => ({
            setting_key: s.setting_key,
            setting_value: s.setting_value,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      // Update original values
      const newOriginals: Record<string, string | null> = {};
      settings.forEach((s) => {
        newOriginals[s.setting_key] = s.setting_value;
      });
      setOriginalValues(newOriginals);
      setHasChanges(false);
      showNotification("success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showNotification("error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (
    file: File,
    settingKey: string,
    bucketName: string = "settings_images",
  ) => {
    try {
      // Create unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `${settingKey}-${timestamp}-${randomString}-${file.name.replace(/\s+/g, "_")}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        // If bucket doesn't exist, try with product_images bucket
        const { data: fallbackData, error: fallbackError } =
          await supabase.storage
            .from("product_images")
            .upload(`settings/${fileName}`, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (fallbackError) {
          throw fallbackError;
        }

        const { data: publicData } = supabase.storage
          .from("product_images")
          .getPublicUrl(`settings/${fileName}`);

        return publicData.publicUrl;
      }

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification("error", "Failed to upload image");
      return null;
    }
  };

  // Handle logo/favicon file selection
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    settingKey: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showNotification("error", "Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showNotification("error", "Image size should be less than 2MB");
      return;
    }

    const imageUrl = await handleImageUpload(file, settingKey);
    if (imageUrl) {
      updateSetting(settingKey, imageUrl);
      showNotification("success", "Image uploaded successfully");
    }
  };

  // Remove image
  const removeImage = (settingKey: string) => {
    updateSetting(settingKey, "");
  };

  // Get settings by category
  const getSettingsByCategory = (category: SettingCategory) => {
    return settings
      .filter((s) => s.category === category)
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Render setting input based on type
  const renderSettingInput = (setting: StoreSetting) => {
    const {
      setting_key,
      setting_value,
      setting_type,
      label,
      description,
      is_required,
    } = setting;

    switch (setting_type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between space-x-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor={setting_key} className="text-base">
                {label}
                {is_required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <Switch
              id={setting_key}
              checked={setting_value === "true"}
              onCheckedChange={(checked) =>
                updateSetting(setting_key, checked.toString())
              }
            />
          </div>
        );

      case "number":
        return (
          <div className="space-y-2 py-3">
            <Label htmlFor={setting_key}>
              {label}
              {is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
              id={setting_key}
              type="number"
              value={setting_value || ""}
              onChange={(e) => updateSetting(setting_key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="max-w-xs"
            />
          </div>
        );

      case "image":
        return (
          <div className="space-y-2 py-3">
            <Label htmlFor={setting_key}>
              {label}
              {is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center gap-4">
              {setting_value ? (
                <div className="relative group">
                  <div className="w-24 h-24 relative border rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={setting_value}
                      alt={label}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(setting_key)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, setting_key)}
                  className="hidden"
                  id={`file-${setting_key}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById(`file-${setting_key}`)?.click()
                  }
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {setting_value ? "Change" : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "json":
        return (
          <div className="space-y-2 py-3">
            <Label htmlFor={setting_key}>
              {label}
              {is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Textarea
              id={setting_key}
              value={setting_value || ""}
              onChange={(e) => updateSetting(setting_key, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()} as JSON`}
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        );

      default:
        // String type - check if it's a longer field
        const isLongField =
          setting_key.includes("description") ||
          setting_key.includes("address");
        return (
          <div className="space-y-2 py-3">
            <Label htmlFor={setting_key}>
              {label}
              {is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {isLongField ? (
              <Textarea
                id={setting_key}
                value={setting_value || ""}
                onChange={(e) => updateSetting(setting_key, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                rows={3}
              />
            ) : (
              <Input
                id={setting_key}
                type={
                  setting_key.includes("email")
                    ? "email"
                    : setting_key.includes("url") ||
                        setting_key.includes("facebook") ||
                        setting_key.includes("instagram") ||
                        setting_key.includes("twitter") ||
                        setting_key.includes("youtube") ||
                        setting_key.includes("linkedin")
                      ? "url"
                      : "text"
                }
                value={setting_value || ""}
                onChange={(e) => updateSetting(setting_key, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
              />
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-4 my-2">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <header className="p-2 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your store configuration and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingCategory)}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap gap-2 h-auto p-1">
          {CATEGORY_INFO.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 py-2 px-3"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORY_INFO.map((category) => (
          <TabsContent key={category.id} value={category.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="w-5 h-5" />
                  {category.label}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {getSettingsByCategory(category.id).map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
                {getSettingsByCategory(category.id).length === 0 && (
                  <p className="text-muted-foreground py-4">
                    No settings available for this category.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          You have unsaved changes
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Now"}
          </Button>
        </div>
      )}
    </div>
  );
}
