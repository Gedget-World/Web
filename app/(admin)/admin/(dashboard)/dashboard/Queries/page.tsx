"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  MoreHorizontalIcon,
  Mail,
  Phone,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  text: string;
  admin_name: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  message: string;
  status: string;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "read", label: "Read", color: "bg-gray-100 text-gray-800" },
  {
    value: "in-progress",
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "archived",
    label: "Archived",
    color: "bg-slate-100 text-slate-800",
  },
];

export default function QueriesPage() {
  const { admin } = useAdminSession();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<ContactMessage | null>(
    null,
  );
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const limit = 10;
  const supabase = createClient();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("contact_messages")
      .select("*", { count: "exact" });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (error) {
      showNotification("error", "Failed to fetch messages");
      console.error("Error fetching messages:", error);
    } else if (data) {
      setMessages(data);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    const icon = {
      new: <AlertCircle className="w-3 h-3 mr-1" />,
      read: <Eye className="w-3 h-3 mr-1" />,
      "in-progress": <Clock className="w-3 h-3 mr-1" />,
      resolved: <CheckCircle className="w-3 h-3 mr-1" />,
      archived: <Archive className="w-3 h-3 mr-1" />,
    }[status];

    return (
      <Badge className={statusOption?.color || "bg-gray-100 text-gray-800"}>
        {icon}
        {statusOption?.label || status}
      </Badge>
    );
  };

  const updateStatus = async (messageId: string, newStatus: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: newStatus })
      .eq("id", messageId);

    if (error) {
      showNotification("error", "Failed to update status");
      console.error("Error updating status:", error);
      return;
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: newStatus } : msg,
      ),
    );
    if (viewingMessage?.id === messageId) {
      setViewingMessage((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
    showNotification("success", `Status updated to ${newStatus}`);
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setViewingMessage(message);

    // Mark as read if new
    if (message.status === "new") {
      await updateStatus(message.id, "read");
    }
  };

  const addComment = async () => {
    if (!viewingMessage || !newComment.trim()) return;

    setSubmitting(true);

    const comment: Comment = {
      text: newComment.trim(),
      admin_name: admin?.name || admin?.email || "Admin",
      created_at: new Date().toISOString(),
    };

    const updatedComments = [...(viewingMessage.comments || []), comment];

    const { error } = await supabase
      .from("contact_messages")
      .update({ comments: updatedComments })
      .eq("id", viewingMessage.id);

    if (error) {
      showNotification("error", "Failed to add note");
      console.error("Error adding comment:", error);
    } else {
      setViewingMessage({ ...viewingMessage, comments: updatedComments });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === viewingMessage.id
            ? { ...msg, comments: updatedComments }
            : msg,
        ),
      );
      setNewComment("");
      showNotification("success", "Note added successfully");
    }

    setSubmitting(false);
  };

  const confirmDelete = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", messageToDelete);

    if (error) {
      showNotification("error", "Failed to delete message");
      console.error("Error deleting message:", error);
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));
      setTotalCount((prev) => prev - 1);
      if (viewingMessage?.id === messageToDelete) {
        setViewingMessage(null);
      }
      showNotification("success", "Message deleted successfully");
    }

    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const totalPages = Math.ceil(totalCount / limit);

  // Count new messages
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="p-6">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customer Queries</h1>
        <p className="text-sm text-gray-600">Manage contact form submissions</p>
      </div>

      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{totalCount}</span>
            </p>
            {statusFilter === "all" && newCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800">
                {newCount} new
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMessages()}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-gray-500"
                >
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow
                  key={message.id}
                  className={message.status === "new" ? "bg-blue-50/50" : ""}
                >
                  <TableCell className="font-medium">
                    {message.first_name} {message.last_name}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${message.email}`}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {message.email.length > 25
                        ? `${message.email.slice(0, 25)}...`
                        : message.email}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-gray-600">{message.message}</p>
                  </TableCell>
                  <TableCell>{getStatusBadge(message.status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(message.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          aria-label="Open menu"
                          size="icon"
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-44" align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleViewMessage(message)}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              window.open(`mailto:${message.email}`, "_blank")
                            }
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          {message.phone_number && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                window.open(
                                  `tel:${message.phone_number}`,
                                  "_blank",
                                )
                              }
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Call
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          {STATUS_OPTIONS.filter(
                            (s) => s.value !== message.status,
                          ).map((status) => (
                            <DropdownMenuItem
                              key={status.value}
                              className="cursor-pointer"
                              onClick={() =>
                                updateStatus(message.id, status.value)
                              }
                            >
                              Mark as {status.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600"
                          onClick={() => confirmDelete(message.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Message Dialog */}
      <Dialog
        open={!!viewingMessage}
        onOpenChange={() => setViewingMessage(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message from {viewingMessage?.first_name}{" "}
              {viewingMessage?.last_name}
            </DialogTitle>
          </DialogHeader>

          {viewingMessage && (
            <div className="space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href={`mailto:${viewingMessage.email}`}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-4 h-4" />
                    {viewingMessage.email}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  {viewingMessage.phone_number ? (
                    <a
                      href={`tel:${viewingMessage.phone_number}`}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      {viewingMessage.phone_number}
                    </a>
                  ) : (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Select
                    value={viewingMessage.status}
                    onValueChange={(v) => updateStatus(viewingMessage.id, v)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Received</p>
                  <p className="text-sm">
                    {formatDate(viewingMessage.created_at)}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Message</p>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {viewingMessage.message}
                  </p>
                </div>
              </div>

              {/* Comments/Notes */}
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Internal Notes ({viewingMessage.comments?.length || 0})
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {viewingMessage.comments &&
                  viewingMessage.comments.length > 0 ? (
                    viewingMessage.comments.map((comment, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg"
                      >
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {comment.admin_name} •{" "}
                          {formatDate(comment.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No notes yet</p>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add an internal note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button
                  size="sm"
                  onClick={addComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Add Note
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingMessage(null)}>
              Close
            </Button>
            <Button
              onClick={() =>
                window.open(`mailto:${viewingMessage?.email}`, "_blank")
              }
            >
              <Mail className="h-4 w-4 mr-2" />
              Reply via Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMessageToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMessage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
