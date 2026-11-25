import { neighborhoodByName } from "@/lib/neighborhoods";

export function ListingArt({
  id,
  neighborhood,
  label,
}: {
  id: string;
  neighborhood: string;
  label?: string;
}) {
  const tint = neighborhoodByName(neighborhood)?.tint ?? "#2F4A3C";
  const seed = Number(id.replace(/\D/g, "")) || 1;
  const roof = 18 + (seed % 5) * 2;
  const windows = seed % 3;
  return (
    <svg viewBox="0 0 640 360" role="img" aria-label={label ?? `${neighborhood} listing`} className="h-full w-full">
      <rect width="640" height="360" fill="#F3EBDD" />
      <rect width="640" height="360" fill={tint} opacity="0.18" />
      <path d="M0 250 120 190 230 230 360 150 520 220 640 170 640 360 0 360Z" fill={tint} opacity="0.35" />
      <path d="M0 280 160 230 300 270 470 200 640 250 640 360 0 360Z" fill={tint} opacity="0.55" />
      <g transform={`translate(${180 + (seed % 4) * 16} ${150 - (seed % 3) * 6})`}>
        <path d={`M20 ${120 - roof} L140 120 L150 132 H10 Z`} fill={tint} />
        <rect x="28" y="120" width="104" height="78" fill="#F7F1E6" stroke={tint} strokeWidth="3" />
        <rect x="70" y="156" width="22" height="42" fill={tint} />
        {Array.from({ length: windows + 2 }).map((_, index) => (
          <rect key={index} x={40 + (index % 2) * 48} y={132 + Math.floor(index / 2) * 8} width="16" height="14" fill={tint} opacity="0.8" />
        ))}
      </g>
      <text x="28" y="42" fill={tint} fontFamily="Georgia, serif" fontSize="22">
        {neighborhood}
      </text>
    </svg>
  );
}
