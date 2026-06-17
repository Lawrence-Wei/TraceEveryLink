import path from "node:path";

export function getPhotoStorageDir() {
  if (process.env.PHOTO_STORAGE_DIR) {
    return path.resolve(process.env.PHOTO_STORAGE_DIR);
  }
  return path.join(process.cwd(), "storage", "photos");
}
