import { mediaRepository } from "@/repositories/media-repository";
import type { CreateMediaInput } from "@/types";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BASE64_BYTES = 500_000; // ~500KB for base64 storage

function getMediaTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "document";
  if (mimeType.includes("word")) return "document";
  return "file";
}

export const mediaService = {
  list() {
    return mediaRepository.list();
  },

  getById(id: string) {
    return mediaRepository.findById(id);
  },

  async create(input: CreateMediaInput) {
    if (!input.fileName) throw new Error("File name is required.");

    const mimeType = input.mimeType || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error("File type is not allowed.");
    }

    const size = input.size || 0;
    if (input.base64Data && size > MAX_BASE64_BYTES) {
      throw new Error(
        `File is too large for base64 storage. Maximum is ${Math.round(MAX_BASE64_BYTES / 1024)}KB.`,
      );
    }

    const created = await mediaRepository.create({
      source: input.source || "upload",
      fileName: input.fileName,
      originalName: input.originalName || input.fileName,
      url: input.url || "",
      mimeType,
      size,
      mediaType: input.mediaType || getMediaTypeFromMime(mimeType),
      altText: input.altText || null,
      base64Data: input.base64Data || null,
    });

    // If stored as base64 and no external URL, set the serving URL
    if (input.base64Data && !input.url) {
      return mediaRepository.update(created.id, {
        url: `/api/cms/media/${created.id}/file`,
      });
    }

    return created;
  },

  async delete(id: string) {
    const item = await mediaRepository.findById(id);
    if (!item) throw new Error("Media item not found.");
    return mediaRepository.delete(id);
  },

  /** Return the raw record for file serving (includes base64Data). */
  getFileById(id: string) {
    return mediaRepository.findById(id);
  },
};
