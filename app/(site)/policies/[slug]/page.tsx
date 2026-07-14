import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownViewer from "@/components/markdown-viewer";
import { notFound } from "next/navigation";

// Map URL slugs to static markdown module imports.
// This avoids runtime fs reads, which can break in some production deploy targets.
const policyModules: Record<string, () => Promise<{ default: string }>> = {
  "terms-and-conditions": () =>
    import("@/content/policies/terms-and-conditions.md"),
  "privacy-policy": () => import("@/content/policies/privacy-policy.md"),
  "return-refund-cancellation-policy": () =>
    import("@/content/policies/shipping-and-delivery-policy.md"),
  "shipping-and-delivery-policy": () =>
    import("@/content/policies/shipping-and-delivery-policy.md"),
  "payment-policy": () => import("@/content/policies/payment-policy.md"),
  "cookies-policy": () => import("@/content/policies/cookies-policy.md"),
  "user-account-policy": () =>
    import("@/content/policies/user-account-policy.md"),
  disclaimer: () => import("@/content/policies/disclaimer.md"),
  "intellectual-property-policy": () =>
    import("@/content/policies/intellectual-property-policy.md"),
  "contact-information-policy": () =>
    import("@/content/policies/contact-information-policy.md"),
  "pricing-and-tax-disclosure": () =>
    import("@/content/policies/pricing_and_tax_disclosure.md"),
  "third-party-services-policy": () =>
    import("@/content/policies/third-party-services-policy.md"),
  "marketing-and-communication-policy": () =>
    import("@/content/policies/marketing-and-communication-policy.md"),
  "accessibility-statement": () =>
    import("@/content/policies/accessibility-statement.md"),
};

// Generate static params for all policies
export function generateStaticParams() {
  return Object.keys(policyModules).map((slug) => ({
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
  const loadPolicy = policyModules[slug];

  if (!loadPolicy) {
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
  const loadPolicy = policyModules[slug];

  if (!loadPolicy) {
    notFound();
  }

  let policyContent: string;
  try {
    const mod = await loadPolicy();
    policyContent = mod.default;
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
