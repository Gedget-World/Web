"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

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
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch("/api/admins/roles"),
        fetch("/api/admins/permissions"),
      ]);

      const rolesData = await rolesRes.json();
      const permissionsData = await permissionsRes.json();

      if (rolesData.success) setRoles(rolesData.data);
      if (permissionsData.success) setPermissions(permissionsData.data);
    };
    fetchRolesAndPermissions();
  }, []);

  // Fetch role permissions when role changes
  useEffect(() => {
    const fetchRolePermissions = async () => {
      if (!admin.role_id) {
        setRolePermissions([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/admins/roles/${admin.role_id}/permissions`,
        );
        const result = await res.json();
        if (result.success && result.data) {
          const rolePermIds = result.data.map((p: Permission) => p.id);
          setRolePermissions(rolePermIds);

          // Remove direct permissions that are now covered by the role
          setSelectedPermissions((prev) =>
            prev.filter((permId) => !rolePermIds.includes(permId)),
          );
        } else {
          setRolePermissions([]);
        }
      } catch (error) {
        console.error("Error fetching role permissions:", error);
        setRolePermissions([]);
      }
    };
    fetchRolePermissions();
  }, [admin.role_id]);

  // Fetch existing admin data if editing
  useEffect(() => {
    if (adminId) {
      const fetchAdmin = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/admins/${adminId}`);
          const result = await res.json();

          if (result.success && result.data.admin) {
            const data = result.data.admin;
            setOriginalEmail(data.email);
            setAdmin({
              email: data.email,
              password: "", // Don't load password
              name: data.name || "",
              role_id: data.role_id || "",
              is_verified: data.is_verified || false,
            });
            setEmailStatus("available");

            // Get existing direct permissions from the API response
            if (result.data.directPermissions) {
              const permIds = result.data.directPermissions.map(
                (p: any) => p.id,
              );
              setSelectedPermissions(permIds);
              setExistingPermissions(permIds);
            }

            // Fetch role permissions if admin has a role assigned
            if (data.role_id) {
              try {
                const rolePermRes = await fetch(
                  `/api/admins/roles/${data.role_id}/permissions`,
                );
                const rolePermResult = await rolePermRes.json();
                if (rolePermResult.success && rolePermResult.data) {
                  const rolePermIds = rolePermResult.data.map(
                    (p: Permission) => p.id,
                  );
                  setRolePermissions(rolePermIds);

                  // Remove direct permissions that are already in role permissions
                  if (result.data.directPermissions) {
                    const filteredPermIds = result.data.directPermissions
                      .map((p: any) => p.id)
                      .filter((id: string) => !rolePermIds.includes(id));
                    setSelectedPermissions(filteredPermIds);
                    setExistingPermissions(filteredPermIds);
                  }
                }
              } catch (error) {
                console.error("Error fetching role permissions:", error);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching admin:", error);
        }
        setLoading(false);
      };
      fetchAdmin();
    }
  }, [adminId]);

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

      try {
        const res = await fetch(
          `/api/admins/check-email?email=${encodeURIComponent(value)}`,
        );
        const result = await res.json();
        setEmailStatus(result.exists ? "taken" : "available");
      } catch (error) {
        setEmailStatus("");
      }
    }, 500),
    [isEditMode, originalEmail],
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
        // Update admin via API
        const res = await fetch(`/api/admins/${adminId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: admin.email.toLowerCase(),
            password: admin.password || undefined,
            name: admin.name || null,
            role_id: admin.role_id || null,
            is_verified: admin.is_verified,
            permissions: selectedPermissions,
            existingPermissions: existingPermissions,
          }),
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error);
      } else {
        // Create new admin via API
        const res = await fetch("/api/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: admin.email.toLowerCase(),
            password: admin.password,
            name: admin.name || null,
            role_id: admin.role_id || null,
            is_verified: admin.is_verified,
            permissions: selectedPermissions,
          }),
        });

        const result = await res.json();
        if (!result.success) throw new Error(result.error);
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
                  {permissions.map((permission) => {
                    const isFromRole = rolePermissions.includes(permission.id);
                    const isDirectlySelected = selectedPermissions.includes(
                      permission.id,
                    );
                    const isChecked = isFromRole || isDirectlySelected;

                    return (
                      <div
                        key={permission.id}
                        className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${
                          isFromRole
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Checkbox
                          id={permission.id}
                          checked={isChecked}
                          disabled={isFromRole}
                          onCheckedChange={() =>
                            handlePermissionToggle(permission.id)
                          }
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor={permission.id}
                            className={`text-sm font-medium ${isFromRole ? "text-blue-700" : "cursor-pointer"}`}
                          >
                            {permission.name}
                            {isFromRole && (
                              <span className="ml-2 text-xs text-blue-500 font-normal">
                                (from role)
                              </span>
                            )}
                          </label>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
