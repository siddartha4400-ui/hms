"use client";

import { ChangeEvent, useId, useMemo, useState } from "react";

export type UploadedAttachment = {
  id: number;
  hms_id: number;
  entity_type: string;
  entity_id: number;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
  url: string;
  folder_name: string;
  file_name: string;
  original_file_name: string;
};

type Props = {
  entityType: string;
  entityId: number;
  hmsId: number;
  uploadedBy?: number;
  multiple?: boolean;
  accept?: string;
  label?: string;
  disabled?: boolean;
  showUploadedList?: boolean;
  className?: string;
  onUploadComplete?: (attachments: UploadedAttachment[]) => void;
  onUploadError?: (message: string) => void;
};

type UploadState = {
  uploading: boolean;
  error: string;
  attachments: UploadedAttachment[];
};

function getUploadEndpoint(): string {
  const explicitBase = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "");
  if (explicitBase) {
    return `${explicitBase}/api/attachments/upload/`;
  }

  const graphqlUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!graphqlUrl) {
    return "http://localhost:8000/api/attachments/upload/";
  }

  return graphqlUrl.replace(/\/graphql\/?$/, "/api/attachments/upload/");
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function AttachmentUploader({
  entityType,
  entityId,
  hmsId,
  uploadedBy,
  multiple = true,
  accept,
  label = "Upload attachments",
  disabled = false,
  showUploadedList = true,
  className = "",
  onUploadComplete,
  onUploadError,
}: Props) {
  const inputId = useId();
  const uploadEndpoint = useMemo(getUploadEndpoint, []);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: "",
    attachments: [],
  });

  async function uploadSingleFile(file: File): Promise<UploadedAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity_type", entityType);
    formData.append("entity_id", String(entityId));
    formData.append("hms_id", String(hmsId));

    if (typeof uploadedBy === "number") {
      formData.append("uploaded_by", String(uploadedBy));
    }

    const response = await fetch(uploadEndpoint, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || "Attachment upload failed.");
    }

    return payload.attachments?.[0] as UploadedAttachment;
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setState((current) => ({ ...current, uploading: true, error: "" }));

    try {
      const uploadedAttachments: UploadedAttachment[] = [];
      for (const file of selectedFiles) {
        const attachment = await uploadSingleFile(file);
        uploadedAttachments.push(attachment);
      }

      setState((current) => ({
        uploading: false,
        error: "",
        attachments: [...uploadedAttachments, ...current.attachments],
      }));
      onUploadComplete?.(uploadedAttachments);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Attachment upload failed.";
      setState((current) => ({ ...current, uploading: false, error: message }));
      onUploadError?.(message);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section
      className={`rounded-2xl border p-4 md:p-5 ${className}`.trim()}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                {label}
              </h3>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Files upload immediately after selection. Each file is stored inside its own folder.
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]"
              style={{
                background: "var(--brand-dim)",
                color: "var(--brand-light)",
                border: "1px solid var(--brand-border)",
              }}
            >
              {state.uploading ? "Uploading" : "Ready"}
            </span>
          </div>
        </div>

        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 text-center"
          style={{
            borderColor: "var(--brand-border)",
            background:
              "linear-gradient(180deg, var(--brand-dim) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          <span className="mb-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Select file{multiple ? "s" : ""}
          </span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {accept ? `Accepted: ${accept}` : "Any file type"}
          </span>
          <input
            id={inputId}
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept}
            disabled={disabled || state.uploading}
            onChange={handleChange}
          />
        </label>

        {state.error ? (
          <div
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              background: "rgba(239,68,68,0.10)",
              color: "#fecaca",
              border: "1px solid rgba(239,68,68,0.22)",
            }}
          >
            {state.error}
          </div>
        ) : null}

        {showUploadedList ? (
          <div className="grid gap-3">
            {state.attachments.map((attachment) => (
              <article
                key={attachment.id}
                className="rounded-xl border p-3"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {attachment.original_file_name}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      folder: {attachment.folder_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      file: {attachment.file_name}
                    </p>
                  </div>
                  <div className="text-xs md:text-right" style={{ color: "var(--text-secondary)" }}>
                    <p>{formatBytes(attachment.file_size)}</p>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block underline underline-offset-2"
                      style={{ color: "var(--brand-light)" }}
                    >
                      Open file
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}