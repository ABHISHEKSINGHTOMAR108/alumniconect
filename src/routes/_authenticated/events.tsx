import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Users, Plus } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — AlumniConnect" },
      { name: "description", content: "Upcoming alumni events, reunions and meetups with RSVPs." },
      { property: "og:title", content: "Events — AlumniConnect" },
      { property: "og:description", content: "Upcoming alumni events, reunions and meetups." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const events = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const counts = useQuery({
    queryKey: ["event_rsvp_counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("event_rsvp_counts");
      if (error) throw error;
      return data ?? [];
    },
  });

  const myRsvps = useQuery({
    queryKey: ["my_rsvps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("rsvp-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "event_rsvps" }, () => {
        queryClient.invalidateQueries({ queryKey: ["event_rsvp_counts"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createEvent = useMutation({
    mutationFn: async (form: FormData) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("events").insert({
        title: String(form.get("title")),
        event_date: new Date(String(form.get("event_date"))).toISOString(),
        location: String(form.get("location") ?? ""),
        description: String(form.get("description") ?? ""),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event created");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRsvp = useMutation({
    mutationFn: async ({ eventId, going }: { eventId: string; going: boolean }) => {
      if (!user) throw new Error("Not signed in");
      if (going) {
        const { error } = await supabase
          .from("event_rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_rsvps")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_rsvp_counts"] });
      queryClient.invalidateQueries({ queryKey: ["my_rsvps"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const countFor = (id: string) =>
    Number((counts.data ?? []).find((c) => c.event_id === id)?.attendees ?? 0);
  const isGoing = (id: string) => (myRsvps.data ?? []).some((r) => r.event_id === id);

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle="Reunions, talks and meetups from the alumni community."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="brand-gradient glow-ring border-0">
                <Plus className="size-4" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create an event</DialogTitle>
                <DialogDescription>Everyone in the network can see and RSVP.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createEvent.mutate(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date & time</Label>
                  <Input id="event_date" name="event_date" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="Campus auditorium" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4} />
                </div>
                <Button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="brand-gradient w-full border-0"
                >
                  {createEvent.isPending ? "Creating…" : "Create event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {events.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : (events.data ?? []).length === 0 ? (
        <div className="panel p-8 text-center text-sm text-muted-foreground">
          No events yet — create the first one.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {(events.data ?? []).map((ev) => {
            const upcoming = new Date(ev.event_date) >= new Date();
            const going = isGoing(ev.id);
            return (
              <article key={ev.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{ev.title}</h3>
                  <Badge variant={upcoming ? "default" : "secondary"}>
                    {upcoming ? "Upcoming" : "Past"}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {new Date(ev.event_date).toLocaleString()}
                  </span>
                  {ev.location ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      {ev.location}
                    </span>
                  ) : null}
                </div>
                {ev.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">{ev.description}</p>
                ) : null}
                <div className="mt-5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    {countFor(ev.id)} attending
                  </span>
                  <Button
                    variant={going ? "secondary" : "default"}
                    size="sm"
                    disabled={toggleRsvp.isPending}
                    onClick={() => toggleRsvp.mutate({ eventId: ev.id, going })}
                  >
                    {going ? "Cancel RSVP" : "RSVP"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
