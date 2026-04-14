import { createClient } from "@/lib/supabase/server";
import { AddToCartButton } from "@/components/add-to-cart-button";
import Link from "next/link";
import {
  TriangleAlert,
  Check,
  XCircle,
  Truck,
  RotateCcw,
  Shield,
  CreditCard,
  ChevronRight,
  Flame,
  TrendingUp,
  Award,
  Star,
  BadgeCheck,
  Users,
} from "lucide-react";
import { LazyProductReviews } from "@/components/lazy-product-reviews";
import ProductImagesSection from "@/components/product-images-section";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { ProductSpecifications } from "@/components/product-specifications";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/product-actions";
import { RatingDisplay } from "@/components/rating-display";
import { SimilarProducts } from "@/components/similar-products";
import { FrequentlyBoughtTogether } from "@/components/frequently-bought-together";
import { ProductQA } from "@/components/product-qa";
import { StickyAddToCart } from "@/components/sticky-add-to-cart";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, collections(name, slug, parent_id, parent:parent_id(name, slug))",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center border-2 border-dashed p-8 rounded-lg">
            <div className="flex justify-center mb-4">
              <TriangleAlert size={60} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Product Not Found
            </h1>
            <p className="text-slate-600 mb-5">
              The product you are looking for does not exist.
            </p>
            <Link
              href="/products"
              className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Fetch review stats
  const { data: reviewStats } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", product.id)
    .eq("is_active", true);

  const reviewCount = reviewStats?.length || 0;
  const averageRating =
    reviewCount > 0
      ? reviewStats!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  // Calculate discount savings
  const hasDiscount =
    product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = hasDiscount
    ? Math.round(product.price / (1 - product.discount_percentage / 100))
    : null;
  const savingsAmount = originalPrice ? originalPrice - product.price : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Track product view for recently viewed */}
      <ProductViewTracker
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image_url: product.image_url,
          discount_percentage: product.discount_percentage,
          is_out_of_stock: product.is_out_of_stock || product.stock <= 0,
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href="/products"
          className="hover:text-blue-600 transition-colors"
        >
          Products
        </Link>
        {product.collections && (
          <>
            <ChevronRight className="h-3 w-3" />
            {product.collections.parent && product.collections.parent[0] && (
              <>
                <Link
                  href={`/products?collection=${product.collections.parent[0].slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {product.collections.parent[0].name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <Link
              href={`/products?collection=${product.collections.slug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {product.collections.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Images */}
        <div className="relative">
          <ProductImagesSection
            productId={product.id}
            thumbnailUrl={product.image_url}
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Product Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {product.is_featured && (
              <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 font-medium">
                <Flame className="w-3 h-3 mr-0.5" />
                Bestseller
              </Badge>
            )}
            {product.is_new_arrival && (
              <Badge className="bg-linear-to-r from-blue-500 to-indigo-500 text-white text-[10px] px-2 py-0.5 font-medium">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                Trending
              </Badge>
            )}
            {averageRating >= 4.5 && reviewCount > 5 && (
              <Badge className="bg-linear-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 font-medium">
                <Award className="w-3 h-3 mr-0.5" />
                Top Rated
              </Badge>
            )}
          </div>

          {/* Product Title and Actions */}
          <div className="flex flex-col gap-2 mb-2">
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              {product.name}
            </h1>
            <ProductActions
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
            />
          </div>

          {/* Rating Display */}
          {reviewCount > 0 && (
            <div className="mb-3">
              <RatingDisplay
                rating={averageRating}
                reviewCount={reviewCount}
                size="md"
              />
            </div>
          )}

          {/* Sold Count / Popularity */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1 text-slate-600">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">500+ bought this month</span>
            </div>
          </div>

          {/* Price Section */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ₹
                {Number(product.price) % 1 === 0
                  ? Math.round(product.price).toLocaleString("en-IN")
                  : product.price.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-slate-400 line-through">
                    ₹{originalPrice?.toLocaleString("en-IN")}
                  </span>
                  <Badge className="bg-linear-to-r from-green-500 to-teal-500 text-white text-xs px-1.5 py-0">
                    {product.discount_percentage}% OFF
                  </Badge>
                </>
              )}
            </div>
            {/* You Save Highlight */}
            {hasDiscount && (
              <div className="inline-flex items-center gap-1 bg-green-50 border border-green-200 rounded-md px-2 py-1 w-fit">
                <span className="text-green-700 text-sm font-semibold">
                  You Save ₹{Math.round(savingsAmount).toLocaleString("en-IN")}
                </span>
                <span className="text-green-600 text-xs">
                  ({product.discount_percentage}% off)
                </span>
              </div>
            )}
          </div>

          {/* Short description */}
          {product.short_description && (
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Stock Status */}
          <div className="mb-4">
            {product.is_out_of_stock || product.stock <= 0 ? (
              <div className="flex items-center gap-1.5 text-red-600">
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">In Stock</span>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <div className="mb-6">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                stock: product.stock,
              }}
              disabled={product.is_out_of_stock || product.stock <= 0}
            />
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
              <Truck className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-900">
                  Free Delivery
                </p>
                <p className="text-[10px] text-slate-500">Orders above ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
              <RotateCcw className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-900">
                  Easy Returns
                </p>
                <p className="text-[10px] text-slate-500">30 day policy</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-900">
                  Secure Payment
                </p>
                <p className="text-[10px] text-slate-500">SSL encrypted</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg">
              <CreditCard className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-900">
                  Multiple Options
                </p>
                <p className="text-[10px] text-slate-500">
                  Cards, UPI, Net Banking
                </p>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="mb-6">
            <ProductSpecifications
              specifications={
                (product.specifications as {
                  title: string;
                  description: string;
                }[]) || []
              }
            />
          </div>

          {/* Description */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Description</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || "No description available"}
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      <FrequentlyBoughtTogether
        productId={product.id}
        currentProduct={{
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
        }}
      />

      {/* Reviews Section with Verified Badge */}
      <div className="mt-12 pt-8 border-t">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Reviews
          </h2>
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Verified Purchases</span>
          </div>
        </div>
        <LazyProductReviews
          productId={product.id}
          userEmail={user?.email || null}
        />
      </div>

      {/* Q&A Section */}
      <ProductQA productId={product.id} />

      {/* Similar Products */}
      <SimilarProducts
        productId={product.id}
        collectionId={product.collection_id}
      />

      {/* Recently Viewed */}
      <div className="mt-12 border-t">
        <RecentlyViewedProducts />
      </div>

      {/* Sticky Add to Cart for Mobile */}
      <StickyAddToCart
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          stock: product.stock,
        }}
        disabled={product.is_out_of_stock || product.stock <= 0}
      />

      {/* Bottom padding for sticky cart on mobile */}
      <div className="h-16 md:hidden" />
    </main>
  );
}
