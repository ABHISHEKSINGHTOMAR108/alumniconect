import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap, Users, CalendarDays, Briefcase, HeartHandshake } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlumniConnect — College Alumni Network" },
      {
        name: "description",
        content:
          "Find alumni, join events, discover jobs and support the college — all in one AlumniConnect workspace.",
      },
      { property: "og:title", content: "AlumniConnect — College Alumni Network" },
      {
        property: "og:description",
        content: "Find alumni, join events, discover jobs and support the college.",
      },
    ],
  }),
  component: Landing,
});

const HIGHLIGHTS = [
  { icon: Users, title: "Alumni directory", text: "Search graduates by batch, branch and company." },
  { icon: CalendarDays, title: "Events & RSVPs", text: "Reunions and meetups with live attendee counts." },
  { icon: Briefcase, title: "Job board", text: "Openings and internships shared by alumni." },
  { icon: HeartHandshake, title: "Giving", text: "Record contributions and follow the total raised." },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="brand-gradient flex size-9 items-center justify-center rounded-xl">
            <GraduationCap className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-semibold">AlumniConnect</span>
        </div>
        <Button asChild variant="secondary">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          College alumni platform
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] md:text-6xl">
          Keep every batch <span className="brand-text">connected</span>, long after graduation.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          One place for the alumni directory, reunions, referrals and contributions to the college.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="brand-gradient glow-ring border-0">
            <Link to="/auth">Create your account</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="panel p-5">
              <Icon className="size-5 text-primary" />
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
