import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/doctor/rubrics")({
  head: () => ({ meta: [{ title: "Rubrics — Nourish" }] }),
  component: Rubrics,
});

function Rubrics() {
  const { isDoctor, loading, user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [extracted, setExtracted] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const rubrics = useQuery({
    queryKey: ["rubrics"],
    enabled: isDoctor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rubrics")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = async () => {
    if (!file || !title.trim() || !user) return toast.error("Title and file are required");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("rubrics")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("rubrics").insert({
        uploaded_by: user.id,
        title,
        description: description || null,
        extracted_text: extracted || null,
        storage_path: path,
        file_name: file.name,
        is_active: true,
      });
      if (error) throw error;
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

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("rubrics").update({ is_active: active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["rubrics"] });
  };

  const remove = async (id: string, path: string) => {
    await supabase.storage.from("rubrics").remove([path]);
    await supabase.from("rubrics").delete().eq("id", id);
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
            Upload your dietary protocol document. The pasted summary is what
            the AI reads when analyzing meals — paste the key rules so the
            model can apply them.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <Label className="mb-1.5">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Anti-inflammatory protocol v3" />
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
              <Label className="mb-1.5">Rubric summary for AI</Label>
              <Textarea
                rows={6}
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                placeholder="Paste the protocol guidance the AI should apply (food groups to avoid, target macros, scoring rules…)"
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
              No rubrics yet. Upload one to power the AI analysis.
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
                      <p className="truncate text-xs text-muted-foreground">
                        {r.file_name}
                      </p>
                      {r.description && (
                        <p className="mt-1 text-sm">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        Active
                        <Switch
                          checked={r.is_active}
                          onCheckedChange={(c) => toggle(r.id, c)}
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(r.id, r.storage_path)}
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