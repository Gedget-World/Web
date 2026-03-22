import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import Link from "next/link";
import { Bookmark, Star, TriangleAlert } from "lucide-react";
import { ProductReviews } from "@/components/product-reviews";
import ProductImagesSection from "@/components/product-images-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductViewTracker } from "@/components/product-view-tracker";

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
                <span className="text-sm text-blue-600">
                  <b>{averageRating.toFixed(1)}</b> {reviewCount} review
                  {reviewCount > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Prices */}
            <div>
              <span className="text-2xl font-bold text-slate-900">
                &#8377;
                {Number(product.price) % 1 === 0
                  ? Math.round(product.price)
                  : product.price}
                <span
                  className={`${
                    !product.discount_percentage ||
                    product.discount_percentage < 1
                      ? "hidden"
                      : ""
                  }`}
                >
                  {" "}
                  <span className="line-through text-slate-500 font-medium text-sm">
                    &#8377;
                    {Math.round(
                      product.price / (1 - product.discount_percentage / 100),
                    )}
                  </span>
                </span>
              </span>
              <div
                className={`text-[12px] bg-green-600 text-white inline-block py-0 px-2 border border-green-600 rounded-md ml-1 ${
                  !product.discount_percentage ||
                  product.discount_percentage < 1
                    ? "hidden"
                    : ""
                }`}
              >
                {product.discount_percentage}%
              </div>
            </div>
          </div>

          {/* Short description */}
          {product.short_description && (
            <div className="mb-4">
              <p className="text-sm text-slate-700">
                {product.short_description ? product.short_description : null}
              </p>
            </div>
          )}

          {/* Stock details */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              {product.is_out_of_stock || product.stock <= 0 ? (
                <span className="text-red-600 font-medium">Out of Stock</span>
              ) : (
                <span className="text-green-600 font-medium">In Stock</span>
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
            disabled={product.is_out_of_stock || product.stock <= 0}
          />

          {/* Details Accordion */}
          <div className="mt-8">
            <Accordion type="single" collapsible>
              <AccordionItem value="specifications">
                <AccordionTrigger className="text-md">
                  Product Specifications
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-slate-200">
                        <tr className="flex flex-col sm:table-row">
                          <td className="py-1 sm:py-3 font-regular text-slate-900 sm:w-1/3">
                            Brand
                          </td>
                          <td className="pb-1 sm:py-3 text-slate-600">
                            Gadget Kabila
                          </td>
                        </tr>
                        {product.specifications &&
                          Array.isArray(product.specifications) &&
                          product.specifications.map(
                            (
                              spec: { title: string; description: string },
                              index: number,
                            ) => (
                              <tr
                                key={index}
                                className="flex flex-col sm:table-row"
                              >
                                <td className="py-1 sm:py-3 font-regular text-slate-900 sm:w-1/3">
                                  {spec.title}
                                </td>
                                <td className="pb-1 sm:py-3 text-slate-600">
                                  {spec.description}
                                </td>
                              </tr>
                            ),
                          )}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="description">
                <AccordionTrigger className="text-md">
                  Description
                </AccordionTrigger>
                <AccordionContent>
                  {/* <div
                    dangerouslySetInnerHTML={{
                      __html: product.description || "No description available",
                    }}
                  /> */}
                  <div>{product.description || "No description available"}</div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shipping">
                <AccordionTrigger className="text-md">
                  Shipping & Returns
                </AccordionTrigger>
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
                <AccordionTrigger className="text-md">
                  Secure Checkout
                </AccordionTrigger>
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

      {/* Reviews */}
      <ProductReviews
        productId={product.id}
        reviews={reviews || []}
        averageRating={averageRating}
        reviewCount={reviewCount}
        userEmail={user?.email || null}
      />

      {/* Social Media Content */}
      <div className="mt-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* YouTube Video */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Video Review
            </h3>
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
              {/* <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/2bYPsQvdfe0?si=SAtaHRVcfPqxMZz8&autoplay=1&mute=1"
                title="Product Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              /> */}
            </div>
          </div>

          {/* Instagram Post */}
          {/* <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-pink-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              Instagram
            </h3>
            <div className="rounded-lg overflow-hidden bg-slate-100 min-h-[400px]">
              <iframe
                className="w-[200px]"
                src="https://www.instagram.com/reel/DHaXRNgtMYq/embed"
                height="400"
              />
            </div>
          </div> */}
        </div>
      </div>
    </main>
  );
}
