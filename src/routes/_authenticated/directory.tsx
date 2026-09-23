import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Alumni Directory — AlumniConnect" },
      { name: "description", content: "Search alumni by name, batch, branch and company." },
      { property: "og:title", content: "Alumni Directory — AlumniConnect" },
      { property: "og:description", content: "Search alumni by name, batch, branch and company." },
    ],
  }),
  component: Directory,
});

const ALL = "all";

function Directory() {
  const [q, setQ] = useState("");
  const [batch, setBatch] = useState(ALL);
  const [branch, setBranch] = useState(ALL);

  const { data, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const batches = useMemo(
    () =>
      [...new Set((data ?? []).map((p) => p.batch_year).filter(Boolean))].sort(
        (a, b) => Number(b) - Number(a),
      ),
    [data],
  );
  const branches = useMemo(
    () => [...new Set((data ?? []).map((p) => p.branch).filter(Boolean))].sort(),
    [data],
  );

  const rows = (data ?? []).filter((p) => {
    const term = q.trim().toLowerCase();
    const matches =
      !term ||
      [p.full_name, p.company, p.job_title, p.location, p.branch]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
    const batchOk = batch === ALL || String(p.batch_year) === batch;
    const branchOk = branch === ALL || p.branch === branch;
    return matches && batchOk && branchOk;
  });

  return (
    <div>
      <PageHeader title="Alumni Directory" subtitle={`${rows.length} alumni listed`} />

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_180px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, company, role…"
            className="pl-9"
          />
        </div>
        <Select value={batch} onValueChange={setBatch}>
          <SelectTrigger>
            <SelectValue placeholder="Batch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={String(b)} value={String(b)}>
                Batch of {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger>
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={String(b)} value={String(b)}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          No alumni match these filters yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article key={p.id} className="panel p-5">
              <div className="flex items-start gap-3">
                <span className="brand-gradient flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-semibold text-primary-foreground">
                  {(p.full_name || "A").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{p.full_name || "Alumnus"}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {p.job_title || "Alumni member"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {p.batch_year ? <Badge variant="secondary">Batch {p.batch_year}</Badge> : null}
                {p.branch ? <Badge variant="outline">{p.branch}</Badge> : null}
              </div>

              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {p.company ? (
                  <p className="flex items-center gap-2">
                    <Building2 className="size-4" />
                    {p.company}
                  </p>
                ) : null}
                {p.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    {p.location}
                  </p>
                ) : null}
              </div>

              {p.bio ? (
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{p.bio}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
