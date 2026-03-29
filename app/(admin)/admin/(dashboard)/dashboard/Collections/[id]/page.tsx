"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Calendar,
  Tag,
  FileText,
  Search,
  Layers,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_name: string | null;
  is_active: boolean;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string | null;
  parent_id: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  children?: { id: string; name: string; slug: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

export default function ViewCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);

      // Fetch collection with parent info
      const { data: collectionData, error: collectionError } = await supabase
        .from("collections")
        .select("*, parent:parent_id(id, name, slug)")
        .eq("id", collectionId)
        .single();

      if (collectionError || !collectionData) {
        console.error("Error fetching collection:", collectionError);
        alert("Collection not found");
        router.push("/admin/dashboard/Collections");
        return;
      }

      // Fetch child collections
      const { data: childrenData } = await supabase
        .from("collections")
        .select("id, name, slug")
        .eq("parent_id", collectionId)
        .order("name");

      // Fetch products in this collection
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, slug, price, image_url, is_active")
        .eq("collection_id", collectionId)
        .order("name")
        .limit(10);

      setCollection({
        ...collectionData,
        children: childrenData || [],
      });
      setProducts(productsData || []);
      setLoading(false);
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId, supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/dashboard/Collections")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{collection.name}</h1>
            <p className="text-sm text-gray-500">/{collection.slug}</p>
          </div>
        </div>
        <Link href={`/admin/dashboard/Collections/new?id=${collection.id}`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Collection
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Details</CardTitle>
              <CardDescription>
                Basic information about this collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {collection.image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <Image
                      src={collection.image_url}
                      alt={collection.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    {collection.is_active ? (
                      <Badge className="bg-green-600/10 text-green-600 border-none">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-600/10 text-red-500 border-none">
                        Inactive
                      </Badge>
                    )}
                    {collection.is_featured && (
                      <Badge className="bg-yellow-500/10 text-yellow-600 border-none">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {collection.description && (
                    <p className="text-gray-600">{collection.description}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Parent Collection */}
              {collection.parent && (
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Parent:</span>
                  <Link
                    href={`/admin/dashboard/Collections/${collection.parent.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {collection.parent.name}
                  </Link>
                </div>
              )}

              {/* Created At */}
              {collection.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm">
                    {new Date(collection.created_at).toLocaleDateString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {collection.seo_title ? (
                <>
                  <div>
                    <label className="text-sm text-gray-500">SEO Title</label>
                    <p className="font-medium">{collection.seo_title}</p>
                  </div>
                  {collection.seo_keywords && (
                    <div>
                      <label className="text-sm text-gray-500">Keywords</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {collection.seo_keywords
                          .split(",")
                          .map((keyword, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="font-normal"
                            >
                              {keyword.trim()}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                  {collection.seo_description && (
                    <div>
                      <label className="text-sm text-gray-500">
                        Meta Description
                      </label>
                      <p className="text-gray-600 text-sm">
                        {collection.seo_description}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400 text-sm">
                  No SEO information added
                </p>
              )}
            </CardContent>
          </Card>

          {/* Products in Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Products ({products.length})
              </CardTitle>
              <CardDescription>Products in this collection</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No products in this collection
                </p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      {product.image_url && (
                        <div className="w-10 h-10 rounded overflow-hidden">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Link
                          href={`/admin/dashboard/Products/${product.id}`}
                          className="font-medium text-sm hover:text-blue-600"
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          ₹{product.price}
                        </p>
                      </div>
                      {product.is_active ? (
                        <Badge
                          variant="outline"
                          className="text-green-600 text-xs"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-red-500 text-xs"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sub-collections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Sub-collections
              </CardTitle>
              <CardDescription>
                Nested collections under this one
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collection.children && collection.children.length > 0 ? (
                <div className="space-y-2">
                  {collection.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/admin/dashboard/Collections/${child.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Layers className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{child.name}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">
                  No sub-collections
                </p>
              )}
              <Separator className="my-4" />
              <Link
                href={`/admin/dashboard/Collections/new?parent=${collection.id}`}
              >
                <Button variant="outline" className="w-full" size="sm">
                  Add Sub-collection
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Slug</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {collection.slug}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Products</span>
                <span>{products.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sub-collections</span>
                <span>{collection.children?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span>{collection.is_active ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Featured</span>
                <span>{collection.is_featured ? "Yes" : "No"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
