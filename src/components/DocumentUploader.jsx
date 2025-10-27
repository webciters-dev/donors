// src/components/DocumentUploader.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { API } from "@/lib/api";
import axios from "axios";

/**
 * Props:
 * - studentId (required)
 * - applicationId (optional)
 * - onUploaded(document) (optional)
 */
export default function DocumentUploader({ studentId, applicationId, onUploaded, preferredType }) {
  const { token } = useAuth();
  const [type, setType] = useState("OTHER");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const TYPES = [
    { key: "CNIC", label: "CNIC" },
    { key: "GUARDIAN_CNIC", label: "GUARDIAN CNIC" },
    { key: "PHOTO", label: "PHOTO" },
    { key: "SSC_RESULT", label: "SSC RESULT" },
    { key: "HSSC_RESULT", label: "HSSC RESULT" },
    { key: "UNIVERSITY_CARD", label: "UNIVERSITY/COLLEGE CARD" },
    { key: "FEE_INVOICE", label: "FEE INVOICE" },
    { key: "INCOME_CERTIFICATE", label: "INCOME CERTIFICATE" },
    { key: "UTILITY_BILL", label: "UTILITY BILL" },
    { key: "TRANSCRIPT", label: "TRANSCRIPT" },
    { key: "DEGREE_CERTIFICATE", label: "DEGREE CERTIFICATE" },
    { key: "ENROLLMENT_CERTIFICATE", label: "ENROLLMENT CERTIFICATE" },
    { key: "OTHER", label: "OTHER" },
  ];

  // If a preferred type is suggested by parent (e.g., from a request), adopt it when it changes.
  useEffect(() => {
    if (preferredType && TYPES.some(t => t.key === preferredType)) {
      setType(preferredType);
    }
  }, [preferredType]);

  async function upload() {
    if (!studentId) {
      toast.error("Student not found.");
      return;
    }
    if (!file) {
      toast.error("Please choose a file.");
      return;
    }

    try {
      setBusy(true);
      setProgress(0);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("studentId", studentId);
      if (applicationId) fd.append("applicationId", applicationId);
      fd.append("type", type);

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const res = await axios.post(`${API.baseURL}/api/uploads`, fd, {
        headers,
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
        },
      });

      const data = res.data;
      toast.success("File uploaded");
      setFile(null);
      setProgress(0);
      onUploaded?.(data.document);
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="grid md:grid-cols-3 gap-3 items-center">
        <select
          className="rounded-2xl border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>

        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="rounded-2xl"
        />

        <Button onClick={upload} disabled={busy || !file} className="rounded-2xl min-w-32">
          {busy ? (progress > 0 ? `Uploading ${progress}%` : "Uploading...") : "Upload"}
        </Button>
      </div>
      {preferredType && (
        <div className="text-xs text-slate-500 mt-2">
          Tip: We preselected {preferredType.replaceAll("_", " ")} based on the request.
        </div>
      )}
    </Card>
  );
}
