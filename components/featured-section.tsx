import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export default function FeaturedSection() {
  return (
    <section className="max-w-7xl mt-10 mb-10 mx-auto flex flex-col md:flex-row gap-8">
      <div className="flex-1">1</div>
      <div className="flex-1">
        <div>
          <Badge variant="outline">Our Features</Badge>
        </div>
        <h2 className="text-4xl font-bold mb-4 mt-2">
          Powered by Technology.
          <br /> Earned by Trust
        </h2>
        <p className="mb-3">
          Built on modern, secure technology, our platform protects every click,
          tap, and transaction. From encrypted payments to real-time fraud
          detection, we use enterprise-grade systems to keep your data private
          and your orders safe.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li className="font-semibold text-black">
            End-to-end encrypted payments
          </li>
          <li className="font-semibold text-black">
            Real-time order tracking & alerts
          </li>
          <li className="font-semibold text-black">
            Clear pricing, returns & refunds
          </li>
          <li className="font-semibold text-black">
            Verified reviews & seller ratings
          </li>
          <li className="font-semibold text-black">Real-time Support</li>
        </ul>
        <div className="flex flex-row gap-4">
          <Button className="mt-6 flex-1 rounded-sm cursor-pointer">
            Explore Our Security <ArrowRight />
          </Button>
          <Button
            className="mt-6 flex-1 rounded-sm cursor-pointer"
            variant={"outline"}
          >
            Visit Trust Center
          </Button>
        </div>
      </div>
    </section>
  );
}
