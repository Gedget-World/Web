import { getMarkdownContent } from "@/lib/markdown";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownViewer from "@/components/markdown-viewer";

export default function TermsAndConditionsPage() {
  const termsMarkdown = getMarkdownContent(
    "content/policies/terms-and-conditions.md",
  );

  return (
    <>
      <section className="max-w-4xl mt-10 mb-10 mx-auto px-4">
        <div className="prose prose-lg max-w-none">
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/policies"
              className="text-black hover:text-blue-800 decoration-2 underline-offset-2 transition-colors duration-200"
            >
              <Button variant={"outline"} className="cursor-pointer">
                <ArrowLeftIcon className="inline-block mr-2" />
                Back to Policies
              </Button>
            </Link>
            {/* <div className="text-sm text-gray-600">
              Last updated: <i>January 1, 2024</i>
            </div> */}
          </div>
          <div className="space-y-4">
            <MarkdownViewer content={termsMarkdown} />
          </div>
        </div>
      </section>
    </>
  );
}
