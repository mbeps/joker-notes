"use client";

import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ExternalLink,
  FileIcon,
  FileText,
  Globe,
  Layers,
  Search,
  Trash2,
  Undo2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ConfirmModal from "@/components/modal/confirm-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipPositioner,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/config/routes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Skeleton placeholder matching the Admin Dashboard layout during data resolution.
 *
 * @returns Skeleton representation of header, metric cards, and table.
 */
function AdminDashboardSkeleton(): React.JSX.Element {
  return (
    <div
      data-testid="admin-skeleton"
      className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8"
    >
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["card-1", "card-2", "card-3", "card-4"].map((key) => (
          <Skeleton key={key} className="h-14 w-full" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/** Compact summary card matching the reference design (label left, value right). */
interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  testId: string;
}

/**
 * Compact metric card showing a label and icon on the left with the value on the right.
 *
 * @param label - Metric description.
 * @param value - Numeric value to display.
 * @param icon - Leading icon.
 * @param testId - Test identifier for assertions.
 * @returns Compact single-row metric card.
 */
function MetricCard({
  label,
  value,
  icon,
  testId,
}: MetricCardProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <span data-testid={testId} className="font-semibold text-lg">
        {value}
      </span>
    </div>
  );
}

/** Props for the per-row action button. */
interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

/**
 * Icon-only action button wrapped in a tooltip.
 *
 * @param label - Tooltip and accessibility label.
 * @param icon - Icon to display.
 * @param onClick - Click handler.
 * @param disabled - Whether the action is unavailable for the current state.
 * @param destructive - Whether the action is a dangerous operation.
 * @returns Tooltip-wrapped icon button.
 */
function ActionButton({
  label,
  icon,
  onClick,
  disabled = false,
  destructive = false,
}: ActionButtonProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={destructive ? "text-destructive" : undefined}
          >
            {icon}
          </Button>
        }
      />
      <TooltipPositioner>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPositioner>
    </Tooltip>
  );
}

/**
 * Dedicated administrative dashboard for system-wide workspace visibility and note management.
 * Protected by global administrator authorization check with automatic redirection for unprivileged users.
 *
 * @returns Administrator metrics cards and cross-author document explorer.
 * @see https://docs.convex.dev/functions/query
 */
export default function AdminPage(): React.JSX.Element {
  const router = useRouter();
  const isAdmin = useQuery(api.documents.isAdmin);
  const adminData = useQuery(
    api.documents.getAdminStats,
    isAdmin === true ? {} : "skip",
  );
  const archive = useMutation(api.documents.archive);
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);
  const [filterQuery, setFilterQuery] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});

  // Unauthorized access guard: bounce unprivileged users immediately to documents
  useEffect(() => {
    if (isAdmin === false) {
      router.replace(ROUTES.DOCUMENTS.path);
    }
  }, [isAdmin, router]);

  const userIds = useMemo(
    () => [...new Set((adminData?.documents ?? []).map((d) => d.userId))],
    [adminData?.documents],
  );

  // Resolve author user IDs to emails via the admin users API
  useEffect(() => {
    if (userIds.length === 0) return;

    let cancelled = false;
    fetch(ROUTES.ADMIN.usersApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    })
      .then((res) => res.json())
      .then((map: Record<string, string>) => {
        if (!cancelled) setEmails(map);
      })
      .catch(() => {
        if (!cancelled) setEmails({});
      });

    return () => {
      cancelled = true;
    };
  }, [userIds]);

  const filteredDocuments = useMemo(() => {
    if (!adminData?.documents) {
      return [];
    }

    const query = filterQuery.toLowerCase().trim();
    if (!query) {
      return adminData.documents;
    }

    return adminData.documents.filter((doc) => {
      const title = (doc.title || "Untitled").toLowerCase();
      const author = (emails[doc.userId] ?? doc.userId).toLowerCase();
      return title.includes(query) || author.includes(query);
    });
  }, [adminData?.documents, filterQuery, emails]);

  const subpageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of adminData?.documents ?? []) {
      if (doc.parentDocument) {
        counts.set(
          doc.parentDocument,
          (counts.get(doc.parentDocument) ?? 0) + 1,
        );
      }
    }
    return counts;
  }, [adminData?.documents]);

  if (isAdmin === false) {
    return <div className="h-full w-full bg-background" />;
  }

  if (isAdmin === undefined || adminData === undefined) {
    return <AdminDashboardSkeleton />;
  }

  const { stats } = adminData;

  const handleArchive = (id: Id<"documents">) => {
    toast.promise(archive({ id }), {
      loading: "Archiving note...",
      success: "Note archived!",
      error: "Failed to archive note.",
    });
  };

  const handleRestore = (id: Id<"documents">) => {
    toast.promise(restore({ id }), {
      loading: "Restoring note...",
      success: "Note restored!",
      error: "Failed to restore note.",
    });
  };

  const handleDelete = (id: Id<"documents">) => {
    toast.promise(remove({ id }), {
      loading: "Deleting note...",
      success: "Note deleted!",
      error: "Failed to delete note.",
    });
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 md:p-8">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            System-wide note overview and document management
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={stats.totalDocuments}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          testId="stat-total-documents"
        />
        <MetricCard
          label="Active"
          value={stats.activeDocuments}
          icon={<FileIcon className="h-4 w-4 text-muted-foreground" />}
          testId="stat-active-notes"
        />
        <MetricCard
          label="Published"
          value={stats.publishedDocuments}
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          testId="stat-published-notes"
        />
        <MetricCard
          label="Authors"
          value={stats.authorCount}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          testId="stat-unique-authors"
        />
      </div>

      {/* Document Explorer Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter notes by title or author..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <span className="text-muted-foreground text-xs">
            Showing {filteredDocuments.length} of {adminData.documents.length}{" "}
            documents
          </span>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subpages</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No documents match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => {
                  const displayTitle = doc.title || "Untitled";
                  const creationDate = new Date(
                    doc._creationTime,
                  ).toLocaleDateString();
                  const subpageCount = subpageCounts.get(doc._id) ?? 0;
                  const isArchived = doc.isArchived;

                  return (
                    <TableRow key={doc._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {doc.icon ? (
                            <span className="text-base">{doc.icon}</span>
                          ) : (
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="max-w-[200px] truncate md:max-w-[300px]">
                            {displayTitle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {emails[doc.userId] ?? doc.userId}
                      </TableCell>
                      <TableCell>
                        {doc.isArchived ? (
                          <Badge variant="destructive">Archived</Badge>
                        ) : doc.isPublished ? (
                          <Badge variant="default">Published</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {subpageCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {creationDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <ActionButton
                            label="Open note"
                            icon={<ExternalLink className="h-4 w-4" />}
                            onClick={() =>
                              router.push(ROUTES.DOCUMENTS.detail(doc._id))
                            }
                          />
                          {isArchived ? (
                            <ActionButton
                              label="Restore"
                              icon={<Undo2 className="h-4 w-4" />}
                              onClick={() => handleRestore(doc._id)}
                            />
                          ) : (
                            <ActionButton
                              label="Archive"
                              icon={<Archive className="h-4 w-4" />}
                              onClick={() => handleArchive(doc._id)}
                            />
                          )}
                          <ConfirmModal onConfirm={() => handleDelete(doc._id)}>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmModal>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
