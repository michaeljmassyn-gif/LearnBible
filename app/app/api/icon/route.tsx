import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const size = Math.min(Math.max(parseInt(searchParams.get("size") || "192"), 16), 512)
  const radius = Math.round(size * 0.22)
  const bookSize = Math.round(size * 0.58)

  return new ImageResponse(
    (
      <div
        style={{
          background: "#F5D020",
          borderRadius: radius,
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={bookSize}
          height={bookSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="#1a1a2e" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="#1a1a2e" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  )
}
