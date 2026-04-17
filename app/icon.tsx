import { ImageResponse } from 'next/og'

// Definition der Bildgrösse und des Typs
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000', // Entspricht deiner bg-primary (meist schwarz oder indigo)
          borderRadius: '8px',
          color: '#ffffff',      // Entspricht text-primary-foreground
        }}
      >
        {/* Das "Route" Icon als SVG */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="6" cy="19" r="3" />
          <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
          <circle cx="18" cy="5" r="3" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
