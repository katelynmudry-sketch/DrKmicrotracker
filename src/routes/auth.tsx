import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import { isMockMode, setMockRole } from "@/lib/mock-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Nourish" }] }),
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
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Nourish</span>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-1 text-sm font-semibold">Preview mode</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Firebase isn't configured yet, so sign-in is skipped — pick a view to
            browse the UI with sample data.
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

async function ensureUserProfile(uid: string, email: string | null, fullName?: string | null) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    email: email ?? null,
    fullName: fullName ?? null,
    role: "patient",
    createdAt: serverTimestamp(),
  });
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
      await ensureUserProfile(cred.user.uid, cred.user.email, fullName);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
      navigate({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign in failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Nourish</span>
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
          New patient accounts start as patient. The doctor account is set up on first sign-in via the Doctor Setup page.
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
