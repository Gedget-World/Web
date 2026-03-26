"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Megaphone, Loader2, Upload, X } from "lucide-react";
import Link from "next/link";

interface Placement {
  id: string;
  name: string;
  description: string | null;
}

function AdFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const adId = searchParams.get("id");
  const isEditMode = !!adId;

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [ad, setAd] = useState({
    name: "",
    ad_type: "image",
    placement_id: "",
    desktop_content_url: "",
    desktop_width: "",
    desktop_height: "",
    tablet_content_url: "",
    tablet_width: "",
    tablet_height: "",
    mobile_content_url: "",
    mobile_width: "",
    mobile_height: "",
    html_content: "",
    click_url: "",
    click_target: "_blank",
    tracking_pixel_url: "",
    start_date: "",
    end_date: "",
    max_impressions: "",
    max_clicks: "",
    is_active: true,
    priority: 0,
    alt_text: "",
    campaign_name: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    desktop_content_url: false,
  });

  // Fetch placements
  useEffect(() => {
    const fetchPlacements = async () => {
      try {
        const res = await fetch("/api/content/placements");
        const result = await res.json();
        if (result.success) setPlacements(result.data);
      } catch (error) {
        console.error("Error fetching placements:", error);
      }
    };
    fetchPlacements();
  }, []);

  // Fetch ad data if editing
  useEffect(() => {
    if (adId) {
      const fetchAd = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/content/advertisements/${adId}`);
          const result = await res.json();

          if (result.success && result.data) {
            const data = result.data;
            setAd({
              name: data.name || "",
              ad_type: data.ad_type || "image",
              placement_id: data.placement_id || "",
              desktop_content_url: data.desktop_content_url || "",
              desktop_width: data.desktop_width?.toString() || "",
              desktop_height: data.desktop_height?.toString() || "",
              tablet_content_url: data.tablet_content_url || "",
              tablet_width: data.tablet_width?.toString() || "",
              tablet_height: data.tablet_height?.toString() || "",
              mobile_content_url: data.mobile_content_url || "",
              mobile_width: data.mobile_width?.toString() || "",
              mobile_height: data.mobile_height?.toString() || "",
              html_content: data.html_content || "",
              click_url: data.click_url || "",
              click_target: data.click_target || "_blank",
              tracking_pixel_url: data.tracking_pixel_url || "",
              start_date: data.start_date
                ? new Date(data.start_date).toISOString().slice(0, 16)
                : "",
              end_date: data.end_date
                ? new Date(data.end_date).toISOString().slice(0, 16)
                : "",
              max_impressions: data.max_impressions?.toString() || "",
              max_clicks: data.max_clicks?.toString() || "",
              is_active: data.is_active ?? true,
              priority: data.priority || 0,
              alt_text: data.alt_text || "",
              campaign_name: data.campaign_name || "",
            });
          }
        } catch (error) {
          console.error("Error fetching ad:", error);
        }
        setLoading(false);
      };
      fetchAd();
    }
  }, [adId]);

  const handleChange = (key: string, value: any) => {
    setAd((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "tablet" | "mobile",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    const bucketName =
      process.env.NEXT_PUBLIC_SUPABASE_ADS_BUCKET || "advertisements";
    const fileName = `${type}_${Date.now()}_${file.name}`;

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(fileName);

      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        handleChange(`${type}_content_url`, publicUrl);
        handleChange(`${type}_width`, img.width.toString());
        handleChange(`${type}_height`, img.height.toString());
        setUploading(null);
      };
      img.onerror = () => {
        handleChange(`${type}_content_url`, publicUrl);
        setUploading(null);
      };
      img.src = publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
      setUploading(null);
    }
  };

  const removeImage = async (type: "desktop" | "tablet" | "mobile") => {
    const imageUrl = ad[`${type}_content_url` as keyof typeof ad] as string;

    // Delete from storage if URL exists
    if (imageUrl) {
      try {
        const bucketName =
          process.env.NEXT_PUBLIC_SUPABASE_ADS_BUCKET || "advertisements";
        // Extract filename from URL
        const urlParts = imageUrl.split(
          `/storage/v1/object/public/${bucketName}/`,
        );
        if (urlParts.length > 1) {
          const fileName = urlParts[1];
          await supabase.storage.from(bucketName).remove([fileName]);
        }
      } catch (error) {
        console.error("Error deleting image from storage:", error);
      }
    }

    handleChange(`${type}_content_url`, "");
    handleChange(`${type}_width`, "");
    handleChange(`${type}_height`, "");
  };

  const validate = () => {
    const newErrors = {
      name: !ad.name.trim(),
      desktop_content_url:
        ad.ad_type !== "html" && !ad.desktop_content_url.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        ...ad,
        placement_id: ad.placement_id || null,
        desktop_width: ad.desktop_width ? parseInt(ad.desktop_width) : null,
        desktop_height: ad.desktop_height ? parseInt(ad.desktop_height) : null,
        tablet_width: ad.tablet_width ? parseInt(ad.tablet_width) : null,
        tablet_height: ad.tablet_height ? parseInt(ad.tablet_height) : null,
        mobile_width: ad.mobile_width ? parseInt(ad.mobile_width) : null,
        mobile_height: ad.mobile_height ? parseInt(ad.mobile_height) : null,
        start_date: ad.start_date || null,
        end_date: ad.end_date || null,
        max_impressions: ad.max_impressions
          ? parseInt(ad.max_impressions)
          : null,
        max_clicks: ad.max_clicks ? parseInt(ad.max_clicks) : null,
        priority: parseInt(ad.priority.toString()) || 0,
        campaign_name: ad.campaign_name || null,
      };

      const url = isEditMode
        ? `/api/content/advertisements/${adId}`
        : "/api/content/advertisements";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/admin/dashboard/ContentManagement/advertisements");
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save advertisement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const ImageUploader = ({
    type,
    label,
    required = false,
  }: {
    type: "desktop" | "tablet" | "mobile";
    label: string;
    required?: boolean;
  }) => {
    const imageUrl = ad[`${type}_content_url` as keyof typeof ad] as string;
    const width = ad[`${type}_width` as keyof typeof ad] as string;
    const height = ad[`${type}_height` as keyof typeof ad] as string;

    return (
      <div className="space-y-2">
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt={`${type} preview`}
              className="w-full h-40 object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeImage(type)}
              >
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
            {width && height && (
              <p className="text-xs text-muted-foreground mt-1">
                {width} × {height}px
              </p>
            )}
          </div>
        ) : (
          <label
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
              type === "desktop" && errors.desktop_content_url
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={(e) => handleImageUpload(e, type)}
              disabled={uploading === type}
            />
            {uploading === type ? (
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Click to upload {type}
                </span>
              </>
            )}
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/ContentManagement/advertisements">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-green-600" />
          {isEditMode ? "Edit Advertisement" : "Create New Advertisement"}
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Ad name and type settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={ad.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Holiday Sale Banner"
                    className={errors.name ? "border-red-500" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ad Type</Label>
                  <Select
                    value={ad.ad_type}
                    onValueChange={(value) => handleChange("ad_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={ad.placement_id}
                    onValueChange={(value) =>
                      handleChange(
                        "placement_id",
                        value === "none" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select placement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Placement</SelectItem>
                      {placements.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign_name">Campaign Name</Label>
                  <Input
                    id="campaign_name"
                    value={ad.campaign_name}
                    onChange={(e) =>
                      handleChange("campaign_name", e.target.value)
                    }
                    placeholder="e.g., Q4 2024 Promotion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt_text">Alt Text (SEO)</Label>
                  <Input
                    id="alt_text"
                    value={ad.alt_text}
                    onChange={(e) => handleChange("alt_text", e.target.value)}
                    placeholder="Image description for accessibility"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Link & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Link & Tracking</CardTitle>
                <CardDescription>
                  Configure click destination and tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="click_url">Click URL</Label>
                  <Input
                    id="click_url"
                    value={ad.click_url}
                    onChange={(e) => handleChange("click_url", e.target.value)}
                    placeholder="https://example.com/landing-page"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Click Target</Label>
                  <Select
                    value={ad.click_target}
                    onValueChange={(value) =>
                      handleChange("click_target", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Same Tab</SelectItem>
                      <SelectItem value="_blank">New Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tracking_pixel_url">Tracking Pixel URL</Label>
                  <Input
                    id="tracking_pixel_url"
                    value={ad.tracking_pixel_url}
                    onChange={(e) =>
                      handleChange("tracking_pixel_url", e.target.value)
                    }
                    placeholder="https://tracking.example.com/pixel"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Responsive Content */}
          {ad.ad_type !== "html" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Responsive Content</CardTitle>
                <CardDescription>
                  Upload different images/videos for desktop, tablet, and
                  mobile. Only desktop is required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ImageUploader type="desktop" label="Desktop" required />
                  <ImageUploader type="tablet" label="Tablet" />
                  <ImageUploader type="mobile" label="Mobile" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* HTML Content */}
          {ad.ad_type === "html" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>HTML Content</CardTitle>
                <CardDescription>
                  Enter custom HTML code for this advertisement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={ad.html_content}
                  onChange={(e) => handleChange("html_content", e.target.value)}
                  placeholder="<div>Your HTML ad content here...</div>"
                  rows={10}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          )}

          {/* Scheduling & Limits */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Scheduling & Limits</CardTitle>
              <CardDescription>
                Control when the ad is displayed and set impression/click limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={ad.start_date}
                    onChange={(e) => handleChange("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={ad.end_date}
                    onChange={(e) => handleChange("end_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={ad.priority}
                    onChange={(e) =>
                      handleChange("priority", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_impressions">Max Impressions</Label>
                  <Input
                    id="max_impressions"
                    type="number"
                    min="0"
                    value={ad.max_impressions}
                    onChange={(e) =>
                      handleChange("max_impressions", e.target.value)
                    }
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_clicks">Max Clicks</Label>
                  <Input
                    id="max_clicks"
                    type="number"
                    min="0"
                    value={ad.max_clicks}
                    onChange={(e) => handleChange("max_clicks", e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active Status</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={ad.is_active}
                      onCheckedChange={(checked) =>
                        handleChange("is_active", checked)
                      }
                    />
                    <span className="text-sm">
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 mt-6 mb-8">
            <Link href="/admin/dashboard/ContentManagement/advertisements">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Advertisement" : "Create Advertisement"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function NewAdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <AdFormContent />
    </Suspense>
  );
}
