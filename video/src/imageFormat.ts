/** Still images the Remotion renderer can decode. HEIC is an iPhone default and fails in Chrome. */

const ACCEPTED = new Set(["jpg", "jpeg", "png"]);

export function imageExtension(src: string): string | null {
  const path = src.split("?")[0]?.split("#")[0] ?? src;
  const base = path.split("/").pop() ?? path;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return null;
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Throws a clear error for .heic/.HEIC (and other non jpg/png stills).
 * URLs or paths with no extension are left alone (remote assets may omit one).
 */
export function assertImageSrc(src: string): void {
  const ext = imageExtension(src);
  if (!ext) return;
  if (ext === "heic" || ext === "heif") {
    throw new Error(
      `HEIC is not supported: "${src}". Export the photo as .jpg or .png (not .heic / .HEIC) and update the script src. Chrome and Remotion cannot decode HEIC.`,
    );
  }
  if (!ACCEPTED.has(ext)) {
    throw new Error(
      `Unsupported image "${src}" (.${ext}). Accepted stills: .jpg, .jpeg, .png.`,
    );
  }
}

export function assertImageScenes(scenes: { type?: string; src?: string }[]): void {
  for (const scene of scenes) {
    if (scene.type !== "image" || !scene.src) continue;
    assertImageSrc(scene.src);
  }
}
