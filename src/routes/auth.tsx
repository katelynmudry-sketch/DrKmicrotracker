import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { isMockMode, setMockRole } from "@/lib/mock-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Dr. K's Kitchen" }] }),
  component: isMockMode ? MockAuthPage : AuthPage,
});

function MockAuthPage() {
  const navigate = useNavigate();
  const enter = (role: "patient" | "doctor") => {
    setMockRole(role);
    navigate({ to: role === "doctor" ? "/doctor" : "/dashboard" });
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Dr. K's Kitchen</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-1 text-sm font-semibold">Preview mode</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Firebase isn't configured yet, so sign-in is skipped — pick a view to browse the UI with
            sample data.
          </p>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => enter("patient")}>
              Continue as patient
            </Button>
            <Button variant="outline" className="w-full" onClick={() => enter("doctor")}>
              Continue as doctor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.currentUser) navigate({ to: "/dashboard" });
  }, [navigate]);

  const signIn = async () => {
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) await updateProfile(cred.user, { displayName: fullName });
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign in failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-serif text-base font-semibold tracking-tight">Dr. K's Kitchen</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Tabs defaultValue="signin">
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4">
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" onClick={signIn} disabled={busy}>
                Sign in
              </Button>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4">
              <Field label="Full name" value={fullName} onChange={setFullName} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" onClick={signUp} disabled={busy}>
                Create patient account
              </Button>
            </TabsContent>
          </Tabs>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New accounts start as patient. Doctor access is granted to allowlisted emails
          automatically, or by an existing doctor from the Patients page.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} type={type} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
