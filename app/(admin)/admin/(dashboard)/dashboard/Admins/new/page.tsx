"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "lodash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Check, X, Loader2, ShieldCheck, Key } from "lucide-react";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

function NewAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const adminId = searchParams.get("id");
  const isEditMode = !!adminId;

  const [admin, setAdmin] = useState({
    email: "",
    password: "",
    name: "",
    role_id: "",
    is_verified: false,
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [existingPermissions, setExistingPermissions] = useState<string[]>([]);

  const [emailStatus, setEmailStatus] = useState<
    "checking" | "available" | "taken" | ""
  >("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");

  const [errors, setErrors] = useState({
    email: false,
    password: false,
    name: false,
  });

  // Fetch roles and permissions
  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      const [rolesResult, permissionsResult] = await Promise.all([
        supabase.from("roles").select("*").order("name"),
        supabase.from("permissions").select("*").order("name"),
      ]);

      if (rolesResult.data) setRoles(rolesResult.data);
      if (permissionsResult.data) setPermissions(permissionsResult.data);
    };
    fetchRolesAndPermissions();
  }, [supabase]);

  // Fetch existing admin data if editing
  useEffect(() => {
    if (adminId) {
      const fetchAdmin = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("admins")
          .select("*")
          .eq("id", adminId)
          .single();

        if (data && !error) {
          setOriginalEmail(data.email);
          setAdmin({
            email: data.email,
            password: "", // Don't load password
            name: data.name || "",
            role_id: data.role_id || "",
            is_verified: data.is_verified || false,
          });
          setEmailStatus("available");

          // Fetch existing direct permissions
          const { data: permData } = await supabase
            .from("admin_permissions")
            .select("permission_id")
            .eq("admin_id", adminId);

          if (permData) {
            const permIds = permData.map((p) => p.permission_id);
            setSelectedPermissions(permIds);
            setExistingPermissions(permIds);
          }
        }
        setLoading(false);
      };
      fetchAdmin();
    }
  }, [adminId, supabase]);

  const handleChange = (key: string, value: any) => {
    setAdmin((prev) => ({ ...prev, [key]: value }));
  };

  // Check if email is unique
  const checkEmail = useCallback(
    debounce(async (value: string) => {
      if (!value || !value.includes("@")) {
        setEmailStatus("");
        return;
      }
      // Skip check if editing and email hasn't changed
      if (isEditMode && value.toLowerCase() === originalEmail.toLowerCase()) {
        setEmailStatus("available");
        return;
      }
      setEmailStatus("checking");

      const { data } = await supabase
        .from("admins")
        .select("id")
        .eq("email", value.toLowerCase())
        .maybeSingle();

      setEmailStatus(data ? "taken" : "available");
    }, 500),
    [isEditMode, originalEmail, supabase],
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim();
    handleChange("email", value);
    checkEmail(value);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const validate = () => {
    const newErrors = {
      email: false,
      password: false,
      name: false,
    };
    let isValid = true;

    // Email validation
    const emailUnchanged =
      isEditMode && admin.email.toLowerCase() === originalEmail.toLowerCase();
    if (
      !admin.email.trim() ||
      !admin.email.includes("@") ||
      (emailStatus === "taken" && !emailUnchanged)
    ) {
      newErrors.email = true;
      isValid = false;
    }

    // Password validation (required for new admin only)
    if (!isEditMode && !admin.password.trim()) {
      newErrors.password = true;
      isValid = false;
    }

    // Password strength validation (if provided)
    if (admin.password && admin.password.length < 8) {
      newErrors.password = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    try {
      if (isEditMode) {
        // Update admin
        const updateData: Record<string, any> = {
          email: admin.email.toLowerCase(),
          name: admin.name || null,
          role_id: admin.role_id || null,
          is_verified: admin.is_verified,
          updated_at: new Date().toISOString(),
        };

        // Only update password if provided
        if (admin.password) {
          // Hash password using a simple approach (in production, use bcrypt on server)
          updateData.password_hash = admin.password; // Should be hashed server-side
        }

        const { error: updateError } = await supabase
          .from("admins")
          .update(updateData)
          .eq("id", adminId);

        if (updateError) throw updateError;

        // Update direct permissions
        // First, remove permissions that were deselected
        const permissionsToRemove = existingPermissions.filter(
          (p) => !selectedPermissions.includes(p),
        );
        if (permissionsToRemove.length > 0) {
          await supabase
            .from("admin_permissions")
            .delete()
            .eq("admin_id", adminId)
            .in("permission_id", permissionsToRemove);
        }

        // Add new permissions
        const permissionsToAdd = selectedPermissions.filter(
          (p) => !existingPermissions.includes(p),
        );
        if (permissionsToAdd.length > 0) {
          await supabase.from("admin_permissions").insert(
            permissionsToAdd.map((permId) => ({
              admin_id: adminId,
              permission_id: permId,
            })),
          );
        }
      } else {
        // Create new admin
        const { data: newAdmin, error: createError } = await supabase
          .from("admins")
          .insert([
            {
              email: admin.email.toLowerCase(),
              password_hash: admin.password, // Should be hashed server-side
              name: admin.name || null,
              role_id: admin.role_id || null,
              is_verified: admin.is_verified,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;

        // Add direct permissions for new admin
        if (selectedPermissions.length > 0 && newAdmin) {
          await supabase.from("admin_permissions").insert(
            selectedPermissions.map((permId) => ({
              admin_id: newAdmin.id,
              permission_id: permId,
            })),
          );
        }
      }

      router.push("/admin/dashboard/Admins");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} admin:`,
        error,
      );
      alert(
        `Error ${isEditMode ? "updating" : "creating"} admin. Please try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/Admins">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          {isEditMode ? "Edit Admin" : "Create New Admin"}
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set the admin account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={admin.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., John Doe"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={admin.email}
                      onChange={handleEmailChange}
                      placeholder="e.g., admin@example.com"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {emailStatus && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailStatus === "checking" && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {emailStatus === "available" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {emailStatus === "taken" && (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs font-semibold">
                      {emailStatus === "taken"
                        ? "This email is already registered."
                        : "Valid email is required."}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password{" "}
                    {!isEditMode && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={admin.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder={
                      isEditMode
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs font-semibold">
                      {admin.password && admin.password.length < 8
                        ? "Password must be at least 8 characters."
                        : "Password is required."}
                    </p>
                  )}
                  {isEditMode && (
                    <p className="text-xs text-muted-foreground">
                      Leave blank to keep the current password
                    </p>
                  )}
                </div>

                {/* Verified Status */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verified Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Mark this admin as verified
                    </p>
                  </div>
                  <Switch
                    checked={admin.is_verified}
                    onCheckedChange={(checked) =>
                      handleChange("is_verified", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Role Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Role Assignment
                </CardTitle>
                <CardDescription>
                  Assign a role to define base permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={admin.role_id}
                    onValueChange={(value) =>
                      handleChange("role_id", value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {admin.role_id && (
                    <p className="text-xs text-muted-foreground">
                      {roles.find((r) => r.id === admin.role_id)?.description ||
                        ""}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Direct Permissions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" /> Direct Permissions
              </CardTitle>
              <CardDescription>
                Assign additional permissions directly to this admin (beyond
                role permissions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No permissions available.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() =>
                          handlePermissionToggle(permission.id)
                        }
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={permission.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.name}
                        </label>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/admin/dashboard/Admins">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Admin" : "Create Admin"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function NewAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <NewAdminContent />
    </Suspense>
  );
}
