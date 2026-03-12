import type { CSSProperties } from "react";

type HexagonProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export function Hexagon({
  size = 24,
  className,
  style,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
}: HexagonProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}
