"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, Key, Loader2 } from "lucide-react";
import Link from "next/link";

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export default function NewRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const roleId = searchParams.get("id");
  const isEditMode = !!roleId;

  const [role, setRole] = useState({
    name: "",
    description: "",
  });

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [existingPermissions, setExistingPermissions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: false,
  });

  // Fetch all permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      const { data } = await supabase
        .from("permissions")
        .select("*")
        .order("name");
      if (data) setPermissions(data);
    };
    fetchPermissions();
  }, [supabase]);

  // Fetch existing role data if editing
  useEffect(() => {
    if (roleId) {
      const fetchRole = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("roles")
          .select("*")
          .eq("id", roleId)
          .single();

        if (data && !error) {
          setRole({
            name: data.name,
            description: data.description || "",
          });

          // Fetch existing role permissions
          const { data: permData } = await supabase
            .from("role_permissions")
            .select("permission_id")
            .eq("role_id", roleId);

          if (permData) {
            const permIds = permData.map((p) => p.permission_id);
            setSelectedPermissions(permIds);
            setExistingPermissions(permIds);
          }
        }
        setLoading(false);
      };
      fetchRole();
    }
  }, [roleId, supabase]);

  const handleChange = (key: string, value: string) => {
    setRole((prev) => ({ ...prev, [key]: value }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(permissions.map((p) => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const validate = () => {
    const newErrors = {
      name: false,
    };
    let isValid = true;

    if (!role.name.trim()) {
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
      if (isEditMode) {
        // Update role
        const { error: updateError } = await supabase
          .from("roles")
          .update({
            name: role.name,
            description: role.description || null,
          })
          .eq("id", roleId);

        if (updateError) throw updateError;

        // Update role permissions
        // Remove permissions that were deselected
        const permissionsToRemove = existingPermissions.filter(
          (p) => !selectedPermissions.includes(p),
        );
        if (permissionsToRemove.length > 0) {
          await supabase
            .from("role_permissions")
            .delete()
            .eq("role_id", roleId)
            .in("permission_id", permissionsToRemove);
        }

        // Add new permissions
        const permissionsToAdd = selectedPermissions.filter(
          (p) => !existingPermissions.includes(p),
        );
        if (permissionsToAdd.length > 0) {
          await supabase.from("role_permissions").insert(
            permissionsToAdd.map((permId) => ({
              role_id: roleId,
              permission_id: permId,
            })),
          );
        }
      } else {
        // Create new role
        const { data: newRole, error: createError } = await supabase
          .from("roles")
          .insert([
            {
              name: role.name,
              description: role.description || null,
            },
          ])
          .select()
          .single();

        if (createError) {
          if (createError.code === "23505") {
            alert("A role with this name already exists.");
            setSubmitting(false);
            return;
          }
          throw createError;
        }

        // Add permissions for new role
        if (selectedPermissions.length > 0 && newRole) {
          await supabase.from("role_permissions").insert(
            selectedPermissions.map((permId) => ({
              role_id: newRole.id,
              permission_id: permId,
            })),
          );
        }
      }

      router.push("/admin/dashboard/Roles");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} role:`,
        error,
      );
      alert(
        `Error ${isEditMode ? "updating" : "creating"} role. Please try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/Roles">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" />
          {isEditMode ? "Edit Role" : "Create New Role"}
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Details */}
            <Card>
              <CardHeader>
                <CardTitle>Role Details</CardTitle>
                <CardDescription>
                  Set the role name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Role Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={role.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., superadmin, manager, support"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs font-semibold">
                      Role name is required.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={role.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Describe what this role is for"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>
                  Overview of selected permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Selected Permissions
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {selectedPermissions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">
                      Available Permissions
                    </span>
                    <span className="text-2xl font-bold text-gray-600">
                      {permissions.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Permissions */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" /> Permissions
                  </CardTitle>
                  <CardDescription>
                    Select the permissions this role should have
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllPermissions}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllPermissions}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No permissions available. Create some permissions first.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className={`flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedPermissions.includes(permission.id)
                          ? "border-blue-500 bg-blue-50/50"
                          : ""
                      }`}
                      onClick={() => handlePermissionToggle(permission.id)}
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
            <Link href="/admin/dashboard/Roles">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
