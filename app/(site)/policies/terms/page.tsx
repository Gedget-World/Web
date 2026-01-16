import Markdown from "react-markdown";

export default function TermsPage() {
  return (
    <>
      <section className="max-w-4xl mt-10 mb-10 mx-auto px-4">
        <div className="prose prose-lg max-w-none">
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
              {`# Terms of Service

## Introduction

Welcome to our platform! These terms and conditions outline the rules and regulations for the use of our website.

### Tech & Trust

Built on modern, secure technology, our platform protects every click, tap, and transaction. From encrypted payments to real-time fraud detection, we use enterprise-grade systems to keep your data private and your orders safe. Transparent policies, verified sellers, and smart logistics ensure that what you see is exactly what you get—on time, every time.

> **Important Notice**: By accessing this website, we assume you accept these terms and conditions. Do not continue to use our website if you do not agree to take all of the terms and conditions stated on this page.

**Why customers trust us:**

* 🔐 End-to-end encrypted payments
* 🛡️ AI-powered fraud & risk monitoring
* 📦 Real-time order tracking & alerts
* 🧾 Clear pricing, returns & refunds
* ⭐ Verified reviews & seller ratings

#### Technical Specifications

Here are some key technical details:

1. **SSL Encryption**: All data transmission uses \`TLS 1.3\` protocol
2. **Database Security**: MongoDB with encrypted storage
3. **Payment Processing**: Integrated with [Stripe](https://stripe.com) and [PayPal](https://paypal.com)
4. **API Rate Limiting**: 1000 requests per minute per user

##### Code Example

Here's how our API authentication works:

\`\`\`javascript
// API Authentication
const authToken = await generateToken({
  userId: user.id,
  expiresIn: '24h'
});

fetch('/api/orders', {
  headers: {
    'Authorization': \`Bearer \${authToken}\`
  }
});
\`\`\`

---

## Service Comparison

| Feature | Basic Plan | Premium Plan | Enterprise |
|---------|------------|--------------|------------|
| Products | 100 | 1,000 | Unlimited |
| Storage | 1GB | 10GB | 100GB |
| Support | Email | Phone + Email | 24/7 Dedicated |
| Price | $9/month | $29/month | Custom |

###### Additional Features

Some *additional features* include:

- **Real-time notifications**
- *Mobile app support*
- Custom branding options
- Advanced analytics dashboard

> "This platform has revolutionized our e-commerce experience. The security features are top-notch!" 
> 
> — *Customer Review*

For more information, visit our [documentation](https://docs.example.com) or contact our [support team](mailto:support@example.com).

**Button Titles & Navigation**

These are the primary actions available throughout the platform.
`}
            </Markdown>
          </div>
        </div>
      </section>
    </>
  );
}
