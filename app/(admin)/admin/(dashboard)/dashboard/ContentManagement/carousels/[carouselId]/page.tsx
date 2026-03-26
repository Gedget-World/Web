"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Settings,
  Loader2,
  GripVertical,
  Plus,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface Placement {
  id: string;
  name: string;
  description: string | null;
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  is_active: boolean;
  alt_text: string | null;
  text_color: string | null;
  overlay_color: string | null;
  text_position: string | null;
  link_url: string | null;
  link_text: string | null;
}

interface PageProps {
  params: Promise<{ carouselId: string }>;
}

export default function EditCarouselPage({ params }: PageProps) {
  const router = useRouter();
  const { carouselId } = use(params);

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [allBanners, setAllBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBannerSelector, setShowBannerSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [carousel, setCarousel] = useState({
    name: "",
    placement_id: "",
    auto_play: true,
    interval_ms: 5000,
    show_arrows: true,
    show_dots: true,
    infinite_loop: true,
    pause_on_hover: true,
    is_active: true,
  });

  const [selectedBanners, setSelectedBanners] = useState<Banner[]>([]);

  const [errors, setErrors] = useState({
    name: false,
  });

  // Fetch placements and all banners
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [placementsRes, bannersRes] = await Promise.all([
          fetch("/api/content/placements"),
          fetch("/api/content/banners?limit=100"),
        ]);

        const placementsResult = await placementsRes.json();
        const bannersResult = await bannersRes.json();

        if (placementsResult.success) setPlacements(placementsResult.data);
        if (bannersResult.success) setAllBanners(bannersResult.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // Fetch carousel data
  useEffect(() => {
    const fetchCarousel = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/content/carousels/${carouselId}`);
        const result = await res.json();

        if (result.success && result.data) {
          const data = result.data;
          setCarousel({
            name: data.name || "",
            placement_id: data.placement_id || "",
            auto_play: data.auto_play ?? true,
            interval_ms: data.interval_ms || 5000,
            show_arrows: data.show_arrows ?? true,
            show_dots: data.show_dots ?? true,
            infinite_loop: data.infinite_loop ?? true,
            pause_on_hover: data.pause_on_hover ?? true,
            is_active: data.is_active ?? true,
          });

          if (data.banners) {
            setSelectedBanners(data.banners);
          }
        } else {
          router.push("/admin/dashboard/ContentManagement/carousels");
        }
      } catch (error) {
        console.error("Error fetching carousel:", error);
        router.push("/admin/dashboard/ContentManagement/carousels");
      }
      setLoading(false);
    };
    fetchCarousel();
  }, [carouselId, router]);

  const handleChange = (key: string, value: any) => {
    setCarousel((prev) => ({ ...prev, [key]: value }));
  };

  const addBanner = (banner: Banner) => {
    if (!selectedBanners.find((b) => b.id === banner.id)) {
      setSelectedBanners((prev) => [...prev, banner]);
    }
  };

  const removeBanner = (bannerId: string) => {
    setSelectedBanners((prev) => prev.filter((b) => b.id !== bannerId));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBanners = [...selectedBanners];
    const [draggedBanner] = newBanners.splice(draggedIndex, 1);
    newBanners.splice(index, 0, draggedBanner);

    setSelectedBanners(newBanners);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const validate = () => {
    const newErrors = {
      name: !carousel.name.trim(),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        ...carousel,
        placement_id: carousel.placement_id || null,
        banner_ids: selectedBanners.map((b) => b.id),
      };

      const res = await fetch(`/api/content/carousels/${carouselId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/admin/dashboard/ContentManagement/carousels");
    } catch (error) {
      console.error("Error saving carousel:", error);
      alert("Failed to update carousel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const availableBanners = allBanners.filter(
    (banner) => !selectedBanners.find((sb) => sb.id === banner.id),
  );

  // Preview navigation
  const nextSlide = () => {
    if (carousel.infinite_loop) {
      setPreviewIndex((prev) => (prev + 1) % selectedBanners.length);
    } else {
      setPreviewIndex((prev) => Math.min(prev + 1, selectedBanners.length - 1));
    }
  };

  const prevSlide = () => {
    if (carousel.infinite_loop) {
      setPreviewIndex((prev) =>
        prev === 0 ? selectedBanners.length - 1 : prev - 1,
      );
    } else {
      setPreviewIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  // Auto-play preview
  useEffect(() => {
    if (!showPreview || !carousel.auto_play || selectedBanners.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setPreviewIndex((prev) => {
        if (carousel.infinite_loop) {
          return (prev + 1) % selectedBanners.length;
        }
        return Math.min(prev + 1, selectedBanners.length - 1);
      });
    }, carousel.interval_ms);

    return () => clearInterval(interval);
  }, [
    showPreview,
    carousel.auto_play,
    carousel.interval_ms,
    carousel.infinite_loop,
    selectedBanners.length,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/ContentManagement/carousels">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-orange-600" />
            Edit Carousel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">ID: {carouselId}</p>
        </div>
        <Badge variant={carousel.is_active ? "default" : "secondary"}>
          {carousel.is_active ? "Active" : "Inactive"}
        </Badge>
        {selectedBanners.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setPreviewIndex(0);
              setShowPreview(true);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name and placement settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={carousel.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Homepage Hero Slider"
                className={errors.name ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label>Placement</Label>
              <Select
                value={carousel.placement_id}
                onValueChange={(value) =>
                  handleChange("placement_id", value === "none" ? "" : value)
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
              <Label>Active Status</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={carousel.is_active}
                  onCheckedChange={(checked) =>
                    handleChange("is_active", checked)
                  }
                />
                <span className="text-sm">
                  {carousel.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carousel Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Carousel Settings</CardTitle>
            <CardDescription>Configure autoplay and controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Play</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically transition slides
                </p>
              </div>
              <Switch
                checked={carousel.auto_play}
                onCheckedChange={(checked) =>
                  handleChange("auto_play", checked)
                }
              />
            </div>

            {carousel.auto_play && (
              <div className="space-y-2">
                <Label htmlFor="interval">Interval (ms)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1000"
                  step="500"
                  value={carousel.interval_ms}
                  onChange={(e) =>
                    handleChange(
                      "interval_ms",
                      parseInt(e.target.value) || 5000,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {(carousel.interval_ms / 1000).toFixed(1)} seconds between
                  slides
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Arrows</Label>
                <p className="text-xs text-muted-foreground">
                  Navigation arrows on sides
                </p>
              </div>
              <Switch
                checked={carousel.show_arrows}
                onCheckedChange={(checked) =>
                  handleChange("show_arrows", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Dots</Label>
                <p className="text-xs text-muted-foreground">
                  Dot indicators at bottom
                </p>
              </div>
              <Switch
                checked={carousel.show_dots}
                onCheckedChange={(checked) =>
                  handleChange("show_dots", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Infinite Loop</Label>
                <p className="text-xs text-muted-foreground">
                  Loop back to start after last slide
                </p>
              </div>
              <Switch
                checked={carousel.infinite_loop}
                onCheckedChange={(checked) =>
                  handleChange("infinite_loop", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Pause on Hover</Label>
                <p className="text-xs text-muted-foreground">
                  Stop autoplay when mouse hovers
                </p>
              </div>
              <Switch
                checked={carousel.pause_on_hover}
                onCheckedChange={(checked) =>
                  handleChange("pause_on_hover", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner Selection */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Banners</CardTitle>
              <CardDescription>
                Select and order banners for this carousel. Drag to reorder.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowBannerSelector(true)}
              disabled={availableBanners.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedBanners.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No banners added yet. Click &quot;Add Banner&quot; to get
                started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedBanners.map((banner, index) => (
                <div
                  key={banner.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-3 border rounded-lg bg-white cursor-move transition-opacity ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  <GripVertical className="h-5 w-5 text-gray-400 shrink-0" />
                  <Badge variant="outline" className="shrink-0">
                    {index + 1}
                  </Badge>
                  <div className="w-20 h-12 rounded overflow-hidden shrink-0">
                    <img
                      src={banner.desktop_image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{banner.title}</p>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                  {!banner.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeBanner(banner.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4 mt-6 mb-8">
        <Link href="/admin/dashboard/ContentManagement/carousels">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Carousel
        </Button>
      </div>

      {/* Banner Selector Modal */}
      {showBannerSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Select Banner</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBannerSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {availableBanners.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No available banners. All banners have been added to this
                  carousel.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableBanners.map((banner) => {
                    const isSelected = selectedBanners.find(
                      (b) => b.id === banner.id,
                    );
                    return (
                      <div
                        key={banner.id}
                        onClick={() => addBanner(banner)}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary"
                        }`}
                      >
                        <div className="aspect-video rounded overflow-hidden mb-2">
                          <img
                            src={banner.desktop_image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="font-medium truncate">{banner.title}</p>
                        {!banner.is_active && (
                          <Badge variant="secondary" className="mt-1">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {selectedBanners.length} banner(s) selected
              </p>
              <Button onClick={() => setShowBannerSelector(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedBanners.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Carousel Preview</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              {/* Slide */}
              <div className="aspect-16/6 overflow-hidden relative">
                <img
                  src={selectedBanners[previewIndex]?.desktop_image_url}
                  alt={selectedBanners[previewIndex]?.title}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor:
                      selectedBanners[previewIndex]?.overlay_color ||
                      "rgba(0,0,0,0.3)",
                  }}
                />
                {/* Content */}
                <div
                  className={`absolute inset-0 flex items-center px-8 ${
                    selectedBanners[previewIndex]?.text_position === "left"
                      ? "justify-start"
                      : selectedBanners[previewIndex]?.text_position === "right"
                        ? "justify-end"
                        : "justify-center"
                  }`}
                >
                  <div
                    className={`${
                      selectedBanners[previewIndex]?.text_position === "center"
                        ? "text-center"
                        : selectedBanners[previewIndex]?.text_position ===
                            "right"
                          ? "text-right"
                          : "text-left"
                    } max-w-xl`}
                    style={{
                      color:
                        selectedBanners[previewIndex]?.text_color || "#ffffff",
                    }}
                  >
                    <h2 className="text-3xl font-bold drop-shadow-lg">
                      {selectedBanners[previewIndex]?.title}
                    </h2>
                    {selectedBanners[previewIndex]?.subtitle && (
                      <p className="text-lg mt-2 drop-shadow-md">
                        {selectedBanners[previewIndex]?.subtitle}
                      </p>
                    )}
                    {selectedBanners[previewIndex]?.link_text && (
                      <button className="mt-4 px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                        {selectedBanners[previewIndex]?.link_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Arrows */}
              {carousel.show_arrows && selectedBanners.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Dots */}
              {carousel.show_dots && selectedBanners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {selectedBanners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setPreviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === previewIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50">
              <p className="text-sm text-muted-foreground text-center">
                Slide {previewIndex + 1} of {selectedBanners.length}
                {carousel.auto_play &&
                  ` • Auto-playing every ${carousel.interval_ms / 1000}s`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
