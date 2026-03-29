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
  Package,
  Star,
  ExternalLink,
  Instagram,
  Youtube,
  Percent,
  Box,
  Eye,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  image_name: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_out_of_stock: boolean;
  discount_percentage: number | null;
  sales_count: number;
  instagram_url: string | null;
  youtube_url: string | null;
  specifications: { title: string; description: string }[] | null;
  created_at: string | null;
  collection_id: string | null;
  collection?: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    parent: { id: string; name: string }[] | null;
  } | null;
}

interface ProductImage {
  id: string;
  image_url: string;
  image_name: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer: { name: string }[] | null;
}

export default function ViewProductPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      // Fetch product with collection info
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          "*, collection:collection_id(id, name, slug, parent_id, parent:parent_id(id, name))",
        )
        .eq("id", productId)
        .single();

      if (productError || !productData) {
        console.error("Error fetching product:", productError);
        alert("Product not found");
        router.push("/admin/dashboard/Products");
        return;
      }

      // Fetch product images
      const { data: imagesData } = await supabase
        .from("product_images")
        .select("id, image_url, image_name")
        .eq("product_id", productId)
        .order("created_at");

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, customer:customer_id(name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(5);

      setProduct(productData);
      setProductImages(imagesData || []);
      setReviews(reviewsData || []);
      setLoading(false);
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, supabase, router]);

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const calculateDiscountedPrice = () => {
    if (!product || !product.discount_percentage) return product?.price || 0;
    return (
      product.price -
      (product.price * product.discount_percentage) / 100
    ).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
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
            onClick={() => router.push("/admin/dashboard/Products")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="text-sm text-gray-500">/{product.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View on Site
            </Button>
          </Link>
          <Link href={`/admin/dashboard/Products/${product.id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {product.image_url && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border relative">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-1 left-1 text-xs">
                      Main
                    </Badge>
                  </div>
                )}
                {productImages.map((img) => (
                  <div
                    key={img.id}
                    className="w-32 h-32 rounded-lg overflow-hidden border relative"
                  >
                    <Image
                      src={img.image_url}
                      alt="Product image"
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                {!product.image_url && productImages.length === 0 && (
                  <p className="text-gray-400 text-sm">No images uploaded</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Basic information about this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {product.is_active ? (
                  <Badge className="bg-green-600/10 text-green-600 border-none">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-600/10 text-red-500 border-none">
                    Inactive
                  </Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-none">
                    Featured
                  </Badge>
                )}
                {product.is_new_arrival && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-none">
                    New Arrival
                  </Badge>
                )}
                {product.is_out_of_stock && (
                  <Badge className="bg-red-600/10 text-red-500 border-none">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {product.description && (
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p className="text-gray-700 mt-1">{product.description}</p>
                </div>
              )}

              <Separator />

              {/* Collection */}
              {product.collection && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Collection:</span>
                  {product.collection.parent?.[0] && (
                    <>
                      <Link
                        href={`/admin/dashboard/Collections/${product.collection.parent[0].id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {product.collection.parent[0].name}
                      </Link>
                      <span className="text-gray-400">›</span>
                    </>
                  )}
                  <Link
                    href={`/admin/dashboard/Collections/${product.collection.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {product.collection.name}
                  </Link>
                </div>
              )}

              {/* Created At */}
              {product.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Created:</span>
                  <span className="text-sm">
                    {new Date(product.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              {/* Social Links */}
              {(product.instagram_url || product.youtube_url) && (
                <>
                  <Separator />
                  <div className="flex gap-4">
                    {product.instagram_url && (
                      <a
                        href={product.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-pink-600 hover:underline"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {product.youtube_url && (
                      <a
                        href={product.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                      >
                        <Youtube className="h-4 w-4" />
                        YouTube
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.specifications.map((spec, index) => (
                    <div
                      key={index}
                      className="flex justify-between py-2 border-b last:border-0"
                    >
                      <span className="font-medium text-gray-700">
                        {spec.title}
                      </span>
                      <span className="text-gray-600">{spec.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Reviews ({reviews.length})
              </CardTitle>
              <CardDescription>
                Average Rating: {calculateAverageRating()} / 5
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 rounded-lg bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {review.customer?.[0]?.name || "Anonymous"}
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {product.discount_percentage &&
                product.discount_percentage > 0 ? (
                  <>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{calculateDiscountedPrice()}
                    </p>
                    <p className="text-lg text-gray-400 line-through">
                      ₹{product.price}
                    </p>
                    <Badge className="mt-2 bg-green-600/10 text-green-600 border-none">
                      <Percent className="h-3 w-3 mr-1" />
                      {product.discount_percentage}% OFF
                    </Badge>
                  </>
                ) : (
                  <p className="text-3xl font-bold">₹{product.price}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stock</span>
                <span
                  className={
                    product.stock < 5
                      ? "text-red-600 font-semibold"
                      : "font-medium"
                  }
                >
                  {product.stock} units
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sales Count</span>
                <span>{product.sales_count} sold</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span>
                  {product.is_out_of_stock ? (
                    <Badge variant="outline" className="text-red-500">
                      Out of Stock
                    </Badge>
                  ) : product.stock < 5 ? (
                    <Badge variant="outline" className="text-yellow-600">
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600">
                      In Stock
                    </Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quick Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Slug</span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {product.slug}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active</span>
                <span>{product.is_active ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Featured</span>
                <span>{product.is_featured ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">New Arrival</span>
                <span>{product.is_new_arrival ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reviews</span>
                <span>{reviews.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Avg Rating</span>
                <span className="flex items-center gap-1">
                  {calculateAverageRating()}
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
