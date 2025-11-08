"use client";

import { useState, useEffect } from "react";
import { UserData } from "./columns";
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

export default async function DataTable({ supabase }: { supabase: any }) {
  const [data, setData] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 5;

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("products")
        .select("*")
        .ilike("name", `%${search}%`)
        .range(page * limit, page * limit + limit - 1);
      const { data, error } = await query;
      if (!error && data) setData(data);
    };
    fetchData();
  }, [search, page]);

  return (
    <div className="space-y-4">
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
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
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
