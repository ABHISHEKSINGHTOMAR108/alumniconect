import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — AlumniConnect" },
      { name: "description", content: "View and update your alumni profile details." },
      { property: "og:title", content: "My Profile — AlumniConnect" },
      { property: "og:description", content: "View and update your alumni profile details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Not signed in");
      const batch = String(form.get("batch_year") ?? "").trim();
      const payload = {
        id: user.id,
        email: user.email ?? null,
        full_name: String(form.get("full_name") ?? ""),
        batch_year: batch ? Number(batch) : null,
        branch: String(form.get("branch") ?? ""),
        company: String(form.get("company") ?? ""),
        job_title: String(form.get("job_title") ?? ""),
        location: String(form.get("location") ?? ""),
        bio: String(form.get("bio") ?? ""),
      };
      const { error } = await supabase.from("profiles").upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const p = profile.data;

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Profile" subtitle="This is what other alumni see in the directory." />

      {profile.isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <form
          className="panel space-y-5 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(new FormData(e.currentTarget));
          }}
        >
          <div className="flex items-center gap-4">
            <span className="brand-gradient flex size-14 items-center justify-center rounded-2xl font-display text-lg font-semibold text-primary-foreground">
              {(p?.full_name || user?.email || "A").slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{p?.full_name || "Your name"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={p?.full_name ?? ""} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch_year">Graduation batch</Label>
              <Input
                id="batch_year"
                name="batch_year"
                type="number"
                min={1950}
                max={2100}
                defaultValue={p?.batch_year ?? ""}
                placeholder="2021"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input
                id="branch"
                name="branch"
                defaultValue={p?.branch ?? ""}
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Current company</Label>
              <Input id="company" name="company" defaultValue={p?.company ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job title</Label>
              <Input id="job_title" name="job_title" defaultValue={p?.job_title ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={p?.location ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={p?.bio ?? ""} />
          </div>

          <Button
            type="submit"
            disabled={save.isPending}
            className="brand-gradient glow-ring border-0"
          >
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      )}
    </div>
  );
}
