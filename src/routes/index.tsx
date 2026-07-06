import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Leaf, Camera, Sparkles, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nourish — Naturopathic meal analysis for patients" },
      {
        name: "description",
        content:
          "A private portal where patients photograph meals and get a macro, micro, and rubric-based naturopathic report.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, isDoctor, loading } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Nourish</span>
        </div>
        <nav className="flex items-center gap-2">
          {!loading && user ? (
            <Button asChild>
              <Link to={isDoctor ? "/doctor" : "/dashboard"}>Open portal</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-20">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Built for naturopathic practice
            </p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Snap a meal. Get a rubric-aligned nutrition report.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Patients upload meal photos from their phone. Your custom dietary protocols turn each
              photo into a macro, micro, and naturopathic breakdown you can review together
              in-office.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
            <div className="rounded-2xl bg-secondary p-8">
              <div className="grid gap-4">
                <Tile
                  icon={<Camera className="h-4 w-4" />}
                  title="Photograph meal"
                  body="From any phone, in seconds."
                />
                <Tile
                  icon={<Sparkles className="h-4 w-4" />}
                  title="AI analysis"
                  body="Macros, key micros, rubric notes."
                />
                <Tile
                  icon={<ClipboardList className="h-4 w-4" />}
                  title="Reviewed together"
                  body="In-office history at a glance."
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Tile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
