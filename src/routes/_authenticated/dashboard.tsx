import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, CalendarDays, Briefcase, HeartHandshake, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AlumniConnect" },
      { name: "description", content: "Alumni network activity at a glance." },
      { property: "og:title", content: "Dashboard — AlumniConnect" },
      { property: "og:description", content: "Alumni network activity at a glance." },
    ],
  }),
  component: Dashboard,
});

function useStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [alumni, events, jobs, donations, nextEvent] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_open", true),
        supabase.from("donations").select("amount"),
        supabase
          .from("events")
          .select("*")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
      const total = (donations.data ?? []).reduce((sum, d) => sum + Number(d.amount), 0);
      return {
        alumni: alumni.count ?? 0,
        events: events.count ?? 0,
        jobs: jobs.count ?? 0,
        raised: total,
        nextEvent: nextEvent.data,
      };
    },
  });
}

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    .format(n);

function Dashboard() {
  const { data, isLoading } = useStats();

  const cards = [
    { label: "Total alumni", value: data?.alumni ?? 0, icon: Users, to: "/directory" as const },
    { label: "Events", value: data?.events ?? 0, icon: CalendarDays, to: "/events" as const },
    { label: "Open roles", value: data?.jobs ?? 0, icon: Briefcase, to: "/jobs" as const },
    {
      label: "Raised",
      value: inr(data?.raised ?? 0),
      icon: HeartHandshake,
      to: "/donations" as const,
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your alumni community at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="panel p-4 transition-colors hover:bg-accent/40 md:p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-3 font-display text-2xl font-semibold md:text-3xl">{value}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="panel mt-4 p-5 md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Next upcoming event
        </h2>
        {isLoading ? (
          <Skeleton className="mt-4 h-16 w-full" />
        ) : data?.nextEvent ? (
          <div className="mt-4">
            <p className="font-display text-xl font-semibold">{data.nextEvent.title}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                {new Date(data.nextEvent.event_date).toLocaleString()}
              </span>
              {data.nextEvent.location ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {data.nextEvent.location}
                </span>
              ) : null}
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              {data.nextEvent.description}
            </p>
            <Link
              to="/events"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              View all events →
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No upcoming events yet.{" "}
            <Link to="/events" className="text-primary hover:underline">
              Create the first one
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
