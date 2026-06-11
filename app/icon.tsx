import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "7px",
        }}
      >
        <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", paddingBottom: "5px" }}>
          {[14, 20, 26, 18].map((h, i) => (
            <div
              key={i}
              style={{
                width: "5px",
                height: `${h}px`,
                background: "white",
                borderRadius: "1.5px",
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
