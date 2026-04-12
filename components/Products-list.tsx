import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { Button } from "./ui/button";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  discount_percentage: number | null;
  is_featured: boolean;
  stock: number;
  average_rating?: number;
  review_count?: number;
  is_out_of_stock: boolean;
};

type ProductsListProps = {
  products: Product[];
  heading: string;
  exploreLink: string;
};

export default function ProductsList({
  products,
  heading,
  exploreLink,
}: ProductsListProps) {
  return (
    <section className="py-5 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-2xl text-slate-900 mb-2">
          {heading}
        </h4>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="group border-primary/30 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
        >
          <Link href={exploreLink}>
            Explore
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
