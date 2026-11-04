import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 44,
          backgroundColor: "#E8F4EE",
        }}
      >
        <svg width="108" height="108" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 10.5c-1.6 5.7-5.8 9.9-11.5 11.5 5.7 1.6 9.9 5.8 11.5 11.5 1.6-5.7 5.8-9.9 11.5-11.5-5.7-1.6-9.9-5.8-11.5-11.5Z"
            fill="#236B54"
          />
          <circle cx="24" cy="23" r="3.2" fill="#F7FAF8" />
        </svg>
      </div>
    ),
    size,
  );
}
