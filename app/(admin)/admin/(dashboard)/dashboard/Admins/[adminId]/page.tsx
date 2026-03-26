"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Key,
  ScrollText,
  User,
  Pencil,
} from "lucide-react";

interface Admin {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean | null;
  is_locked: boolean | null;
  role_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
}

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

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  ip_address: string | null;
}

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [directPermissions, setDirectPermissions] = useState<Permission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch(`/api/admins/${adminId}`);
        const result = await res.json();

        if (result.success) {
          setAdmin(result.data.admin);
          setRole(result.data.role);
          setRolePermissions(result.data.rolePermissions || []);
          setDirectPermissions(result.data.directPermissions || []);
          setAuditLogs(result.data.auditLogs || []);
        } else {
          console.error("Failed to fetch admin:", result.error);
        }
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (adminId) {
      fetchAdminData();
    }
  }, [adminId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Admin not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/dashboard/Admins")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              Admin Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Admin ID: {admin.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/dashboard/Admins/new?id=${admin.id}`)
            }
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {admin.is_verified ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">
              <XCircle className="w-3 h-3 mr-1" />
              Not Verified
            </Badge>
          )}
        </div>
      </div>

      {/* Admin Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{admin.name || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{admin.email}</span>
                <button
                  onClick={() => copyToClipboard(admin.email, "email")}
                  className="p-1 hover:bg-gray-100 rounded transition-all"
                  title="Copy email"
                >
                  {copied === "email" ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role Name</span>
              {role ? (
                <Badge variant="secondary">{role.name}</Badge>
              ) : (
                <span className="text-gray-400">No Role Assigned</span>
              )}
            </div>
            {role?.description && (
              <div>
                <span className="text-sm text-muted-foreground">
                  Description
                </span>
                <p className="text-sm mt-1">{role.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="font-medium">
                {formatDate(admin.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Last Updated
              </span>
              <span className="font-medium">
                {formatDate(admin.updated_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permissions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Role Permissions
              {rolePermissions.length > 0 && (
                <Badge variant="outline">{rolePermissions.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rolePermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No role permissions assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rolePermissions.map((perm) => (
                  <Badge
                    key={perm.id}
                    variant="secondary"
                    className="text-xs"
                    title={perm.description || undefined}
                  >
                    {perm.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Direct Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Direct Permissions
              {directPermissions.length > 0 && (
                <Badge variant="outline">{directPermissions.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {directPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No direct permissions assigned.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {directPermissions.map((perm) => (
                  <Badge
                    key={perm.id}
                    variant="outline"
                    className="text-xs"
                    title={perm.description || undefined}
                  >
                    {perm.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{log.entity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entity_id
                        ? `${log.entity_id.substring(0, 8)}...`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.ip_address || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
