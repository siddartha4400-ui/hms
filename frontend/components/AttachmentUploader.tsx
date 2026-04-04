"use client";

import { ChangeEvent, useId, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { normalizeBackendAssetUrl } from "@/lib/backend-url";

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
  compact?: boolean;
  previewInModal?: boolean;
  className?: string;
  triggerOnly?: boolean;
  triggerContent?: React.ReactNode;
  triggerRenderer?: (options: {
    openFilePicker: () => void;
    uploading: boolean;
    disabled: boolean;
  }) => React.ReactNode;
  onUploadComplete?: (attachments: UploadedAttachment[]) => void;
  onUploadError?: (message: string) => void;
};

type UploadState = {
  uploading: boolean;
  error: string;
  attachments: UploadedAttachment[];
};

const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.82,
} as const;

const SKIP_COMPRESSION_MIME_TYPES = new Set(["image/svg+xml", "image/gif"]);

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

function isCompressibleImage(file: File): boolean {
  return file.type.startsWith("image/") && !SKIP_COMPRESSION_MIME_TYPES.has(file.type);
}

async function prepareFileForUpload(file: File): Promise<File> {
  if (!isCompressibleImage(file)) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
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
  compact = false,
  previewInModal = true,
  className = "",
  triggerOnly = false,
  triggerContent,
  triggerRenderer,
  onUploadComplete,
  onUploadError,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadEndpoint = useMemo(getUploadEndpoint, []);
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: "",
    attachments: [],
  });
  const [previewAttachment, setPreviewAttachment] = useState<UploadedAttachment | null>(null);
  const isUploadDisabled = disabled || state.uploading;
  const isPreviewPdf = Boolean(
    previewAttachment?.mime_type?.toLowerCase().includes("pdf") ||
      previewAttachment?.original_file_name?.toLowerCase().endsWith(".pdf")
  );

  const openFilePicker = () => {
    if (isUploadDisabled) {
      return;
    }
    inputRef.current?.click();
  };

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

    const uploaded = payload.attachments?.[0] as UploadedAttachment;
    return {
      ...uploaded,
      url: normalizeBackendAssetUrl(uploaded?.url),
    };
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
        const preparedFile = await prepareFileForUpload(file);
        const attachment = await uploadSingleFile(preparedFile);
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

  if (triggerOnly && (triggerContent || triggerRenderer)) {
    return (
      <div className={className}>
        {triggerRenderer ? (
          triggerRenderer({
            openFilePicker,
            uploading: state.uploading,
            disabled: isUploadDisabled,
          })
        ) : (
          <label
            htmlFor={inputId}
            className={`inline-block ${isUploadDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {triggerContent}
          </label>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          disabled={isUploadDisabled}
          onChange={handleChange}
        />

        {state.error ? (
          <div
            className="mt-2 rounded-xl px-3 py-2 text-sm"
            style={{
              background: "rgba(239,68,68,0.10)",
              color: "#fecaca",
              border: "1px solid rgba(239,68,68,0.22)",
            }}
          >
            {state.error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <section
        className={`${compact ? "rounded-lg border p-2.5" : "rounded-xl border p-3 md:p-4"} ${className}`.trim()}
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`${compact ? "text-xs" : "text-sm md:text-base"} font-semibold`} style={{ color: "var(--text-primary)" }}>
                  {label}
                </p>
                {!compact ? (
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Files upload immediately after selection. Each file is stored inside its own folder.
                  </p>
                ) : null}
              </div>
              <span
                className={`${compact ? "px-2 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"} rounded-full uppercase tracking-[0.16em]`}
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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed text-center ${compact ? "px-3 py-3" : "px-4 py-5 md:py-6"}`}
            style={{
              borderColor: "var(--brand-border)",
              background:
                "linear-gradient(180deg, var(--brand-dim) 0%, rgba(255,255,255,0.01) 100%)",
            }}
          >
            <span className={`${compact ? "mb-0.5 text-xs" : "mb-1 text-xs md:text-sm"} font-medium`} style={{ color: "var(--text-primary)" }}>
              Select file{multiple ? "s" : ""}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {accept ? `Accepted: ${accept}` : "Any file type"}
            </span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              className="hidden"
              multiple={multiple}
              accept={accept}
              disabled={isUploadDisabled}
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
            <div className={`grid ${compact ? "gap-1.5" : "gap-2"}`}>
              {state.attachments.map((attachment) => (
                <article
                  key={attachment.id}
                  className={`${compact ? "rounded-md p-2" : "rounded-lg p-2.5"} border`}
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-xs md:text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {attachment.original_file_name}
                      </p>
                      {!compact ? (
                        <>
                          <p className="mt-0.5 text-[11px] md:text-xs" style={{ color: "var(--text-secondary)" }}>
                            folder: {attachment.folder_name}
                          </p>
                          <p className="text-[11px] md:text-xs" style={{ color: "var(--text-secondary)" }}>
                            file: {attachment.file_name}
                          </p>
                        </>
                      ) : null}
                    </div>
                    <div className="text-[11px] md:text-xs md:text-right" style={{ color: "var(--text-secondary)" }}>
                      <p>{formatBytes(attachment.file_size)}</p>
                      <div className="mt-1 flex items-center gap-2 md:justify-end">
                        {previewInModal ? (
                          <button
                            type="button"
                            onClick={() => setPreviewAttachment(attachment)}
                            className="inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                          >
                            View
                          </button>
                        ) : (
                          <a
                            href={normalizeBackendAssetUrl(attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                            style={{ borderColor: "var(--brand-border)", color: "var(--brand-light)" }}
                          >
                            Open
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {previewInModal && previewAttachment ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewAttachment(null);
            }
          }}
        >
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">Attachment preview</p>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-slate-900 p-3">
              {isPreviewPdf ? (
                <iframe
                  title="Attachment preview"
                  src={normalizeBackendAssetUrl(previewAttachment.url)}
                  className="h-[70vh] w-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <img
                  src={normalizeBackendAssetUrl(previewAttachment.url)}
                  alt={previewAttachment.original_file_name || "Attachment preview"}
                  className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg border border-slate-700 bg-black/20 object-contain"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}