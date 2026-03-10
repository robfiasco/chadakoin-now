import { useState } from "react";

const BASE_CSS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');`;

// ─── SHARED ARCTIC LAYOUT ─────────────────────────────────────────────────
// Each theme passes: bg gradient, accent hex, orb colors, glow rgba string
function ArcticLayout({ theme }) {
  const { bg, acc, acc55, acc45, accRGB, orb1, orb2, gridColor, warmWarn } = theme;
  const styleId = `arctic-${acc.replace("#","")}`;

  return (
    <div style={{ fontFamily:"'Outfit',sans-serif", background:bg, minHeight:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      <style>{`
        .${styleId}-bg {
          position:absolute; inset:0;
          background-image:
            linear-gradient(${gridColor} 1px, transparent 1px),
            linear-gradient(90deg, ${gridColor} 1px, transparent 1px);
          background-size:28px 28px;
          pointer-events:none;
        }
        .${styleId}-orb1 {
          position:absolute; width:400px; height:250px;
          background:radial-gradient(ellipse, ${orb1} 0%, transparent 60%);
          top:-60px; right:-80px; border-radius:50%;
          animation:${styleId}drift 12s ease-in-out infinite alternate;
          pointer-events:none;
        }
        .${styleId}-orb2 {
          position:absolute; width:280px; height:200px;
          background:radial-gradient(ellipse, ${orb2} 0%, transparent 60%);
          bottom:120px; left:-60px; border-radius:50%;
          animation:${styleId}drift 9s ease-in-out 3s infinite alternate-reverse;
          pointer-events:none;
        }
        @keyframes ${styleId}drift { 0%{transform:translate(0,0)} 100%{transform:translate(14px,16px)} }

        .${styleId}-panel {
          background:rgba(${accRGB},0.05);
          border:1px solid rgba(${accRGB},0.16);
          backdrop-filter:blur(30px);
          border-radius:20px;
        }
        .${styleId}-panel-glow {
          background:rgba(${accRGB},0.07);
          border:1px solid rgba(${accRGB},0.22);
          backdrop-filter:blur(30px);
          border-radius:20px;
          box-shadow:0 0 40px rgba(${accRGB},0.07), inset 0 1px 0 rgba(${accRGB},0.12);
        }
        .${styleId}-stat {
          flex:1; text-align:center;
          background:rgba(${accRGB},0.08);
          border:1px solid rgba(${accRGB},0.18);
          border-radius:10px; padding:9px 0;
        }
        .${styleId}-row { border-bottom:1px solid rgba(${accRGB},0.08); }
        .${styleId}-row:last-child { border-bottom:none; }
        .${styleId}-chip-a {
          font-size:11px; font-weight:700; padding:3px 12px;
          border-radius:6px; text-transform:uppercase; letter-spacing:0.06em;
          background:rgba(${accRGB},0.15); color:${acc};
          border:1px solid rgba(${accRGB},0.28);
        }
        .${styleId}-chip-n {
          font-size:11px; font-weight:600; padding:3px 12px;
          border-radius:6px; text-transform:uppercase; letter-spacing:0.06em;
          background:transparent; color:rgba(255,255,255,0.4);
          border:1px solid rgba(255,255,255,0.12);
        }
        .${styleId}-dot {
          width:6px; height:6px; border-radius:50%;
          background:${acc}; box-shadow:0 0 8px ${acc};
          animation:${styleId}pulse 1.6s ease-in-out infinite;
        }
        @keyframes ${styleId}pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .${styleId}-nav {
          background:rgba(0,5,15,0.7);
          border:1px solid rgba(${accRGB},0.14);
          backdrop-filter:blur(24px);
          border-radius:16px; display:flex; overflow:hidden;
        }
      `}</style>

      <div className={`${styleId}-bg`}/>
      <div className={`${styleId}-orb1`}/>
      <div className={`${styleId}-orb2`}/>

      {/* Header */}
      <div style={{ padding:"26px 20px 14px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:700, color:"#fff", letterSpacing:"0.01em" }}>Chadakoin Now</div>
            <div style={{ fontSize:11, color:acc55, marginTop:3, letterSpacing:"0.08em" }}>Jamestown, NY</div>
          </div>
          <div style={{
            background:`rgba(${accRGB},0.1)`, border:`1px solid rgba(${accRGB},0.22)`,
            borderRadius:8, padding:"6px 12px",
            display:"inline-flex", alignItems:"center", gap:5,
            fontSize:10, fontWeight:700, color:acc, letterSpacing:"0.12em", textTransform:"uppercase",
          }}>
            <div className={`${styleId}-dot`}/>MON 9
          </div>
        </div>
      </div>

      <div style={{ padding:"0 16px", flex:1, display:"flex", flexDirection:"column", gap:10, position:"relative", zIndex:1 }}>

        {/* Weather card */}
        <div className={`${styleId}-panel-glow`} style={{ padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:62, fontWeight:600, color:"#fff", lineHeight:1, textShadow:`0 0 50px rgba(${accRGB},0.35)` }}>42°</div>
              <div style={{ fontSize:12, color:acc, fontWeight:600, marginTop:6, letterSpacing:"0.06em" }}>Light Snow</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:40 }}>🌨️</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:6 }}>H 45° · L 31°</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            {[["Precip","60%"],["Wind","12 mph"],["H/L","45/31"]].map(([k,v]) => (
              <div key={k} className={`${styleId}-stat`}>
                <div style={{ fontSize:9, color:acc55, letterSpacing:"0.12em", textTransform:"uppercase" }}>{k}</div>
                <div style={{ fontSize:15, fontWeight:600, color:"#fff", marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:10, background:warmWarn.bg, borderRadius:8, padding:"8px 12px", fontSize:11, color:warmWarn.text, border:warmWarn.border }}>
            ⚠️ Snow tonight — check parking rules
          </div>
        </div>

        {/* Info card */}
        <div className={`${styleId}-panel`} style={{ padding:"6px 16px" }}>
          <div style={{ fontSize:9, letterSpacing:"0.14em", color:acc45, textTransform:"uppercase", padding:"10px 0 6px", fontWeight:700 }}>This Week</div>
          {[
            ["Holiday Delay","No delay",true],
            ["Recycling","Cardboard",false],
            ["Parking","Even side today",false],
            ["Active Alerts","None",true],
          ].map(([l,v,g]) => (
            <div key={l} className={`${styleId}-row`} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0" }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", fontWeight:500 }}>{l}</div>
              <span className={`${styleId}-chip-${g?"a":"n"}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ position:"relative", zIndex:1, padding:"10px 16px 18px" }}>
        <div className={`${styleId}-nav`}>
          {["Home","Recycle","Parking","Alerts","Events"].map((n,i) => (
            <div key={n} style={{
              flex:1, textAlign:"center", padding:"11px 0",
              fontSize:10, fontWeight:600,
              color:i===0?acc:"rgba(255,255,255,0.28)",
              background:i===0?`rgba(${accRGB},0.1)`:"transparent",
              borderRight:i<4?`1px solid rgba(${accRGB},0.08)`:"none",
            }}>{n}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── THEME DEFINITIONS ─────────────────────────────────────────────────────
const THEMES = [
  {
    id: "green",
    label: "Arctic Green",
    sub: "Teal · Cyan",
    swatchColor: "#00d4ff",
    data: {
      bg: "linear-gradient(180deg, #020c14 0%, #030f1c 60%, #020a12 100%)",
      acc: "#00d4ff",
      acc55: "rgba(0,212,255,0.55)",
      acc45: "rgba(0,212,255,0.45)",
      accRGB: "0,200,255",
      orb1: "rgba(0,200,255,0.12)",
      orb2: "rgba(0,120,200,0.1)",
      gridColor: "rgba(0,212,255,0.03)",
      warmWarn: { bg:"rgba(255,190,40,0.09)", text:"#ffd060", border:"1px solid rgba(255,190,40,0.2)" },
    },
  },
  {
    id: "solar",
    label: "Solar Flare",
    sub: "Amber · Orange",
    swatchColor: "#ffaa00",
    data: {
      bg: "radial-gradient(ellipse at 25% 0%, #1a0e00 0%, #0d0900 50%, #080500 100%)",
      acc: "#ffaa00",
      acc55: "rgba(255,170,0,0.55)",
      acc45: "rgba(255,170,0,0.45)",
      accRGB: "255,160,0",
      orb1: "rgba(255,140,0,0.13)",
      orb2: "rgba(255,60,0,0.09)",
      gridColor: "rgba(255,140,0,0.03)",
      warmWarn: { bg:"rgba(255,80,0,0.1)", text:"#ff8855", border:"1px solid rgba(255,80,0,0.22)" },
    },
  },
  {
    id: "blood",
    label: "Bloodmoon",
    sub: "Crimson · Red",
    swatchColor: "#ff4466",
    data: {
      bg: "radial-gradient(ellipse at 30% 0%, #130004 0%, #0a0003 50%, #060002 100%)",
      acc: "#ff4466",
      acc55: "rgba(255,50,80,0.55)",
      acc45: "rgba(255,50,80,0.45)",
      accRGB: "255,50,80",
      orb1: "rgba(220,0,50,0.14)",
      orb2: "rgba(180,0,30,0.09)",
      gridColor: "rgba(220,0,50,0.03)",
      warmWarn: { bg:"rgba(255,100,30,0.12)", text:"#ff8855", border:"1px solid rgba(255,100,30,0.22)" },
    },
  },
  {
    id: "violet",
    label: "Violet Wave",
    sub: "Purple · Magenta",
    swatchColor: "#bf7fff",
    data: {
      bg: "linear-gradient(160deg, #08041a 0%, #0d0520 50%, #060212 100%)",
      acc: "#c490ff",
      acc55: "rgba(200,130,255,0.55)",
      acc45: "rgba(200,130,255,0.45)",
      accRGB: "180,80,255",
      orb1: "rgba(150,50,255,0.14)",
      orb2: "rgba(220,80,255,0.09)",
      gridColor: "rgba(150,50,255,0.03)",
      warmWarn: { bg:"rgba(255,180,40,0.09)", text:"#ffd060", border:"1px solid rgba(255,180,40,0.2)" },
    },
  },
];

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("green");
  const current = THEMES.find(t => t.id === active);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#080808", fontFamily:"system-ui,sans-serif" }}>
      <style>{BASE_CSS}</style>

      {/* Theme picker */}
      <div style={{ display:"flex", gap:8, padding:"12px 16px", borderBottom:"1px solid #161616", overflowX:"auto", flexShrink:0 }}>
        {THEMES.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            flex:"0 0 auto", padding:"8px 16px", borderRadius:10, cursor:"pointer",
            border: active===t.id ? `2px solid ${t.swatchColor}` : "2px solid #1e1e1e",
            background: active===t.id ? `rgba(100,100,100,0.12)` : "#111",
            textAlign:"left", lineHeight:1.4, transition:"all 0.15s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:t.swatchColor, boxShadow:`0 0 8px ${t.swatchColor}` }}/>
              <span style={{ fontSize:12, fontWeight:700, color:active===t.id ? t.swatchColor : "#aaa" }}>{t.label}</span>
            </div>
            <div style={{ fontSize:10, fontWeight:400, color:"#555", marginTop:3, paddingLeft:17 }}>{t.sub}</div>
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflow:"hidden" }}>
        <div style={{
          width:375, height:"min(760px, calc(100vh - 120px))",
          borderRadius:40, overflow:"hidden",
          boxShadow:`0 30px 80px rgba(0,0,0,0.85), 0 0 0 10px #111, 0 0 0 11px #1a1a1a, 0 0 60px rgba(100,100,100,0.05)`,
          display:"flex", flexDirection:"column",
        }}>
          <ArcticLayout key={active} theme={current.data} />
        </div>
      </div>
    </div>
  );
}
