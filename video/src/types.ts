export type SceneType = "clip" | "image" | "card" | "data";

export type ReelScene = {
  type: SceneType;
  /** Public URL or path under video/public/ (e.g. clips/foo.mp4). */
  src?: string;
  seconds: number;
  text?: string;
  /** One word highlighted in Sunset Amber (#D97706). */
  highlight?: string;
};

export type ReelData = {
  park?: string;
  driveFromSD?: string;
  level?: string;
  fee?: string;
  bestSeason?: string;
};

/** Remotion Composition props must be assignable to Record<string, unknown>. */
export type ReelScript = {
  id: string;
  scenes: ReelScene[];
  data?: ReelData;
  credit?: string;
  cta?: string;
} & Record<string, unknown>;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
/** Keep text out of these UI chrome / caption zones. */
export const SAFE = {
  top: 250,
  bottom: 350,
  right: 150,
} as const;

export const COLORS = {
  cloud: "#FBFAF7",
  ink: "#13211A",
  green: "#1F6F43",
  forest: "#14201A",
  amber: "#D97706",
} as const;

export const CTA_SECONDS = 2;

export function sceneFrames(seconds: number): number {
  return Math.max(1, Math.round(seconds * FPS));
}

export function totalDurationFrames(script: ReelScript): number {
  const content = (script.scenes ?? []).reduce(
    (sum, s) => sum + sceneFrames(s.seconds ?? 3),
    0,
  );
  return content + sceneFrames(CTA_SECONDS);
}
