import { createClient } from "@/lib/supabase/server";
import { AddToCartButton } from "@/components/add-to-cart-button";
import Link from "next/link";
import {
  Bookmark,
  TriangleAlert,
  Check,
  XCircle,
  Truck,
  RotateCcw,
  Shield,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { LazyProductReviews } from "@/components/lazy-product-reviews";
import ProductImagesSection from "@/components/product-images-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { ProductSpecifications } from "@/components/product-specifications";
import { Badge } from "@/components/ui/badge";

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
                  href={`/collections/${product.collections.parent[0].slug}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {product.collections.parent[0].name}
                </Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <Link
              href={`/collections/${product.collections.slug}`}
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
          {/* Collection Badge */}
          {product.collections && (
            <Link
              href={`/collections/${product.collections.slug}`}
              className="w-fit"
            >
              <Badge
                variant="secondary"
                className="mb-2 text-xs hover:bg-slate-200 transition-colors"
              >
                <Bookmark className="h-3 w-3 mr-1" />
                {product.collections.name}
              </Badge>
            </Link>
          )}

          {/* Product Title */}
          <h1 className="text-lg md:text-xl font-bold text-slate-900 mb-2">
            {product.name}
          </h1>

          {/* Price Section */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-slate-900">
              ₹
              {Number(product.price) % 1 === 0
                ? Math.round(product.price).toLocaleString("en-IN")
                : product.price.toLocaleString("en-IN")}
            </span>
            {product.discount_percentage && product.discount_percentage > 0 && (
              <>
                <span className="text-sm text-slate-400 line-through">
                  ₹
                  {Math.round(
                    product.price / (1 - product.discount_percentage / 100),
                  ).toLocaleString("en-IN")}
                </span>
                <Badge className="bg-green-500 hover:bg-green-600 text-xs px-1.5 py-0">
                  {product.discount_percentage}% OFF
                </Badge>
              </>
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
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Out of Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">In Stock</span>
                {product.stock <= 10 && (
                  <span className="text-xs text-orange-500 ml-1">
                    (Only {product.stock} left!)
                  </span>
                )}
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

          {/* Details Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="specifications" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                Product Specifications
              </AccordionTrigger>
              <AccordionContent>
                <ProductSpecifications
                  specifications={
                    (product.specifications as {
                      title: string;
                      description: string;
                    }[]) || []
                  }
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="description" className="border-b">
              <AccordionTrigger className="text-sm font-medium hover:no-underline py-3">
                Description
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description || "No description available"}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10 pt-6 border-t">
        <LazyProductReviews
          productId={product.id}
          userEmail={user?.email || null}
        />
      </div>
    </main>
  );
}
