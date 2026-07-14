import Link from "next/link";
import { FileText, Shield, Truck, ChevronRight } from "lucide-react";

const policies = [
  {
    title: "Terms and Conditions",
    description:
      "Our terms of service governing your use of the platform and purchases.",
    href: "/policies/terms-and-conditions",
    icon: FileText,
  },
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information.",
    href: "/policies/privacy-policy",
    icon: Shield,
  },
  {
    title: "Shipping, Delivery Policy, Cancellation & Return Policy",
    description:
      "Information about shipping methods, delivery times, and charges.",
    href: "/policies/shipping-and-delivery-policy",
    icon: Truck,
  },
  // {?
  //   title: "Payment Policy",
  //   description: "Accepted payment methods, security, and billing information.",
  //   href: "/policies/payment-policy",
  //   icon: CreditCard,
  // },
  // {
  //   title: "Cookie Policy",
  //   description: "How we use cookies and similar technologies on our website.",
  //   href: "/policies/cookies-policy",
  //   icon: Cookie,
  // },
  // {
  //   title: "User Account Policy",
  //   description:
  //     "Terms governing user accounts, registration, and account security.",
  //   href: "/policies/user-account-policy",
  //   icon: User,
  // },
  // {
  //   title: "Disclaimer",
  //   description:
  //     "Important disclaimers about product information and liability.",
  //   href: "/policies/disclaimer",
  //   icon: AlertTriangle,
  // },
  // {
  //   title: "Intellectual Property Policy",
  //   description:
  //     "Information about copyrights, trademarks, and content ownership.",
  //   href: "/policies/intellectual-property-policy",
  //   icon: Scale,
  // },
  // {
  //   title: "Grievance & Contact Information",
  //   description:
  //     "How to reach us for complaints, feedback, and grievance redressal.",
  //   href: "/policies/contact-information-policy",
  //   icon: Phone,
  // },
  // {
  //   title: "Pricing & Tax Disclosure",
  //   description:
  //     "Information about pricing, taxes, and charges on our platform.",
  //   href: "/policies/pricing-and-tax-disclosure",
  //   icon: Tag,
  // },
  // {
  //   title: "Third-Party Services Policy",
  //   description:
  //     "Information about third-party services we use and liability limitations.",
  //   href: "/policies/third-party-services-policy",
  //   icon: Building2,
  // },
  // {
  //   title: "Marketing & Communication Policy",
  //   description: "How we communicate with you and manage your preferences.",
  //   href: "/policies/marketing-and-communication-policy",
  //   icon: Megaphone,
  // },
  // {
  //   title: "Accessibility Statement",
  //   description: "Our commitment to making our website accessible to everyone.",
  //   href: "/policies/accessibility-statement",
  //   icon: Accessibility,
  // },
];

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal & Policies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transparency is important to us. Below you&apos;ll find all our
            policies that govern your use of Gadgets Kabila and protect your
            rights as a customer.
          </p>
        </div>

        {/* Policies Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((policy) => {
            const Icon = policy.icon;
            return (
              <Link
                key={policy.href}
                href={policy.href}
                className="group block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {policy.title}
                      </h3>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {policy.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                Questions about our policies?
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                If you have any questions or concerns about our policies, please
                don&apos;t hesitate to{" "}
                <Link
                  href="/policies/contact-information-policy"
                  className="underline hover:text-blue-900"
                >
                  contact us
                </Link>
                . We&apos;re here to help and ensure your experience with
                Gadgets Kabila is transparent and secure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
