import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { HeartHandshake, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/donations")({
  head: () => ({
    meta: [
      { title: "Giving — AlumniConnect" },
      { name: "description", content: "Record alumni contributions and track the total raised." },
      { property: "og:title", content: "Giving — AlumniConnect" },
      { property: "og:description", content: "Record alumni contributions and the total raised." },
    ],
  }),
  component: DonationsPage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function DonationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const donations = useQuery({
    queryKey: ["donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totals = useQuery({
    queryKey: ["donation-totals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("donation_totals");
      if (error) throw error;
      return data?.[0] ?? { total: 0, contributions: 0 };
    },
  });

  const addDonation = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Not signed in");
      const amount = Number(form.get("amount"));
      if (!amount || amount <= 0) throw new Error("Enter an amount greater than zero");
      const { error } = await supabase.from("donations").insert({
        user_id: user.id,
        amount,
        cause: String(form.get("cause") || "General Fund"),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thank you — contribution recorded");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["donations"] });
      queryClient.invalidateQueries({ queryKey: ["donation-totals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = Number(totals.data?.total ?? 0);
  const contributions = Number(totals.data?.contributions ?? 0);

  return (
    <div>
      <PageHeader
        title="Giving"
        subtitle="Contributions from alumni to college causes."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="brand-gradient glow-ring border-0">
                <Plus className="size-4" /> Record contribution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record a contribution</DialogTitle>
                <DialogDescription>
                  Log the amount and the cause you are supporting.
                </DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  addDonation.mutate(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (INR)</Label>
                  <Input id="amount" name="amount" type="number" min={1} step="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cause">Cause</Label>
                  <Input id="cause" name="cause" placeholder="Scholarship fund" />
                </div>
                <Button
                  type="submit"
                  disabled={addDonation.isPending}
                  className="brand-gradient w-full border-0"
                >
                  {addDonation.isPending ? "Saving…" : "Record contribution"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="panel glow-ring mb-5 p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <HeartHandshake className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Total raised</span>
        </div>
        {donations.isLoading ? (
          <Skeleton className="mt-3 h-10 w-40" />
        ) : (
          <p className="mt-3 font-display text-3xl font-semibold md:text-4xl">{inr(total)}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {contributions} contributions recorded
        </p>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Your contributions
      </h2>
      {donations.isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : (donations.data ?? []).length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          You have not recorded a contribution yet.
        </div>
      ) : (
        <div className="space-y-2">
          {(donations.data ?? []).map((d) => (
            <div key={d.id} className="panel flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{d.cause}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{d.cause}</Badge>
                <span className="font-display font-semibold">{inr(Number(d.amount))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
