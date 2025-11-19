"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Lock, Image as LucideImage } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Check, X, Plus } from "lucide-react";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CollectionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  const { id } = React.use(params);
  const router = useRouter();
  const [editingField, setEditingField] = useState<string | null>(null);

  const [collection, setCollection] = useState({
    name: "",
    description: "",
    image_urls: "",
    image_name: "",
    is_active: true,
    is_featured: false,
    seo_title: "",
    seo_keywords: "",
    seo_description: "",
    slug: "",
  });

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchProductData = async () => {
      setPageLoading(true);
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching collection:", error);
      } else if (data) {
        console.log("Fetched collection data:", data);
        setCollection({
          name: data.name,
          description: data.description,
          image_urls: data.image_url,
          image_name: data.image_name,
          is_active: data.is_active,
          is_featured: data.is_featured,
          seo_title: data.seo_title,
          seo_keywords: data.seo_keywords,
          seo_description: data.seo_description,
          slug: data.slug,
        });
      }
      setPageLoading(false);
    };

    fetchProductData();
  }, []);

  const handleChange = (key: string, value: any) => {
    setCollection((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {pageLoading ? (
        <div className="text-gray-500 w-full h-[500px] flex items-center justify-center">
          <Spinner className="size-8" />
          <p className="ml-3">Loading product details...</p>
        </div>
      ) : (
        <>
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {collection.name}
              </CardTitle>
              <CardDescription>
                {`Manage and edit the details of "${collection.slug}"`}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                {/* Thumbnails Section */}
                <div>
                  <p className="text-left text-gray-500 text-sm mb-2">
                    Thumbnail Image
                  </p>
                  {/* If no image is present, show placeholder */}
                  <div className="flex flex-col items-center justify-center gap-4 w-full p-4 rounded border border-dashed border-gray-300">
                    <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                      <LucideImage className="text-gray-600 w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-400">Please add an image</p>
                  </div>
                  {/* If image is present, show image preview */}

                  <Button
                    className="mt-3 w-fit"
                    variant={"outline"}
                    // onClick={addNewImage}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Image
                  </Button>
                </div>
              </div>

              {/* Editable Product Info */}
              <div className="space-y-4">
                {[
                  {
                    key: "name",
                    label: "Collection Name",
                    type: "text",
                    editable: true,
                  },
                  { key: "slug", label: "Slug", type: "text", editable: false },
                  {
                    key: "Seo Title",
                    label: "Seo Title",
                    type: "text",
                    editable: true,
                  },
                  {
                    key: "Seo Keyword",
                    label: "Seo Keyword",
                    type: "text",
                    editable: true,
                  },
                  {
                    key: "Seo Description",
                    label: "Seo Description",
                    type: "textarea",
                    editable: true,
                  },
                ].map(({ key, label, type, editable }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="w-full">
                      <label className="block text-sm text-gray-500">
                        {label}
                      </label>
                      {editable ? (
                        <>
                          {editingField === key ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                type={type}
                                value={
                                  collection[
                                    key as keyof typeof collection
                                  ] as any
                                }
                                onChange={(e) =>
                                  handleChange(
                                    key,
                                    type === "number"
                                      ? parseFloat(e.target.value) || 0
                                      : e.target.value
                                  )
                                }
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setEditingField(null)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => setEditingField(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <p className="text-base">
                                {collection[key as keyof typeof collection]}
                              </p>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingField(key)}
                              >
                                <Pencil className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-base">
                            {collection[key as keyof typeof collection]}
                          </p>
                          <Button size="icon" variant="ghost">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Description
                  </label>
                  {editingField === "description" ? (
                    <div className="space-y-2">
                      <Textarea
                        value={collection.description}
                        onChange={(e) =>
                          handleChange("description", e.target.value)
                        }
                      />
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEditingField(null)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setEditingField(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-base max-w-lg">
                        {collection.description}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingField("description")}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 gap-4 pt-4">
                  {[
                    { key: "is_active", label: "Active" },
                    { key: "is_featured", label: "Featured" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                    >
                      <label className="text-sm text-gray-600">{label}</label>
                      <Switch
                        checked={
                          collection[key as keyof typeof collection] as boolean
                        }
                        onCheckedChange={(val) => handleChange(key, val)}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-6 flex justify-end">
                  <Button className="px-6">Save All Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
