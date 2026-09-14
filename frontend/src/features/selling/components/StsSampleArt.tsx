export interface SampleArtProps {
  good: boolean
}

export function SampleDocument({ good }: SampleArtProps) {
  return (
    <>
      <g transform={good ? 'translate(20 18)' : 'translate(34 10) rotate(9)'}>
        <rect width="120" height="84" rx="4" fill="#f3e7c9" stroke="#b9a77c" />
        <rect x="10" y="10" width="46" height="6" rx="2" fill="#9c8a5f" />
        {[26, 38, 50, 62].map((y) => (
          <rect key={y} x="10" y={y} width={y === 50 ? 70 : 96} height="4" rx="2" fill="#bba981" />
        ))}
      </g>
      {good ? null : (
        <>
          <ellipse cx="92" cy="52" rx="30" ry="18" fill="#ffffff" opacity="0.85" />
          <rect x="140" y="0" width="20" height="120" fill="var(--surface-sunken, #eef1f5)" />
        </>
      )}
    </>
  )
}

export function SampleBadge({ good }: SampleArtProps) {
  return (
    <>
      <circle
        cx="146"
        cy="16"
        r="10"
        fill={good ? 'var(--measure-ok, #1f9d55)' : 'var(--measure-bad, #d64545)'}
      />
      <path
        d={good ? 'M141 16l3.5 3.5L151 12' : 'M142 12l8 8M150 12l-8 8'}
        stroke="#fff"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  )
}
