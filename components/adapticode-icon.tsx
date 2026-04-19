"use client";

import { useId, useMemo } from "react";

interface AdapticodeIconProps {
  size?: number;
  showText?: boolean;
}

const AdapticodeIcon = ({
  size = 24,
  showText = false,
}: AdapticodeIconProps) => {
  const rawId = useId();

  // 🔒 ID estável para SSR/CSR
  const id = useMemo(() => rawId.replace(/:/g, ""), [rawId]);

  const r = `ag-r-${id}`;
  const d = `ag-d-${id}`;
  const txt = `ag-t-${id}`;
  const wL = `ag-wL-${id}`;
  const wR = `ag-wR-${id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      <defs>
        <linearGradient
          id={r}
          x1="110"
          y1="5"
          x2="110"
          y2="215"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="45%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#F0154A" />
        </linearGradient>

        <linearGradient
          id={d}
          x1="60"
          y1="40"
          x2="160"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#F0154A" />
        </linearGradient>

        <linearGradient
          id={txt}
          x1="95"
          y1="0"
          x2="175"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#F0154A" />
        </linearGradient>

        <linearGradient
          id={wL}
          x1="35"
          y1="0"
          x2="98"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>

        <linearGradient
          id={wR}
          x1="118"
          y1="0"
          x2="185"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#F0154A" />
        </linearGradient>
      </defs>

      {/* Decorativos */}
      <circle cx="57" cy="50" r="5" fill="#4F7AF8" opacity="0.5" />
      <circle cx="165" cy="50" r="5" fill="#D946A8" opacity="0.5" />
      <circle cx="33" cy="132" r="3.5" fill="#4F7AF8" opacity="0.35" />
      <circle cx="188" cy="132" r="3.5" fill="#F0154A" opacity="0.35" />

      {/* Círculo */}
      <circle
        cx="110"
        cy="106"
        r="97"
        stroke={`url(#${r})`}
        strokeWidth="5.5"
        fill="none"
      />

      {/* Dispositivos */}
      <rect
        x="52"
        y="58"
        width="26"
        height="52"
        rx="5"
        stroke={`url(#${d})`}
        strokeWidth="2.8"
      />
      <rect
        x="76"
        y="50"
        width="34"
        height="60"
        rx="5.5"
        stroke={`url(#${d})`}
        strokeWidth="2.8"
      />
      <rect
        x="107"
        y="43"
        width="56"
        height="67"
        rx="8"
        stroke={`url(#${d})`}
        strokeWidth="3.2"
      />

      {/* Chevrons */}
      <path
        d="M36 134 L29 141 L36 148"
        stroke={`url(#${r})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M184 134 L191 141 L184 148"
        stroke={`url(#${r})`}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Ondas */}
      <path
        d="M46 141 C53 134 60 134 67 141 C74 148 81 148 88 141 C92 137 96 136 100 137"
        stroke={`url(#${wL})`}
        strokeWidth="2"
        strokeDasharray="2.5 3.5"
        strokeLinecap="round"
      />

      <line
        x1="103"
        y1="138"
        x2="117"
        y2="138"
        stroke="#9333EA"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M120 137 C124 136 129 148 136 141 C143 134 150 134 157 141 C164 148 170 148 176 141"
        stroke={`url(#${wR})`}
        strokeWidth="2"
        strokeDasharray="2.5 3.5"
        strokeLinecap="round"
      />

      {/* Pontos */}
      <circle cx="67" cy="141" r="3.5" fill="#5B21B6" />
      <circle cx="88" cy="141" r="3" fill="#7C3AED" />
      <circle cx="136" cy="141" r="3.5" fill="#BE185D" />
      <circle cx="157" cy="141" r="3" fill="#E11D69" />

      {/* Texto */}
      {showText && (
        <text
          x="52"
          y="178"
          fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
          fontWeight="900"
          fontSize="19"
          letterSpacing="1"
        >
          <tspan fill="#1a1a2e">ADAPTI</tspan>
          <tspan fill={`url(#${txt})`}>CODE</tspan>
        </text>
      )}
    </svg>
  );
};

export default AdapticodeIcon;
