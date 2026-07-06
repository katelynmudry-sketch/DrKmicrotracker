import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/integrations/firebase/client";
import { isMockMode } from "@/lib/mock-mode";
import { mockRubrics } from "@/lib/mock-data";
import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { extractRubricPdf } from "@/lib/rubrics.functions";

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export const Route = createFileRoute("/_authenticated/doctor/rubrics")({
  head: () => ({ meta: [{ title: "Rubrics — Dr. K's Kitchen" }] }),
  component: Rubrics,
});

type Rubric = {
  id: string;
  title: string;
  description: string | null;
  extractedText: string | null;
  fileName: string;
  storagePath: string;
  isActive: boolean;
};

function Rubrics() {
  const { isDoctor, loading, user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracted, setExtracted] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const extractFn = useServerFn(extractRubricPdf);

  const rubrics = useQuery({
    queryKey: ["rubrics"],
    enabled: isDoctor,
    queryFn: async () => {
      if (isMockMode) return mockRubrics as Rubric[];
      const snap = await getDocs(query(collection(db, "rubrics"), orderBy("createdAt", "desc")));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Rubric);
    },
  });

  const upload = async () => {
    if (!file || !title.trim() || !user) return toast.error("Title and file are required");
    if (isMockMode) return toast.info("Preview mode — uploads aren't saved.");
    setUploading(true);
    try {
      const path = `rubrics/${user.uid}/${Date.now()}-${file.name}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type });
      await addDoc(collection(db, "rubrics"), {
        uploadedBy: user.uid,
        title,
        description: description || null,
        extractedText: extracted || null,
        storagePath: path,
        fileName: file.name,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      toast.success("Rubric uploaded");
      setTitle("");
      setDescription("");
      setExtracted("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["rubrics"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const extractFromPdf = async () => {
    if (!file) return;
    if (isMockMode) return toast.info("Preview mode — extraction isn't available.");
    setExtracting(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await extractFn({ data: { base64 } });
      setExtracted(result.text);
      toast.success("Pulled a summary from the PDF — review it before saving.");
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't extract text from that PDF");
    } finally {
      setExtracting(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await updateDoc(doc(db, "rubrics", id), { isActive: active });
    qc.invalidateQueries({ queryKey: ["rubrics"] });
  };

  const remove = async (id: string, path: string) => {
    if (isMockMode) return toast.info("Preview mode — changes aren't saved.");
    await deleteObject(ref(storage, path)).catch(() => {});
    await deleteDoc(doc(db, "rubrics", id));
    qc.invalidateQueries({ queryKey: ["rubrics"] });
  };

  if (loading) return null;
  if (!isDoctor)
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Doctor access required.</p>
      </AppShell>
    );

  return (
    <AppShell
      nav={
        <Button size="sm" variant="ghost" asChild>
          <Link to="/doctor">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Patients
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <Card className="h-fit p-5">
          <h2 className="text-base font-semibold">Upload rubric</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your dietary protocol document. The pasted summary is what shapes every reading —
            paste the key rules so they carry through.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label className="mb-1.5">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Anti-inflammatory protocol v3"
              />
            </div>
            <div>
              <Label className="mb-1.5">Document (PDF or Word)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Short description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this rubric covers"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label>Rubric summary for AI</Label>
                {file?.type === "application/pdf" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-auto py-1 text-xs"
                    onClick={extractFromPdf}
                    disabled={extracting}
                  >
                    {extracting ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    Extract from PDF
                  </Button>
                )}
              </div>
              <Textarea
                rows={6}
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                placeholder="Paste the protocol guidance the AI should apply (food groups to avoid, target macros, scoring rules…), or upload a PDF above and use Extract from PDF."
              />
            </div>
            <Button className="w-full" onClick={upload} disabled={uploading}>
              Upload rubric
            </Button>
          </div>
        </Card>

        <div>
          <h2 className="mb-4 text-base font-semibold">Your rubrics</h2>
          {rubrics.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !rubrics.data || rubrics.data.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">
              No rubrics yet. Upload one to shape every reading.
            </Card>
          ) : (
            <div className="space-y-3">
              {rubrics.data.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {r.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{r.fileName}</p>
                      {r.description && <p className="mt-1 text-sm">{r.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        Active
                        <Switch checked={r.isActive} onCheckedChange={(c) => toggle(r.id, c)} />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(r.id, r.storagePath)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
