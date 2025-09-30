// src/components/DocumentUploader.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
    "CNIC",
    "GUARDIAN_CNIC",
    "PHOTO",
    "SSC_RESULT",
    "HSSC_RESULT",
    "UNIVERSITY_CARD",
    "FEE_INVOICE",
    "INCOME_CERTIFICATE",
    "UTILITY_BILL",
    "TRANSCRIPT",
    "DEGREE_CERTIFICATE",
    "ENROLLMENT_CERTIFICATE",
    "OTHER",
  ];

  // If a preferred type is suggested by parent (e.g., from a request), adopt it when it changes.
  useEffect(() => {
    if (preferredType && TYPES.includes(preferredType)) {
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

      const res = await axios.post(`${API}/api/uploads`, fd, {
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
            <option key={t} value={t}>
              {t.replaceAll("_", " ")}
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
