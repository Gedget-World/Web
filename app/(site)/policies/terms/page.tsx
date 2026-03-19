import Markdown from "react-markdown";
import { getMarkdownContent } from "@/lib/markdown";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <Markdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-4xl font-bold mb-6 mt-8 text-gray-900 border-b pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-3xl font-bold mb-5 mt-7 text-gray-900">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-2xl font-bold mb-4 mt-6 text-gray-800">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-xl font-semibold mb-3 mt-5 text-gray-800">
                    {children}
                  </h4>
                ),
                h5: ({ children }) => (
                  <h5 className="text-lg font-semibold mb-2 mt-4 text-gray-700">
                    {children}
                  </h5>
                ),
                h6: ({ children }) => (
                  <h6 className="text-base font-semibold mb-2 mt-3 text-gray-600">
                    {children}
                  </h6>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-gray-700">
                    {children}
                  </p>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-colors duration-200"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-gray-700">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2 mb-4 ml-6 list-disc">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-2 mb-4 ml-6 list-decimal">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 italic text-gray-700">
                    {children}
                  </blockquote>
                ),
                code: ({ children, node, ...props }) => {
                  const isInline = node?.tagName !== "pre";
                  return isInline ? (
                    <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4">
                    {children}
                  </pre>
                ),
                hr: () => <hr className="my-8 border-t-2 border-gray-200" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-200">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-gray-50">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b">
                    {children}
                  </td>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg shadow-md mb-4 mx-auto"
                  />
                ),
              }}
            >
              {termsMarkdown}
            </Markdown>
          </div>
        </div>
      </section>
    </>
  );
}
