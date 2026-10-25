"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import {
  DEFAULT_INVOICE_TEMPLATE,
  buildInvoiceDocument,
  renderInvoiceTemplate,
  type InvoiceTemplateData,
} from "@/lib/invoice-template";
import { Eye, Loader2, Save } from "lucide-react";

const PREVIEW_DATA: InvoiceTemplateData = {
  store_name: "Gadgets Kabila",
  store_logo: BASE_LOGO.src,
  invoice_number: "INV-2026-001",
  invoice_date: "25 Oct 2026",
  order_id: "DB1E2ADB",
  order_date: "10 Sep 2026",
  customer_name: "Sample Customer",
  customer_email: "customer@example.com",
  customer_phone: "+91 98765 43210",
  shipping_address: "12 Sample Road, Bengaluru, Karnataka, 560001",
  currency_symbol: "₹",
  subtotal: "2,499.00",
  discount: "100.00",
  shipping: "Free",
  total: "2,399.00",
  items: [
    {
      name: "Wireless Headphones",
      quantity: "1",
      unit_price: "1,499.00",
      total: "1,499.00",
    },
    {
      name: "Smart Watch",
      quantity: "1",
      unit_price: "1,000.00",
      total: "1,000.00",
    },
  ],
};

export default function InvoiceTemplatePage() {
  const { toast } = useToast();
  const [template, setTemplate] = useState(DEFAULT_INVOICE_TEMPLATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch("/api/admin/invoice-template");
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load invoice template");
        }
        if (typeof result.template === "string") {
          setTemplate(result.template);
        }
      } catch (error) {
        toast({
          title: "Couldn't load invoice template",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadTemplate();
  }, [toast]);

  const previewDocument = useMemo(
    () =>
      buildInvoiceDocument(renderInvoiceTemplate(template, PREVIEW_DATA)),
    [template],
  );

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/invoice-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save invoice template");
      }
      toast({
        title: "Invoice template saved",
        description: "New downloads will use this format.",
      });
    } catch (error) {
      toast({
        title: "Couldn't save invoice template",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Invoice Template</h1>
        <p className="text-sm text-muted-foreground">
          Edit the HTML and CSS used for customer invoices. Changes apply to
          future downloads; invoice files are generated on demand and not stored.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>HTML and CSS</CardTitle>
            <CardDescription>
              Edit the complete document. Use the placeholders below to insert
              order data. Item placeholders go inside the items block.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="invoice-template">Template source</Label>
              <Textarea
                id="invoice-template"
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                className="mt-2 min-h-[520px] resize-y font-mono text-xs leading-5"
                spellCheck={false}
                disabled={isLoading || isSaving}
              />
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-xs leading-5">
              <p className="mb-1 font-semibold">Available placeholders</p>
              <p>
                {`{{store_name}}, {{store_logo}}, {{invoice_number}}, {{invoice_date}}, {{order_id}}, {{order_date}}, {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{shipping_address}}, {{currency_symbol}}, {{subtotal}}, {{discount}}, {{shipping}}, {{total}}`}
              </p>
              <p className="mt-2">
                Repeat each order item with{" "}
                <code>{"{{#items}}...{{/items}}"}</code>. Inside the block:
                <code>{" {{name}}, {{quantity}}, {{unit_price}}, {{total}}"}</code>.
              </p>
            </div>
            <Button onClick={saveTemplate} disabled={isLoading || isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Preview with sample order data. Customer downloads use the same
              template with the actual delivered order details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <iframe
              title="Invoice template preview"
              srcDoc={previewDocument}
              sandbox="allow-same-origin"
              referrerPolicy="no-referrer"
              className="h-[720px] w-full rounded-md border bg-white"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
