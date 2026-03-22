"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef, useState } from "react";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string | null;
    slug: string;
  } | null;
};

type OrderData = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  discount_amount: number | null;
  coupon_code: string | null;
  customer_name: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  order_items: OrderItem[];
};

export function InvoiceDownloadButton({ order }: { order: OrderData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generateInvoice = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 1.5, // was 2
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8); // was "image/png"
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight); // was "PNG"
      pdf.save(`Invoice-${order.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Error generating invoice:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const subtotal = order.total - 10 + (order.discount_amount || 0); // total - shipping + discount back
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <Button
        onClick={generateInvoice}
        disabled={isGenerating}
        variant="outline"
        size="sm"
        className="gap-2 cursor-pointer"
      >
        <Download className="h-4 w-4" />
        {isGenerating ? "Generating..." : "Invoice"}
      </Button>

      {/* Hidden Invoice Template - Using inline styles for html2canvas compatibility */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div
          ref={invoiceRef}
          style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            width: "210mm",
            fontFamily: "system-ui, sans-serif",
            color: "#0f172a",
          }}
        >
          {/* ============ HEADER ============ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "24px",
              marginBottom: "24px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Gadget Kabila
              </h1>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                Your One-Stop Gadget Shop
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#94a3b8",
                }}
              >
                INVOICE
              </div>
              <div
                style={{ fontSize: "14px", color: "#475569", marginTop: "8px" }}
              >
                <p style={{ margin: "4px 0" }}>
                  <span style={{ color: "#94a3b8" }}>Invoice #:</span>{" "}
                  <span style={{ fontWeight: "600" }}>
                    INV-{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </p>
                <p style={{ margin: "4px 0" }}>
                  <span style={{ color: "#94a3b8" }}>Date:</span>{" "}
                  {formatDate(order.created_at)}
                </p>
                <p style={{ marginTop: "8px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor:
                        order.status === "delivered"
                          ? "#dcfce7"
                          : order.status === "cancelled"
                            ? "#fee2e2"
                            : "#fef9c3",
                      color:
                        order.status === "delivered"
                          ? "#15803d"
                          : order.status === "cancelled"
                            ? "#dc2626"
                            : "#a16207",
                    }}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ============ BILLING & SHIPPING ============ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "32px",
              marginBottom: "32px",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Bill To
              </h3>
              <div style={{ color: "#334155" }}>
                <p
                  style={{
                    fontWeight: "600",
                    color: "#0f172a",
                    margin: "4px 0",
                  }}
                >
                  {order.customer_name || "Customer"}
                </p>
                {order.customer_email && (
                  <p style={{ fontSize: "14px", margin: "4px 0" }}>
                    {order.customer_email}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Ship To
              </h3>
              <div style={{ color: "#334155", fontSize: "14px" }}>
                <p
                  style={{
                    fontWeight: "600",
                    color: "#0f172a",
                    margin: "4px 0",
                  }}
                >
                  {order.customer_name || "Customer"}
                </p>
                {order.shipping_address && (
                  <p style={{ margin: "4px 0" }}>{order.shipping_address}</p>
                )}
                <p style={{ margin: "4px 0" }}>
                  {[order.shipping_city, order.shipping_postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {order.shipping_country && (
                  <p style={{ margin: "4px 0" }}>{order.shipping_country}</p>
                )}
              </div>
            </div>
          </div>

          {/* ============ ITEMS TABLE ============ */}
          <div style={{ marginBottom: "32px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Price
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item, index) => (
                  <tr
                    key={item.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <p
                        style={{
                          fontWeight: "500",
                          color: "#0f172a",
                          fontSize: "14px",
                          margin: 0,
                        }}
                      >
                        {item.products?.name || "Product"}
                      </p>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        color: "#475569",
                        fontSize: "14px",
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#475569",
                        fontSize: "14px",
                      }}
                    >
                      ₹{Number(item.price).toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        fontWeight: "600",
                        color: "#0f172a",
                        fontSize: "14px",
                      }}
                    >
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============ SUMMARY ============ */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "32px",
            }}
          >
            <div style={{ width: "256px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#64748b" }}>Subtotal</span>
                <span style={{ color: "#0f172a" }}>₹{subtotal.toFixed(0)}</span>
              </div>
              {order.discount_amount && order.discount_amount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    fontSize: "14px",
                    color: "#16a34a",
                  }}
                >
                  <span>
                    Discount{" "}
                    {order.coupon_code && (
                      <span style={{ fontSize: "12px" }}>
                        ({order.coupon_code})
                      </span>
                    )}
                  </span>
                  <span>-₹{order.discount_amount.toFixed(0)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: "14px",
                }}
              >
                <span style={{ color: "#64748b" }}>Shipping</span>
                <span style={{ color: "#0f172a" }}>₹10</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "2px solid #e2e8f0",
                  marginTop: "8px",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#0f172a" }}>
                  Total
                </span>
                <span
                  style={{
                    fontWeight: "bold",
                    color: "#0f172a",
                    fontSize: "18px",
                  }}
                >
                  ₹{order.total.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* ============ FOOTER ============ */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p
                style={{ color: "#475569", fontSize: "14px", margin: "4px 0" }}
              >
                Thank you for shopping with{" "}
                <span style={{ fontWeight: "600" }}>Gadget Kabila</span>!
              </p>
              <p
                style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}
              >
                For queries, contact us at support@gadgetkabila.com
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "16px",
              }}
            >
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}
              >
                Terms & Conditions
              </h4>
              <ul
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  margin: 0,
                  paddingLeft: 0,
                  listStyle: "none",
                }}
              >
                <li style={{ marginBottom: "4px" }}>
                  • This is a computer-generated invoice and does not require a
                  signature.
                </li>
                <li style={{ marginBottom: "4px" }}>
                  • Products once sold are non-refundable unless defective.
                </li>
                <li>
                  • For returns and exchanges, please refer to our return
                  policy.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
