import { ImageResponse } from "next/og";

export const alt = "SpeakEasy: practice the hard conversation once before it counts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64"><path d="M15 5h34a11 11 0 0 1 11 11v23a11 11 0 0 1-11 11H29l-12.5 9.2a1.5 1.5 0 0 1-2.4-1.2V50A11 11 0 0 1 4 39V16A11 11 0 0 1 15 5Z" fill="#345a49"/><rect x="16" y="23" width="5.5" height="11" rx="2.75" fill="#f7f5f0"/><rect x="25" y="16.5" width="5.5" height="24" rx="2.75" fill="#f7f5f0"/><rect x="34" y="20" width="5.5" height="17" rx="2.75" fill="#e2ae4f"/><rect x="43" y="24.5" width="5.5" height="8" rx="2.75" fill="#f7f5f0"/></svg>`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "#232a28",
        background: "radial-gradient(circle at 15% 20%, rgba(52,90,73,.22), transparent 45%), radial-gradient(circle at 85% 10%, rgba(226,174,79,.3), transparent 40%), radial-gradient(circle at 90% 90%, rgba(196,106,74,.18), transparent 40%), #f7f5f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`} width={96} height={96} alt="" />
          <div style={{ display: "flex", fontSize: 56, fontWeight: 700, letterSpacing: -2, color: "#345a49" }}>SpeakEasy</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: -3, maxWidth: 980 }}>Have the hard conversation once before it counts.</div>
          <div style={{ fontSize: 30, color: "#626963" }}>Live video practice with fictional AI characters.</div>
        </div>
      </div>
    ),
    size,
  );
}
