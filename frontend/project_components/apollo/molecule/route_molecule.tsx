import AttachmentUploader, { type UploadedAttachment } from "@/components/AttachmentUploader";

type Props = {
  attachments: UploadedAttachment[];
  message: string;
  onUploadComplete: (attachments: UploadedAttachment[]) => void;
  onUploadError: (message: string) => void;
};

export default function RouteMolecule({
  attachments,
  message,
  onUploadComplete,
  onUploadError,
}: Props) {
  return (
    <main className="min-h-screen px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section
          className="overflow-hidden rounded-[28px] border"
          style={{
            background:
              "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(249,115,22,0.10) 45%, rgba(8,14,28,0.92) 100%)",
            borderColor: "var(--border)",
          }}
        >
          <div className="grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-10">
            <div>
              <p
                className="mb-3 text-[11px] uppercase tracking-[0.25em]"
                style={{ color: "var(--brand-light)" }}
              >
                Attachment Flow
              </p>
              <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
                Upload once. Get URL, folder name, and filename back immediately.
              </h1>
              <p className="mt-4 max-w-2xl text-sm md:text-base" style={{ color: "var(--text-secondary)" }}>
                This reusable component sends every selected file directly to the Django server,
                creates a separate folder for each file, and returns the saved metadata you need
                for forms, mutations, or later processing.
              </p>
            </div>
            <div
              className="rounded-[24px] border p-5"
              style={{
                background: "rgba(8,14,28,0.55)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                Request Pipeline
              </p>
              <div className="mt-4 flex flex-col gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                <span>Client</span>
                <span>GraphQL or Form State</span>
                <span>attachments upload API</span>
                <span>validators</span>
                <span>services</span>
                <span>repositories</span>
                <span>models</span>
                <span>database</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <AttachmentUploader
            entityType="guest-profile"
            entityId={101}
            hmsId={1}
            label="Guest document attachments"
            accept="image/*,.pdf"
            onUploadComplete={onUploadComplete}
            onUploadError={onUploadError}
          />

          <aside
            className="rounded-2xl border p-5"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
              Component State
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
              {message}
            </p>

            <div className="mt-5 grid gap-3">
              {attachments.length === 0 ? (
                <div
                  className="rounded-xl border border-dashed px-4 py-6 text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Uploaded file metadata will appear here.
                </div>
              ) : (
                attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-xl border p-4"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <p className="truncate text-sm font-medium">{attachment.original_file_name}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      url: {attachment.url}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      folder: {attachment.folder_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      file: {attachment.file_name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}