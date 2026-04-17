// Water ripple header — web only, using SVG feTurbulence displacement filter
export function WaterTitle() {
  return (
    <svg
      overflow="visible"
      style={{ display: 'block', height: 34, width: '100%' }}
      aria-label="Chadakoin Now"
    >
      <defs>
        <filter id="cn-water" x="-2%" y="-40%" width="104%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.009 0.014"
            numOctaves="2"
            seed="4"
            result="noise"
          >
            {/* Slow undulation — frequency shifts give the water-surface feel */}
            <animate
              attributeName="baseFrequency"
              values="0.008 0.012; 0.013 0.018; 0.008 0.012"
              dur="7s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <text
        y="27"
        style={{
          fontSize: 26,
          fontFamily: 'Syne, sans-serif',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          fill: 'white',
          filter: 'url(#cn-water)',
        }}
      >
        {'Chadakoin '}
        <tspan fill="#22d3ee">Now</tspan>
      </text>
    </svg>
  );
}
