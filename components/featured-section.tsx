import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Shield,
  Truck,
  RefreshCw,
  Star,
  Headphones,
} from "lucide-react";

export default function FeaturedSection() {
  return (
    <section className="max-w-7xl mt-8 md:mt-10 mb-8 md:mb-10 mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Feature Icons Grid - Hidden on mobile, shown on md+ */}
      <div className="flex-1 hidden md:grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <Shield className="h-10 w-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Secure Payments</h3>
          <p className="text-sm text-slate-500 mt-1">256-bit encryption</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <Truck className="h-10 w-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Fast Delivery</h3>
          <p className="text-sm text-slate-500 mt-1">Free above ₹500</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <RefreshCw className="h-10 w-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900">Easy Returns</h3>
          <p className="text-sm text-slate-500 mt-1">30-day policy</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
          <Headphones className="h-10 w-10 text-blue-600 mb-3" />
          <h3 className="font-semibold text-slate-900">24/7 Support</h3>
          <p className="text-sm text-slate-500 mt-1">Always here to help</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1">
        <div>
          <Badge variant="outline" className="text-xs">
            Our Features
          </Badge>
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 mt-2">
          Powered by Technology.
          <br /> Earned by Trust
        </h2>
        <p className="mb-3 text-sm md:text-base text-slate-600">
          Built on modern, secure technology, our platform protects every click,
          tap, and transaction. From encrypted payments to real-time fraud
          detection, we use enterprise-grade systems to keep your data private
          and your orders safe.
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
          <li className="font-medium text-slate-800">
            End-to-end encrypted payments
          </li>
          <li className="font-medium text-slate-800">
            Real-time order tracking & alerts
          </li>
          <li className="font-medium text-slate-800">
            Clear pricing, returns & refunds
          </li>
          <li className="font-medium text-slate-800">
            Verified reviews & seller ratings
          </li>
          <li className="font-medium text-slate-800">Real-time Support</li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-3 mt-5 md:mt-6">
          <Button className="w-full sm:flex-1 rounded-sm cursor-pointer text-sm">
            Explore Our Security <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            className="w-full sm:flex-1 rounded-sm cursor-pointer text-sm"
            variant={"outline"}
          >
            Visit Trust Center
          </Button>
        </div>
      </div>

      {/* Mobile Feature Icons - Shown only on mobile */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <Shield className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-xs text-slate-900">
            Secure Payments
          </h3>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <Truck className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-xs text-slate-900">Fast Delivery</h3>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <RefreshCw className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-xs text-slate-900">Easy Returns</h3>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
          <Headphones className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-xs text-slate-900">24/7 Support</h3>
        </div>
      </div>
    </section>
  );
}
