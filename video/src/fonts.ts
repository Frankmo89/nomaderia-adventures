import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadPermanentMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const oswald = loadOswald("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});
const permanentMarker = loadPermanentMarker();
const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const fontOswald = oswald.fontFamily;
export const fontMarker = permanentMarker.fontFamily;
export const fontInter = inter.fontFamily;
