import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { paginationItems } from "@/lib/pagination";

export function GalleryPagination({
  page,
  pageSize,
  total,
  totalPages,
  hrefForPage
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}) {
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Media pages">
      <div className="text-sm text-[hsl(var(--fg))]/60">
        Showing <span className="font-medium text-[hsl(var(--fg))]">{first}–{last}</span> of {total}
      </div>
      <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto pb-1">
        <Button asChild variant="secondary" className={cn("h-9 w-9 shrink-0 p-0", page === 1 && "pointer-events-none opacity-40")}>
          <Link href={hrefForPage(Math.max(1, page - 1))} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        {paginationItems(page, totalPages).map((item, index) => item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="w-8 shrink-0 text-center text-sm text-[hsl(var(--fg))]/45">…</span>
        ) : (
          <Button key={item} asChild variant={item === page ? "primary" : "secondary"} className="h-9 min-w-9 shrink-0 px-2.5">
            <Link href={hrefForPage(item)} aria-current={item === page ? "page" : undefined}>{item}</Link>
          </Button>
        ))}
        <Button asChild variant="secondary" className={cn("h-9 w-9 shrink-0 p-0", page === totalPages && "pointer-events-none opacity-40")}>
          <Link href={hrefForPage(Math.min(totalPages, page + 1))} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    </nav>
  );
}
