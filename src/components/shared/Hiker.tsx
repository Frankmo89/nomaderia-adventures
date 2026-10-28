import type { CSSProperties } from "react";

interface HikerProps {
  color: string;
  /** Outer class; the /destinos scene places him with `trail-scene__hiker`. */
  className?: string;
  style?: CSSProperties;
}

/**
 * A hiker with a backpack, hat and pole, drawn on a 60×100 box. Legs, arm and
 * pole swing with the `trail-scene__*` keyframes in src/index.css (0.8 s step
 * cycle). Shared by the /destinos header scene (ADR-043) and the calculator
 * (ADR-061). Decorative: callers hide it from screen readers.
 */
const Hiker = ({ color, className = "trail-scene__hiker", style }: HikerProps) => (
  <svg className={className} style={style} viewBox="0 0 60 100" focusable="false" aria-hidden="true">
    <g fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <g className="trail-scene__leg trail-scene__leg--back">
        <path fill="none" strokeWidth="7" d="M30,57 L30,77" />
        <g className="trail-scene__shin">
          <path fill="none" strokeWidth="6" d="M30,77 L30,94" />
          <path strokeWidth="1" d="M26,93 L36,94.5 Q39,99 35.5,99 L26,99 Z" />
        </g>
      </g>
      <g className="trail-scene__upper">
        <rect x="14" y="29" width="14" height="27" rx="4" transform="rotate(-6 21 42)" />
        <ellipse cx="20" cy="28" rx="7.5" ry="3.2" />
        <path strokeWidth="2" d="M25,31 L37,32 L35.5,58 L25,58 Z" />
        <circle cx="35" cy="21" r="6.4" />
        <path strokeWidth="1" d="M29.5,16 L30.5,10.5 Q35,8 39.5,10.5 L40.5,16 Z" />
        <ellipse cx="35" cy="16" rx="9.5" ry="1.9" />
        <g className="trail-scene__arm">
          <path fill="none" strokeWidth="5" d="M33,34 L36.5,45 L41,52" />
          <path fill="none" strokeWidth="1.7" d="M40,49 L47,99" />
        </g>
      </g>
      <g className="trail-scene__leg">
        <path fill="none" strokeWidth="7" d="M30,57 L30,77" />
        <g className="trail-scene__shin">
          <path fill="none" strokeWidth="6" d="M30,77 L30,94" />
          <path strokeWidth="1" d="M26,93 L36,94.5 Q39,99 35.5,99 L26,99 Z" />
        </g>
      </g>
    </g>
  </svg>
);

export default Hiker;
