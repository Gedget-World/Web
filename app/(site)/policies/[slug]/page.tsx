import { getMarkdownContent } from "@/lib/markdown";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownViewer from "@/components/markdown-viewer";
import { notFound } from "next/navigation";

// Map URL slugs to markdown file names
const policyFiles: Record<string, string> = {
  "terms-and-conditions": "terms-and-conditions.md",
  "privacy-policy": "privacy-policy.md",
  "return-refund-cancellation-policy": "return-refund-cancellation-policy.md",
  "shipping-and-delivery-policy": "shipping-and-delivery-policy.md",
  "payment-policy": "payment-policy.md",
  "cookies-policy": "cookies-policy.md",
  "user-account-policy": "user-account-policy.md",
  disclaimer: "disclaimer.md",
  "intellectual-property-policy": "intellectual-property-policy.md",
  "contact-information-policy": "contact-information-policy.md",
  "pricing-and-tax-disclosure": "pricing_and_tax_disclosure.md",
  "third-party-services-policy": "third-party-services-policy.md",
  "marketing-and-communication-policy": "marketing-and-communication-policy.md",
  "accessibility-statement": "accessibility-statement.md",
};

// Generate static params for all policies
export function generateStaticParams() {
  return Object.keys(policyFiles).map((slug) => ({
    slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fileName = policyFiles[slug];

  if (!fileName) {
    return {
      title: "Policy Not Found",
    };
  }

  // Convert slug to title
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${title} | Gadgets Kabila`,
    description: `Read our ${title.toLowerCase()} to understand your rights and our commitments.`,
  };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fileName = policyFiles[slug];

  if (!fileName) {
    notFound();
  }

  let policyContent: string;
  try {
    policyContent = getMarkdownContent(`content/policies/${fileName}`);
  } catch {
    notFound();
  }

  return (
    <section className="max-w-4xl mt-10 mb-10 mx-auto px-4">
      <div className="prose prose-lg max-w-none">
        <div className="flex flex-row justify-between items-center mb-8">
          <Link
            href="/policies"
            className="text-black hover:text-blue-800 decoration-2 underline-offset-2 transition-colors duration-200"
          >
            <Button variant="outline" className="cursor-pointer">
              <ArrowLeftIcon className="inline-block mr-2 h-4 w-4" />
              Back to Policies
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          <MarkdownViewer content={policyContent} />
        </div>
      </div>
    </section>
  );
}
