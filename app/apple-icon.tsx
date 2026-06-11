import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#2563eb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", paddingBottom: "18px" }}>
          {[50, 72, 95, 65].map((h, i) => (
            <div
              key={i}
              style={{
                width: "18px",
                height: `${h}px`,
                background: "white",
                borderRadius: "5px",
                opacity: i % 2 === 0 ? 0.85 : 1,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
