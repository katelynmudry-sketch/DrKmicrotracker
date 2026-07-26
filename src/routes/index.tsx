import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isMockMode } from "@/lib/mock-mode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Leaf,
  Sparkles,
  MessagesSquare,
  Lock,
  TrendingUp,
  BookOpenCheck,
  ListChecks,
  ScanLine,
  Gauge,
  ShieldCheck,
} from "lucide-react";

// On the beta deployment (isMockMode — no Firebase configured), there's no
// real sign-in and no reason to show it: one clear CTA straight into the
// live meal-reading demo. The header/hero/footer real-auth buttons below
// stay untouched for the eventual real launch.
const PRIMARY_CTA_LABEL = isMockMode ? "Try a reading" : "Get started";
const PRIMARY_CTA_TARGET = isMockMode ? "/dashboard" : "/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vital Table — naturopathic meal readings for patients" },
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
          <span className="font-serif text-base font-semibold tracking-tight">Vital Table</span>
        </div>
        <nav className="flex items-center gap-2">
          {isMockMode ? (
            <Button asChild>
              <Link to="/dashboard">{PRIMARY_CTA_LABEL}</Link>
            </Button>
          ) : !loading && user ? (
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
              Photograph what you eat from your phone — Vital Table turns it into a warm reading of
              what it offered and how it fits your personal protocol. No counting, no comparing —
              just gentle clarity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={PRIMARY_CTA_TARGET}>{PRIMARY_CTA_LABEL}</Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold text-muted-foreground">
              <span>No calories, no scores — ever</span>
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

        {isMockMode && (
          <section className="mt-28">
            <div className="mx-auto mb-12 max-w-xl text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Before you start
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">
                A quick note about this beta
              </h2>
              <p className="mt-3 text-muted-foreground">
                Here's what's different about this early version — most of it by design, for your
                privacy.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Feature
                icon={<ListChecks className="h-5 w-5" />}
                title="You choose what to focus on"
                body="Pick the nutrients you want to watch — on your own, or based on something you've heard elsewhere. No referral or account needed."
              />
              <Feature
                icon={<ScanLine className="h-5 w-5" />}
                title="Read by AI, grounded in real numbers"
                body="Snap a photo or describe your meal — the reading comes from AI, checked against Canadian recommended intakes, and any 'worth trying' ideas are curated by our team."
              />
              <Feature
                icon={<Gauge className="h-5 w-5" />}
                title="3 readings a day"
                body="Plenty to get a feel for it on this browser — the count resets tomorrow."
              />
              <Feature
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Lives on this device only, on purpose"
                body="There's no account, so nothing you share is tied to your identity, and nothing is written to a database — your readings, pantry, and settings stay right here in this browser. Download a copy or take a screenshot of anything you want to keep, since none of it carries over if you switch devices or clear your browser data."
              />
            </div>
          </section>
        )}

        <section className="mt-28">
          <Card className="grid gap-8 bg-accent p-10 text-background md:grid-cols-[auto_1fr] md:items-center md:p-14">
            <p className="font-serif text-6xl leading-none opacity-50">&ldquo;</p>
            <div>
              <p className="font-serif text-xl font-medium leading-snug md:text-2xl">
                Food is medicine — but only when you can actually see what it's doing for you.
              </p>
              <p className="mt-4 text-sm font-bold opacity-90">
                — the naturopathic doctor behind Vital Table
              </p>
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
              body={
                isMockMode
                  ? "Every reading is grounded in Canadian recommended intakes — not a generic calorie database."
                  : "Every reading is scored against a real clinical protocol — not a generic database."
              }
            />
            <Feature
              icon={<TrendingUp className="h-5 w-5" />}
              title="Gentle progress, visualized"
              body="See trends over weeks, not just one snapshot — without judgment, just information."
            />
            <Feature
              icon={<Lock className="h-5 w-5" />}
              title="Private, always"
              body={
                isMockMode
                  ? "Nothing leaves this device — there's no database, no account, and nothing is saved anywhere but your own browser."
                  : "Your meals and notes stay between you and your care team. Full stop."
              }
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
              {isMockMode
                ? "No invite, no account — just tap in and try a reading."
                : "Ask your naturopathic doctor for an invite, or sign in if you already have one."}
            </p>
            <Button size="lg" variant="secondary" className="mt-7" asChild>
              <Link to={PRIMARY_CTA_TARGET}>{PRIMARY_CTA_LABEL}</Link>
            </Button>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-sm text-muted-foreground">
        Vital Table — naturopathic meal readings, built with care.
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
