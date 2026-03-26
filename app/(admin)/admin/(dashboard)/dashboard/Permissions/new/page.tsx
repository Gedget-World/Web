"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Key, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewPermissionPage() {
  const router = useRouter();

  const [permission, setPermission] = useState({
    name: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: false,
  });

  const handleChange = (key: string, value: string) => {
    setPermission((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const newErrors = {
      name: false,
    };
    let isValid = true;

    if (!permission.name.trim()) {
      newErrors.name = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: permission.name,
          description: permission.description || null,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        if (result.error?.includes("already exists")) {
          alert("A permission with this name already exists.");
        } else {
          alert(result.error || "Error creating permission. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      router.push("/admin/dashboard/Permissions");
    } catch (error) {
      console.error("Error creating permission:", error);
      alert("Error creating permission. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/Permissions">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="h-6 w-6 text-amber-600" />
          Create New Permission
        </h1>
      </header>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Permission Details</CardTitle>
          <CardDescription>
            Create a new permission that can be assigned to roles or admins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Permission Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={permission.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., create_product, delete_user, manage_orders"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-500 text-xs font-semibold">
                Permission name is required.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use lowercase with underscores (e.g., create_product)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={permission.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what this permission allows the user to do"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Link href="/admin/dashboard/Permissions">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Permission
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
