"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { MoreHorizontalIcon } from "lucide-react";

export default function DataTable() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("collections")
        .select("*")
        .ilike("name", `%${search}%`)
        .range(page * limit, page * limit + limit - 1);
      const { data, error } = await query;
      console.log("Fetched data:", data);
      if (!error && data) setData(data);
    };
    fetchData();
  }, [supabase, search, page]);

  return (
    <div className="space-y-1 border border-gray-300 p-4 rounded-lg">
      <Input
        placeholder="Search by name..."
        value={search}
        onChange={(e) => {
          setPage(0);
          setSearch(e.target.value);
        }}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="flex flex-row align-middle items-center">
                <div className="mr-2 mt-1 rounded-sm overflow-hidden">
                  <Image
                    src={row.image_url}
                    alt={row.name}
                    width={20}
                    height={20}
                  />
                </div>
                <div className="mt-1">{row.name}</div>
              </TableCell>
              <TableCell>{row.slug}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>
                {row.is_active ? (
                  <Badge className="rounded-full border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5">
                    <span
                      className="size-1.5 rounded-full bg-green-600 dark:bg-green-400"
                      aria-hidden="true"
                    />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-600/10 [a&]:hover:bg-red-600/5 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40 text-red-400 rounded-full border-none focus-visible:outline-none">
                    <span
                      className="bg-red-600 size-1.5 rounded-full"
                      aria-hidden="true"
                    />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Open menu"
                      size="icon-sm"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="cursor-pointer">
                        View Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        Edit Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        {row.is_active ? "Deactivate" : "Activate"} Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        variant="destructive"
                      >
                        Delete Collection
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-6">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
