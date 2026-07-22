// Unique SVG cursive signatures for each user and a reusable approved stamp

interface SigProps {
  userId: string;
  scale?: number;
}

export function SignatureSVG({ userId, scale = 1 }: SigProps) {
  const w = 130 * scale;
  const h = 44 * scale;

  const paths: Record<string, string[]> = {
    u1: ["M10,30 Q16,10 23,26 Q30,40 38,18 Q46,6 54,22 Q62,36 70,16 Q76,6 84,24"],
    u2: ["M8,28 C18,6 28,8 36,24 C44,40 52,10 62,22 C70,30 78,8 88,26", "M72,16 L76,22"],
    u3: ["M10,24 C22,4 32,8 40,22 C48,36 56,10 66,20 C72,26 78,8 86,24", "M56,14 L60,20", "M78,6 L82,12"],
    u4: ["M8,30 Q18,8 28,24 Q38,40 48,14 Q58,4 66,22 Q74,36 82,18 Q88,8 94,26"],
    u5: ["M5,22 C14,5 22,8 30,22 C38,36 46,10 56,22 C64,32 72,8 80,22 C86,32 90,18 96,26", "M88,14 C90,22 94,18 96,22"],
    u6: ["M10,28 Q20,6 28,24 Q36,40 44,14 Q52,4 60,22 Q68,38 76,16 Q82,6 88,26"],
    u7: ["M8,26 C18,4 28,8 36,24 C44,40 52,10 62,22 C70,32 78,6 86,24 C90,34 94,16 100,28"],
    u8: ["M10,26 Q22,5 30,22 Q38,38 48,12 Q56,2 64,20 Q72,36 80,14 Q86,4 92,24"],
  };

  const strokePaths = paths[userId] || ["M10,25 Q35,10 60,25 Q85,40 110,22"];

  return (
    <svg width={w} height={h} viewBox="0 0 130 44" style={{ display: "block" }}>
      {strokePaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#1a3567" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <line x1="6" y1="38" x2={124} y2="38" stroke="#1a3567" strokeWidth={0.6} strokeDasharray="2,2" />
    </svg>
  );
}

export function ApprovedStamp() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ opacity: 0.15 }}>
      <circle cx="36" cy="36" r="32" fill="none" stroke="#059669" strokeWidth="3" />
      <circle cx="36" cy="36" r="27" fill="none" stroke="#059669" strokeWidth="1.5" />
      <text x="36" y="33" textAnchor="middle" fill="#059669" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif" letterSpacing="1">APPROVED</text>
      <text x="36" y="45" textAnchor="middle" fill="#059669" fontSize="7" fontFamily="Inter, sans-serif">KIOT</text>
    </svg>
  );
}
