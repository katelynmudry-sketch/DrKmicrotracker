import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, Sparkles, MessagesSquare, Lock, TrendingUp, BookOpenCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dr. K's Kitchen — naturopathic meal readings for patients" },
      {
        name: "description",
        content:
          "Snap a meal, get a little love note from your body — a private portal where patients photograph meals and get a warm naturopathic reading, scored to their own protocol.",
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
          <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Dr. K's Kitchen</span>
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

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-12 md:pt-16">
        <section className="grid items-center gap-14 md:grid-cols-2">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Naturopathic care, made personal
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Snap your meal, get a little <em className="text-primary italic">love note</em> from
              your body.
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground">
              Photograph what you eat from your phone — Dr. K's Kitchen turns it into a warm reading
              of what it offered and how it fits your personal protocol. No counting, no comparing —
              just gentle clarity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground">
              <span>Built with a real ND</span>
              <span>Kimberley &amp; Cranbrook, BC</span>
            </div>
          </div>

          <Card className="p-6">
            <div className="mb-5 grid h-40 place-items-center rounded-2xl bg-secondary text-3xl">
              🌿
            </div>
            <ReportRow label="Iron" value="Strong source" />
            <ReportRow label="Fiber" value="Present" />
            <ReportRow label="Protocol fit" value="Aligned" last />
          </Card>
        </section>

        <section className="mt-28">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">How it feels</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Three steps, zero stress
            </h2>
            <p className="mt-3 text-muted-foreground">
              No spreadsheets, no guilt, no clinical coldness — just gentle clarity between visits.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <StepCard
              num="1"
              title="Snap your plate"
              body="Right from your phone, before you dig in. Takes less time than texting a friend."
            />
            <StepCard
              num="2"
              title="We translate it"
              body="A plain, warm reading — what it offered, what's worth trying, and how it fits your protocol."
            />
            <StepCard
              num="3"
              title="We talk it through"
              body="Your history shows up at your next visit, so we spend less time recalling and more time healing."
            />
          </div>
        </section>

        <section className="mt-28">
          <Card className="grid gap-8 bg-accent p-10 text-background md:grid-cols-[auto_1fr] md:items-center md:p-14">
            <p className="font-serif text-6xl leading-none opacity-50">&ldquo;</p>
            <div>
              <p className="font-serif text-xl font-medium leading-snug md:text-2xl">
                Food is medicine — but only when you can actually see what it's doing for you.
              </p>
              <p className="mt-4 text-sm font-bold opacity-90">— Dr. Katelyn Mudry, ND</p>
            </div>
          </Card>
        </section>

        <section className="mt-28">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">What's inside</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
              Considered, not clinical
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Feature
              icon={<BookOpenCheck className="h-5 w-5" />}
              title="Built around your protocol"
              body="Every reading is scored against Dr. K's clinical positions — not a generic nutrition database."
            />
            <Feature
              icon={<TrendingUp className="h-5 w-5" />}
              title="Gentle progress, visualized"
              body="See trends over weeks, not just one snapshot — without judgment, just information."
            />
            <Feature
              icon={<Lock className="h-5 w-5" />}
              title="Private, always"
              body="Your meals and notes stay private to your account. Full stop."
            />
            <Feature
              icon={<MessagesSquare className="h-5 w-5" />}
              title="Plain-language readings"
              body="No clinical jargon, no scores designed to shame — just clear, warm notes you'll actually want to read."
            />
          </div>
        </section>

        <section className="mt-28">
          <Card className="bg-primary p-12 text-center text-primary-foreground md:p-16">
            <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              Let's see what your plate is telling us.
            </h2>
            <p className="mx-auto mt-4 max-w-md opacity-90">
              Sign in or create an account to get started.
            </p>
            <Button size="lg" variant="secondary" className="mt-7" asChild>
              <Link to="/auth">Get started</Link>
            </Button>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-sm text-muted-foreground">
        Dr. K's Kitchen — naturopathic meal readings, built with care.
      </footer>
    </div>
  );
}

function ReportRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 text-sm ${last ? "" : "border-b border-border"}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function StepCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <Card className="relative p-7">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-accent font-serif font-semibold text-accent-foreground">
        {num}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-secondary p-6">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-card text-accent-foreground">
        {icon}
      </span>
      <div>
        <h3 className="mb-1 text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
