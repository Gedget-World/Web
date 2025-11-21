import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative h-[600px] flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
      <div className="absolute inset-0 bg-[url('/modern-fashion-clothing-store-interior.jpg')] bg-cover bg-center opacity-20" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 text-balance">
          Elevate Your Style
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 mb-8 text-pretty">
          Discover timeless pieces that define modern elegance
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/products">Shop Now</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 bg-transparent"
          >
            <Link href="/collections">View Collections</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
