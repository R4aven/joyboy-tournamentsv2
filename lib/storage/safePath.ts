export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function extensionForImage(file: File): string {
  const byMime: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  if (byMime[file.type]) return byMime[file.type];
  const ext = file.name.toLowerCase().split(".").pop() || "";
  return ["jpg", "jpeg", "png", "webp"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "";
}

export function validateImageFile(file: File, maxBytes = 5 * 1024 * 1024): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Format invalide. Utilise JPG, PNG ou WEBP.";
  if (file.size > maxBytes) return "Fichier trop lourd (maximum 5 Mo).";
  if (!extensionForImage(file)) return "Impossible de déterminer le format de l'image.";
  return null;
}

export function createSafeStoragePath(folder: string, userId: string, file: File, prefix = "file"): string {
  const ext = extensionForImage(file);
  if (!ext) throw new Error("Format d'image non pris en charge");
  const random = crypto.randomUUID();
  return `${folder}/${userId}/${prefix}-${Date.now()}-${random}.${ext}`;
}
