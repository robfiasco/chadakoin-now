import {
  Home,
  Trophy,
  Newspaper,
  Calendar,
  Map,
  ChevronDown,
  ExternalLink,
  Bell
} from "lucide-react";
import { useState } from "react";

export default function SportsRedesign() {
  const [expanded, setExpanded] = useState({
    jcc: false,
    skunks: false,
    sabres: true,
    mlb: false
  });

  const toggle = (key) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5">
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">Sports</h1>
          <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] mt-1.5 font-medium">
            Local teams · Jamestown
          </p>
        </div>

        {/* Next Up hero */}
        <div className="px-6 pb-8">
          <div className="px-1 pb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Next Up
            </h3>
          </div>

          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden hover:bg-slate-900/80 transition">
            <div className="h-20 bg-gradient-to-br from-violet-500/30 via-purple-900/20 to-slate-950 relative overflow-hidden">
              <div className="absolute -right-2 -bottom-2 text-white/[0.06] text-[120px] font-black leading-none">
                ⚾
              </div>
              <div className="absolute top-3 left-4">
                <span className="bg-black/50 backdrop-blur-md text-violet-300 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-white/10">
                  Regional MLB
                </span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[15px] leading-snug tracking-tight">
                  Guardians @ Orioles
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  <span className="font-semibold text-slate-300">Tomorrow</span>
                  <span className="mx-1.5">·</span>
                  <span>6:10 PM ET</span>
                </div>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-400/10 border border-violet-400/30">
                <Bell className="w-3 h-3 text-violet-300" strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Remind
                </span>
              </button>
            </div>
          </button>
        </div>

        {/* LOCAL TEAMS */}
        <div className="px-6 pb-2">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold pb-3">
            Local Teams
          </h3>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* JCC Jayhawks */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggle("jcc")}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/80 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
                <span className="text-emerald-400 text-lg font-black tracking-tighter">J</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] tracking-tight">JCC Jayhawks</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
                  NJCAA
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expanded.jcc ? "rotate-180" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>

            {/* Glance row (always visible) */}
            <div className="px-4 pb-4 -mt-1 space-y-1.5">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-base">⚾</span>
                <span className="text-slate-400 font-medium">Baseball</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-semibold">1-5 last 6</span>
                <span className="text-slate-600">·</span>
                <span className="text-rose-400 font-semibold">L 11-0</span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-base">⚽</span>
                <span className="text-slate-400 font-medium">Soccer</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 font-semibold">W 1-0 @ Pitt Bradford</span>
              </div>
            </div>

            {/* Expanded */}
            {expanded.jcc && (
              <div className="border-t border-slate-800/60 p-4 space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                    Recent Results
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { r: "L", sport: "⚾", v: "@ SUNY Niagara", s: "11-0", d: "Apr 12" },
                      { r: "L", sport: "⚾", v: "@ SUNY Niagara", s: "9-1", d: "Apr 12" },
                      { r: "W", sport: "⚽", v: "@ Pitt Bradford", s: "1-0", d: "Apr 11" },
                      { r: "L", sport: "⚾", v: "vs SUNY Niagara", s: "6-0", d: "Apr 11" },
                      { r: "L", sport: "⚾", v: "vs Erie CC", s: "10-3", d: "Apr 9" }
                    ].map((g, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 text-[12px]">
                        <span
                          className={`w-5 text-center font-black text-[11px] ${
                            g.r === "W" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {g.r}
                        </span>
                        <span className="text-sm">{g.sport}</span>
                        <span className="flex-1 text-slate-300 truncate">{g.v}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            g.r === "W" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {g.s}
                        </span>
                        <span className="text-slate-500 text-[11px] w-12 text-right">{g.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                  Full schedule <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Tarp Skunks */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggle("skunks")}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/80 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-lime-500/30 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
                <span className="text-lime-400 text-lg">⚾</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] tracking-tight">Tarp Skunks</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
                  PGCBL · Diethrick Park
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expanded.skunks ? "rotate-180" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>

            <div className="px-4 pb-4 -mt-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-slate-400 font-medium">Season opens</span>
                <span className="text-lime-400 font-bold">May 29</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-500">43 days</span>
              </div>
            </div>

            {expanded.skunks && (
              <div className="border-t border-slate-800/60 p-4 space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                    Upcoming Home Games
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { d: "May 29", day: "Thu", o: "vs Olean Oilers", t: "6:30 PM" },
                      { d: "Jun 2", day: "Mon", o: "vs Olean Oilers", t: "6:30 PM" },
                      { d: "Jun 9", day: "Mon", o: "vs Olean Oilers", t: "11:00 AM" }
                    ].map((g, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 text-[12px]">
                        <div className="w-12">
                          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                            {g.day}
                          </div>
                          <div className="text-lime-400 font-bold">{g.d}</div>
                        </div>
                        <span className="flex-1 text-slate-300">{g.o}</span>
                        <span className="text-slate-500 text-[11px]">{g.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REGIONAL */}
        <div className="px-6 pb-2">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold pb-3">
            Regional
          </h3>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {/* Sabres */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggle("sabres")}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/80 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/30 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
                <span className="text-sky-400 text-lg font-black tracking-tighter">S</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] tracking-tight">Buffalo Sabres</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
                  NHL · Atlantic
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expanded.sabres ? "rotate-180" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>

            <div className="px-4 pb-4 -mt-1">
              <div className="flex items-center gap-2 text-[12px] flex-wrap">
                <span className="text-sky-400 font-bold tabular-nums">50-23-9</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">109 PTS · 1st Atlantic</span>
              </div>
            </div>

            {expanded.sabres && (
              <div className="border-t border-slate-800/60 p-4 space-y-4">
                {/* Last/Next */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                      Last
                    </div>
                    <div className="font-bold text-[13px] mt-1 tabular-nums">BUF 3 · DAL 4</div>
                    <div className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                      Loss
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
                    <div className="text-[9px] uppercase tracking-wider text-sky-400 font-bold">
                      Next
                    </div>
                    <div className="font-bold text-[13px] mt-1">vs BOS</div>
                    <div className="text-slate-400 text-[10px] mt-1">Apr 19 · 12:00 PM</div>
                  </div>
                </div>

                {/* Top scorers */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">
                    Top Scorers
                  </div>
                  <div className="space-y-1">
                    {[
                      { n: "T. Thompson", g: 44, a: 39, p: 83 },
                      { n: "R. Dahlin", g: 12, a: 51, p: 63 },
                      { n: "A. Tuch", g: 27, a: 35, p: 62 }
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-[12px] py-1"
                      >
                        <span className="flex-1 text-slate-300 truncate">{p.n}</span>
                        <span className="w-8 text-right text-slate-500 tabular-nums">{p.g}G</span>
                        <span className="w-8 text-right text-slate-500 tabular-nums">{p.a}A</span>
                        <span className="w-10 text-right font-bold text-sky-400 tabular-nums">
                          {p.p}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional MLB */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <button
              onClick={() => toggle("mlb")}
              className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/80 transition"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/30 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
                <span className="text-violet-300 text-[10px] font-black tracking-tighter">MLB</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] tracking-tight">Regional MLB</div>
                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">
                  CLE · TOR · PIT · NYY
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  expanded.mlb ? "rotate-180" : ""
                }`}
                strokeWidth={2.5}
              />
            </button>

            <div className="px-4 pb-4 -mt-1">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-slate-400">Tomorrow:</span>
                <span className="text-violet-300 font-semibold">CLE vs BAL · 6:10 PM</span>
              </div>
            </div>

            {expanded.mlb && (
              <div className="border-t border-slate-800/60 p-4 space-y-2">
                {[
                  { t: "CLE", n: "Guardians", r: "11-9", c: "text-red-400", next: "vs BAL · Tmrw 6:10p" },
                  { t: "TOR", n: "Blue Jays", r: "7-11", c: "text-blue-400", next: "vs TB · Tmrw 7:05p" },
                  { t: "PIT", n: "Pirates", r: "11-8", c: "text-amber-400", next: "vs MIL · Tmrw 6:40p" },
                  { t: "NYY", n: "Yankees", r: "10-9", c: "text-slate-300", next: "vs DET · Tmrw 7:05p" }
                ].map((team, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40 transition text-left"
                  >
                    <div className={`w-8 text-center font-black text-[11px] ${team.c}`}>
                      {team.t}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-200 truncate">
                        {team.n}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{team.next}</div>
                    </div>
                    <span className="text-[11px] text-slate-400 tabular-nums font-medium">
                      {team.r}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#060e18]/95 backdrop-blur-xl border-t border-slate-800/80">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 pb-6">
          {[
            { icon: Home, label: "Home", active: false },
            { icon: Trophy, label: "Sports", active: true },
            { icon: Newspaper, label: "News", active: false },
            { icon: Calendar, label: "Events", active: false },
            { icon: Map, label: "Visit", active: false }
          ].map(({ icon: Icon, label, active }) => (
            <button key={label} className="flex flex-col items-center gap-1 px-3">
              <div className={active ? "p-1.5 rounded-lg bg-cyan-400/10" : ""}>
                <Icon
                  className={`w-5 h-5 ${active ? "text-cyan-400" : "text-slate-500"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-cyan-400" : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
