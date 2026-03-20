"use client";

import { useState } from "react";

import type { UploadedAttachment } from "@/components/AttachmentUploader";

import RouteMolecule from "../molecule/route_molecule";

export default function RouteOrganism() {
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [message, setMessage] = useState("Select one or more files to upload them immediately.");

  function handleUploaded(newAttachments: UploadedAttachment[]) {
    setAttachments((current) => [...newAttachments, ...current]);
    setMessage(`${newAttachments.length} file${newAttachments.length > 1 ? "s were" : " was"} uploaded successfully.`);
  }

  function handleUploadError(error: string) {
    setMessage(error);
  }

  return (
    <RouteMolecule
      attachments={attachments}
      message={message}
      onUploadComplete={handleUploaded}
      onUploadError={handleUploadError}
    />
  );
}