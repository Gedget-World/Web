import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bookmark, Star } from "lucide-react";
import { ProductReviews } from "@/components/product-reviews";
import ProductImagesSection from "@/components/product-images-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, collections(name, slug)")
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false });

  const reviewCount = reviews?.length || 0;
  const averageRating = reviews?.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="relative">
          <ProductImagesSection productId={product.id} />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-6 w-full">
            {product.collections && (
              <Link
                href={`/collections/${product.collections.slug}`}
                className="text-sm text-slate-600 flex items-center w-fit rounded hover:underline hover:text-blue-600 transition-colors"
              >
                <Bookmark className="mr-1" size={"16px"} />
                {product.collections.name}
              </Link>
            )}
            <h1 className="text-xl font-bold text-slate-900 mt-2 mb-4">
              {product.name}
            </h1>

            {/* Average Reviews - Only show if there are reviews */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">
                  {averageRating.toFixed(1)} ({reviewCount})
                </span>
              </div>
            )}

            <div>
              <span className="text-2xl font-bold text-slate-900">
                &#8377;{product.price}{" "}
                {product.discount_percentage && (
                  <span className="line-through text-slate-500 font-medium text-sm">
                    &#8377;
                    {Math.round(
                      product.price / (1 - product.discount_percentage / 100)
                    )}
                  </span>
                )}
              </span>
              <div className="text-[12px] bg-green-600 text-white inline-block py-0 px-2 border border-green-600 rounded-md ml-1">
                {product.discount_percentage
                  ? `${product.discount_percentage}%`
                  : ""}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <span className="text-green-600 font-medium">In Stock</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </div>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
            }}
            disabled={product.stock <= 0}
          />

          {/* Details Accordion */}
          <div className="mt-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="description">
                <AccordionTrigger>Description</AccordionTrigger>
                <AccordionContent>
                  {product.description || "No description available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Delivery:</span> Free
                      shipping on orders over &#8377;500. Standard delivery
                      takes 5-7 business days.
                    </p>
                    <p>
                      <span className="font-medium">Returns:</span> 30-day
                      return policy. Items must be in original condition.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="secure-checkout">
                <AccordionTrigger>Secure Checkout</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Payment Security:</span> All
                      transactions are secured with SSL encryption. Your payment
                      information is protected and never stored on our servers.
                    </p>
                    <p>
                      <span className="font-medium">Payment Methods:</span> We
                      accept all major credit cards, debit cards, UPI, and net
                      banking options.
                    </p>
                    <p>
                      <span className="font-medium">Buyer Protection:</span>{" "}
                      Your purchase is protected by our buyer protection
                      guarantee. If you don't receive your order, we'll issue a
                      full refund.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <ProductReviews
        productId={product.id}
        reviews={reviews || []}
        averageRating={averageRating}
        reviewCount={reviewCount}
        userEmail={user?.email || null}
      />
    </main>
  );
}
