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
import {
  ArrowLeft,
  Image as LucideImage,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";

interface Placement {
  id: string;
  name: string;
  description: string | null;
}

function BannerFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const bannerId = searchParams.get("id");
  const isEditMode = !!bannerId;

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const [banner, setBanner] = useState({
    title: "",
    subtitle: "",
    placement_id: "",
    desktop_image_url: "",
    desktop_width: "",
    desktop_height: "",
    tablet_image_url: "",
    tablet_width: "",
    tablet_height: "",
    mobile_image_url: "",
    mobile_width: "",
    mobile_height: "",
    link_url: "",
    link_target: "_self",
    link_text: "",
    text_color: "#ffffff",
    overlay_color: "",
    text_position: "center",
    start_date: "",
    end_date: "",
    is_active: true,
    priority: 0,
    alt_text: "",
  });

  const [errors, setErrors] = useState({
    title: false,
    desktop_image_url: false,
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

  // Fetch banner data if editing
  useEffect(() => {
    if (bannerId) {
      const fetchBanner = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/content/banners/${bannerId}`);
          const result = await res.json();

          if (result.success && result.data) {
            const data = result.data;
            setBanner({
              title: data.title || "",
              subtitle: data.subtitle || "",
              placement_id: data.placement_id || "",
              desktop_image_url: data.desktop_image_url || "",
              desktop_width: data.desktop_width?.toString() || "",
              desktop_height: data.desktop_height?.toString() || "",
              tablet_image_url: data.tablet_image_url || "",
              tablet_width: data.tablet_width?.toString() || "",
              tablet_height: data.tablet_height?.toString() || "",
              mobile_image_url: data.mobile_image_url || "",
              mobile_width: data.mobile_width?.toString() || "",
              mobile_height: data.mobile_height?.toString() || "",
              link_url: data.link_url || "",
              link_target: data.link_target || "_self",
              link_text: data.link_text || "",
              text_color: data.text_color || "#ffffff",
              overlay_color: data.overlay_color || "",
              text_position: data.text_position || "center",
              start_date: data.start_date
                ? new Date(data.start_date).toISOString().slice(0, 16)
                : "",
              end_date: data.end_date
                ? new Date(data.end_date).toISOString().slice(0, 16)
                : "",
              is_active: data.is_active ?? true,
              priority: data.priority || 0,
              alt_text: data.alt_text || "",
            });
          }
        } catch (error) {
          console.error("Error fetching banner:", error);
        }
        setLoading(false);
      };
      fetchBanner();
    }
  }, [bannerId]);

  const handleChange = (key: string, value: any) => {
    setBanner((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "desktop" | "tablet" | "mobile",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(type);
    const bucketName =
      process.env.NEXT_PUBLIC_SUPABASE_BANNERS_BUCKET || "banners";
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
        handleChange(`${type}_image_url`, publicUrl);
        handleChange(`${type}_width`, img.width.toString());
        handleChange(`${type}_height`, img.height.toString());
        setUploading(null);
      };
      img.onerror = () => {
        handleChange(`${type}_image_url`, publicUrl);
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
    const imageUrl = banner[
      `${type}_image_url` as keyof typeof banner
    ] as string;

    // Delete from storage if URL exists
    if (imageUrl) {
      try {
        const bucketName =
          process.env.NEXT_PUBLIC_SUPABASE_BANNERS_BUCKET || "banners";
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

    handleChange(`${type}_image_url`, "");
    handleChange(`${type}_width`, "");
    handleChange(`${type}_height`, "");
  };

  const validate = () => {
    const newErrors = {
      title: !banner.title.trim(),
      desktop_image_url: !banner.desktop_image_url.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        ...banner,
        placement_id: banner.placement_id || null,
        desktop_width: banner.desktop_width
          ? parseInt(banner.desktop_width)
          : null,
        desktop_height: banner.desktop_height
          ? parseInt(banner.desktop_height)
          : null,
        tablet_width: banner.tablet_width
          ? parseInt(banner.tablet_width)
          : null,
        tablet_height: banner.tablet_height
          ? parseInt(banner.tablet_height)
          : null,
        mobile_width: banner.mobile_width
          ? parseInt(banner.mobile_width)
          : null,
        mobile_height: banner.mobile_height
          ? parseInt(banner.mobile_height)
          : null,
        start_date: banner.start_date || null,
        end_date: banner.end_date || null,
        priority: parseInt(banner.priority.toString()) || 0,
      };

      const url = isEditMode
        ? `/api/content/banners/${bannerId}`
        : "/api/content/banners";
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

      router.push("/admin/dashboard/ContentManagement/banners");
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("Failed to save banner. Please try again.");
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
    const imageUrl = banner[
      `${type}_image_url` as keyof typeof banner
    ] as string;
    const width = banner[`${type}_width` as keyof typeof banner] as string;
    const height = banner[`${type}_height` as keyof typeof banner] as string;

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
              type === "desktop" && errors.desktop_image_url
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, type)}
              disabled={uploading === type}
            />
            {uploading === type ? (
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Click to upload {type} image
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
        <Link href="/admin/dashboard/ContentManagement/banners">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LucideImage className="h-6 w-6 text-blue-600" />
          {isEditMode ? "Edit Banner" : "Create New Banner"}
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
                <CardDescription>
                  Banner title and text settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={banner.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., Summer Sale"
                    className={errors.title ? "border-red-500" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Textarea
                    id="subtitle"
                    value={banner.subtitle}
                    onChange={(e) => handleChange("subtitle", e.target.value)}
                    placeholder="Optional banner subtitle"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt_text">Alt Text (SEO)</Label>
                  <Input
                    id="alt_text"
                    value={banner.alt_text}
                    onChange={(e) => handleChange("alt_text", e.target.value)}
                    placeholder="Image description for accessibility"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={banner.placement_id}
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
              </CardContent>
            </Card>

            {/* Link & Styling */}
            <Card>
              <CardHeader>
                <CardTitle>Link & Styling</CardTitle>
                <CardDescription>
                  Configure click action and appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link_url">Link URL</Label>
                  <Input
                    id="link_url"
                    value={banner.link_url}
                    onChange={(e) => handleChange("link_url", e.target.value)}
                    placeholder="https://example.com/sale"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Link Target</Label>
                    <Select
                      value={banner.link_target}
                      onValueChange={(value) =>
                        handleChange("link_target", value)
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
                  <div className="space-y-2 hidden">
                    <Label htmlFor="link_text">Button Text</Label>
                    <Input
                      id="link_text"
                      value={banner.link_text}
                      onChange={(e) =>
                        handleChange("link_text", e.target.value)
                      }
                      placeholder="Shop Now"
                    />
                  </div>
                </div>

                <div className="hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="text_color">Text Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={banner.text_color}
                          onChange={(e) =>
                            handleChange("text_color", e.target.value)
                          }
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={banner.text_color}
                          onChange={(e) =>
                            handleChange("text_color", e.target.value)
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Text Position</Label>
                      <Select
                        value={banner.text_position}
                        onValueChange={(value) =>
                          handleChange("text_position", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 hidden">
                  <Label htmlFor="overlay_color">
                    Overlay Color (optional)
                  </Label>
                  <Input
                    id="overlay_color"
                    value={banner.overlay_color}
                    onChange={(e) =>
                      handleChange("overlay_color", e.target.value)
                    }
                    placeholder="rgba(0,0,0,0.5)"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Responsive Images */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Responsive Images</CardTitle>
              <CardDescription>
                Upload different images for desktop, tablet, and mobile devices.
                Only desktop is required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ImageUploader
                  type="desktop"
                  label="Desktop Image (1920 × 700) pixels"
                  required
                />
                <ImageUploader
                  type="tablet"
                  label="Tablet Image (1200 × 700) pixels"
                />
                <ImageUploader
                  type="mobile"
                  label="Mobile Image (800 × 1000) pixels"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling & Settings */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Scheduling & Settings</CardTitle>
              <CardDescription>
                Control when the banner is displayed and its priority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={banner.start_date}
                    onChange={(e) => handleChange("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={banner.end_date}
                    onChange={(e) => handleChange("end_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={banner.priority}
                    onChange={(e) =>
                      handleChange("priority", parseInt(e.target.value) || 0)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = shown first
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Active Status</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={banner.is_active}
                      onCheckedChange={(checked) =>
                        handleChange("is_active", checked)
                      }
                    />
                    <span className="text-sm">
                      {banner.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 mt-6 mb-8">
            <Link href="/admin/dashboard/ContentManagement/banners">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Banner" : "Create Banner"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function NewBannerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <BannerFormContent />
    </Suspense>
  );
}
