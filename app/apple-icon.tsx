import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 64 64"><path d="M15 5h34a11 11 0 0 1 11 11v23a11 11 0 0 1-11 11H29l-12.5 9.2a1.5 1.5 0 0 1-2.4-1.2V50A11 11 0 0 1 4 39V16A11 11 0 0 1 15 5Z" fill="#f7f5f0"/><rect x="16" y="23" width="5.5" height="11" rx="2.75" fill="#345a49"/><rect x="25" y="16.5" width="5.5" height="24" rx="2.75" fill="#345a49"/><rect x="34" y="20" width="5.5" height="17" rx="2.75" fill="#c46a4a"/><rect x="43" y="24.5" width="5.5" height="8" rx="2.75" fill="#345a49"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(140deg, #4d7d64, #345a49 55%, #223f32)" }}>
        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`} width={120} height={120} alt="" />
      </div>
    ),
    size,
  );
}
