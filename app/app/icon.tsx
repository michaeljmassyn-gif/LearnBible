import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5D020",
          borderRadius: 8,
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
            fill="#1a1a2e"
          />
          <path
            d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
            fill="#1a1a2e"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
