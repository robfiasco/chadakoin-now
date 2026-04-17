export default function FinalChadakoinIcon() {
  const WARM_BLACK = "#0f0b08";
  const STEEL = "#4a6fa5";
  const LIGHT_GREY = "#d1d5db";

  const Icon = ({ size = 200, radius = 44 }) => (
    <svg viewBox="0 0 200 200" width={size} height={size} className="block">
      <rect width="200" height="200" rx={radius} fill={WARM_BLACK} />
      <text x="58" y="132" textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Garamond', serif"
        fontSize="115" fontWeight="500" fill={STEEL}>C</text>
      <text x="142" y="132" textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Garamond', serif"
        fontSize="115" fontWeight="500" fill={LIGHT_GREY}>N</text>
    </svg>
  );

  // For favicon test (no rounded corners — browsers apply their own)
  const IconFavicon = ({ size = 32 }) => (
    <svg viewBox="0 0 200 200" width={size} height={size} className="block">
      <rect width="200" height="200" fill={WARM_BLACK} />
      <text x="58" y="132" textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Garamond', serif"
        fontSize="115" fontWeight="500" fill={STEEL}>C</text>
      <text x="142" y="132" textAnchor="middle"
        fontFamily="'Cormorant Garamond', 'Garamond', serif"
        fontSize="115" fontWeight="500" fill={LIGHT_GREY}>N</text>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] font-bold mb-2">
            Final Icon
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Chadakoin Now.
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Steel C, grey N, warm black background, serif Garamond.
          </p>
        </div>

        {/* Hero — large preview with spec */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="rounded-[44px] overflow-hidden shadow-2xl shadow-black/80">
              <Icon size={280} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Specs</h2>
              <div className="space-y-3 text-sm">
                <SpecRow label="Background" value="Warm Black" hex={WARM_BLACK} />
                <SpecRow label="C" value="Steel" hex={STEEL} />
                <SpecRow label="N" value="Light Grey" hex={LIGHT_GREY} />
                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Font</span>
                    <span className="font-mono text-xs">Cormorant Garamond, 500</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-2">
                    <span>Size</span>
                    <span className="font-mono text-xs">115px / 200px canvas</span>
                  </div>
                  <div className="flex justify-between text-slate-400 mt-2">
                    <span>Corner radius</span>
                    <span className="font-mono text-xs">44px (iOS standard)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Size ladder */}
        <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-8 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold mb-6">
            Size ladder
          </h2>
          <div className="flex items-end gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[44px] overflow-hidden shadow-xl shadow-black/60">
                <Icon size={180} radius={40} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">App Store 1024</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[24px] overflow-hidden shadow-xl shadow-black/60">
                <Icon size={120} radius={27} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Spotlight 120</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[14px] overflow-hidden shadow-lg shadow-black/40">
                <Icon size={80} radius={18} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Home 80</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[10px] overflow-hidden shadow-md shadow-black/40">
                <Icon size={58} radius={13} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Home 58</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[7px] overflow-hidden shadow shadow-black/40">
                <Icon size={40} radius={9} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Settings 40</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[5px] overflow-hidden">
                <Icon size={29} radius={6} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Notification 29</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[3px] overflow-hidden">
                <IconFavicon size={16} />
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Favicon 16</span>
            </div>
          </div>
        </div>

        {/* Home screen mockup */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 md:p-8 border border-slate-800 mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold mb-6">
            On the home screen
          </h2>
          <div className="grid grid-cols-4 gap-5 md:gap-8 max-w-md mx-auto">
            <NeighborApp color="#007AFF" label="Maps" />
            <NeighborApp color="#34C759" label="Messages" />
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-[14px] overflow-hidden shadow-xl shadow-black/60">
                <Icon size={62} radius={14} />
              </div>
              <span className="text-[11px] text-white/90 font-medium text-center leading-tight">
                Chadakoin<br />Now
              </span>
            </div>
            <NeighborApp color="#FF3B30" label="Music" />

            <NeighborApp color="#FF9500" label="News" />
            <NeighborApp color="#AF52DE" label="Podcasts" />
            <NeighborApp color="#5AC8FA" label="Weather" />
            <NeighborApp color="#FFCC00" label="Notes" />
          </div>
        </div>

        {/* Export note */}
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-slate-900/40 border border-cyan-400/20 p-6">
          <h3 className="text-base font-bold tracking-tight mb-2">To export</h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-3">
            The SVG above is render-accurate. For production you'll want:
          </p>
          <ul className="text-slate-400 text-sm space-y-1.5 list-disc list-inside">
            <li>1024×1024 PNG for App Store</li>
            <li>iOS app icon set (Xcode generates from 1024)</li>
            <li>Android adaptive icon (foreground at 432×432 safe zone within 512×512)</li>
            <li>32×32 and 16×16 favicon (rasterize, don't scale SVG — hint the letters)</li>
            <li>Monochrome variant for iOS 18 tinted mode</li>
          </ul>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed">
            Use Cormorant Garamond as the source font. Convert letters to outlined paths before export so the final PNG renders identically regardless of system fonts.
          </p>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value, hex }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-white font-semibold">{value}</span>
        <div className="w-5 h-5 rounded border border-slate-700" style={{ background: hex }} />
        <span className="text-slate-500 font-mono text-xs w-[70px] text-right">{hex}</span>
      </div>
    </div>
  );
}

function NeighborApp({ color, label }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-70">
      <div
        className="w-[62px] h-[62px] rounded-[14px] flex items-center justify-center shadow-xl shadow-black/40"
        style={{ background: color }}
      >
        <div className="w-6 h-6 rounded bg-white/30" />
      </div>
      <span className="text-[11px] text-white/70 font-medium text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
