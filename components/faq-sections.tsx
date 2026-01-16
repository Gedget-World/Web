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
    <section className="max-w-7xl mt-10 mb-10 mx-auto flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        <div>
          <Badge variant="outline">
            <MessageCircleQuestion /> Help Center
          </Badge>
        </div>
        <h2 className="text-4xl font-bold mb-4 mt-2">
          Frequently Asked Questions
          <br /> We're Here to Help
        </h2>
        <p className="mb-3">
          Find quick answers to the most common questions about orders,
          <br />
          payments, delivery, returns, and account management.
        </p>
        <div>
          <Button className="mt-6 rounded-sm cursor-pointer">
            Contact Support
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>How can I track my order?</AccordionTrigger>
            <AccordionContent>
              Once your order is shipped, you’ll receive a tracking link via
              email/SMS. You can also track it anytime from My Orders in your
              account.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent>
              We accept UPI, debit/credit cards, net banking, and popular
              wallets for a fast and secure checkout.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              What is your return and refund policy?
            </AccordionTrigger>
            <AccordionContent>
              Most products are eligible for easy returns within 7 days of
              delivery. Refunds are processed to your original payment method
              within 3–5 business days after pickup.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How long does delivery take?</AccordionTrigger>
            <AccordionContent>
              Standard delivery takes 2–5 business days, depending on your
              location and the seller.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>
              How can I contact customer support?
            </AccordionTrigger>
            <AccordionContent>
              You can reach us via live chat, email, or phone from the Help &
              Support section. Our team is available every day to assist you.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
