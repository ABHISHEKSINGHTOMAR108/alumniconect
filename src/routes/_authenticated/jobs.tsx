import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, MapPin, Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "Job Board — AlumniConnect" },
      { name: "description", content: "Jobs and internships shared by the alumni network." },
      { property: "og:title", content: "Job Board — AlumniConnect" },
      { property: "og:description", content: "Jobs and internships shared by the alumni network." },
    ],
  }),
  component: JobsPage,
});

const TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Remote"];

function JobsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [jobType, setJobType] = useState("Full-time");

  const jobs = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const postJob = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("jobs").insert({
        title: String(form.get("title")),
        company: String(form.get("company")),
        location: String(form.get("location") ?? ""),
        job_type: jobType,
        description: String(form.get("description") ?? ""),
        posted_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Opening posted");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Job Board"
        subtitle="Openings and internships referred by alumni."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="brand-gradient glow-ring border-0">
                <Plus className="size-4" /> Post opening
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post an opening</DialogTitle>
                <DialogDescription>Share a role with the alumni network.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  postJob.mutate(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Role title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Bengaluru / Remote" />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4} />
                </div>
                <Button
                  type="submit"
                  disabled={postJob.isPending}
                  className="brand-gradient w-full border-0"
                >
                  {postJob.isPending ? "Posting…" : "Post opening"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {jobs.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (jobs.data ?? []).length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          No openings posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {(jobs.data ?? []).map((job) => (
            <article key={job.id} className="panel p-5">
              <div className="flex items-start gap-4">
                <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-accent sm:flex">
                  <Briefcase className="size-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <Badge variant="secondary">{job.job_type}</Badge>
                    {!job.is_open ? <Badge variant="outline">Closed</Badge> : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-4" />
                      {job.company}
                    </span>
                    {job.location ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        {job.location}
                      </span>
                    ) : null}
                  </div>
                  {job.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">{job.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
