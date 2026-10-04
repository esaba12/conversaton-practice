// The SpeakEasy mark: a speech bubble holding a voice waveform. Keep in step with app/icon.svg.
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="speakeasy-bubble" x1="6" y1="4" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4d7d64" />
          <stop offset=".55" stopColor="#345a49" />
          <stop offset="1" stopColor="#223f32" />
        </linearGradient>
      </defs>
      <path d="M15 5h34a11 11 0 0 1 11 11v23a11 11 0 0 1-11 11H29l-12.5 9.2a1.5 1.5 0 0 1-2.4-1.2V50A11 11 0 0 1 4 39V16A11 11 0 0 1 15 5Z" fill="url(#speakeasy-bubble)" />
      <rect x="16" y="23" width="5.5" height="11" rx="2.75" fill="#f7f5f0" />
      <rect x="25" y="16.5" width="5.5" height="24" rx="2.75" fill="#f7f5f0" />
      <rect x="34" y="20" width="5.5" height="17" rx="2.75" fill="#e2ae4f" />
      <rect x="43" y="24.5" width="5.5" height="8" rx="2.75" fill="#f7f5f0" />
    </svg>
  );
}
