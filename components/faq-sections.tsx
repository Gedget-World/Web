import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { MessageCircleQuestion } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSections() {
  return (
    <section className="max-w-7xl mt-8 md:mt-10 mb-8 md:mb-10 mx-auto px-4 md:px-8 flex flex-col md:flex-row gap-6 md:gap-8">
      <div className="flex-1 text-left">
        <div className="text-left">
          <Badge variant="outline" className="text-xs">
            <MessageCircleQuestion className="h-3 w-3 mr-1" /> Help Center
          </Badge>
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 mt-2 text-left">
          Frequently Asked Questions —{" "}
          <span className="hidden md:inline">
            <br />
          </span>
          We&apos;re Here to Help
        </h2>
        <p className="mb-3 text-sm md:text-base text-slate-600 text-left">
          Find quick answers to the most common questions about orders,
          payments, delivery, returns, and account management.
        </p>
        <div className="text-left">
          <Button className="mt-4 md:mt-6 rounded-sm cursor-pointer text-sm w-full sm:w-auto">
            Contact Support
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm md:text-base text-left">
              How can I track my order?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              Once your order is shipped, you'll receive a tracking link via
              email/SMS. You can also track it anytime from My Orders in your
              account.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-sm md:text-base text-left">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              We accept UPI, debit/credit cards, net banking, and popular
              wallets for a fast and secure checkout.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-sm md:text-base text-left">
              What is your return and refund policy?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              Most products are eligible for easy returns within 7 days of
              delivery. Refunds are processed to your original payment method
              within 3–5 business days after pickup.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-sm md:text-base text-left">
              How long does delivery take?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              Standard delivery takes 2–5 business days, depending on your
              location and the seller.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-sm md:text-base text-left">
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600">
              You can reach us via live chat, email, or phone from the Help &
              Support section. Our team is available every day to assist you.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
