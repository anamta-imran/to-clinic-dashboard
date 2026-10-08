import { NextResponse } from "next/server";
import { clampPageSize, type PageSize } from "@/lib/pagination";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: PageSize;
  skip: number;
} {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const limit = clampPageSize(Number(searchParams.get("limit") ?? "10") || 10);
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedMeta(
  totalItems: number,
  page: number,
  pageSize: PageSize,
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex: start,
    endIndex: end,
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim();
}
