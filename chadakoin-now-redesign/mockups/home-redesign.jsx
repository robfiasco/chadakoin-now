import {
  Home,
  Trophy,
  Newspaper,
  Calendar,
  Map,
  Settings,
  Cloud,
  Recycle,
  Car,
  Play,
  Radio,
  BookOpen,
  ChevronRight,
  GraduationCap
} from "lucide-react";

export default function HomeRedesign() {
  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">
              Chadakoin Now
            </h1>
            <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] mt-1.5 font-medium">
              Jamestown, NY
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                Thu 16
              </span>
            </div>
            <button className="p-2 rounded-full bg-slate-900/60 border border-slate-800">
              <Settings className="w-4 h-4 text-slate-400" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Weather card — simplified */}
        <div className="px-6 pb-4">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[56px] font-bold leading-none tracking-tight">60°</div>
                <div className="text-emerald-400 text-sm font-medium mt-2">
                  Overcast Clouds
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  H 67° · L 52° · Rain 20%
                </div>
              </div>
              <Cloud className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
            </div>

            {/* 5-day forecast */}
            <div className="grid grid-cols-5 gap-2 mt-5 pt-5 border-t border-slate-800/60">
              {[
                { day: "TODAY", temp: "67°", low: "52°" },
                { day: "TMRW", temp: "67°", low: "52°" },
                { day: "SUN", temp: "51°", low: "38°" },
                { day: "MON", temp: "40°", low: "26°" },
                { day: "TUE", temp: "62°", low: "29°" }
              ].map(({ day, temp, low }) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {day}
                  </span>
                  <Cloud className="w-5 h-5 text-slate-400 my-1" strokeWidth={1.5} />
                  <span className="text-[13px] font-bold text-emerald-400">{temp}</span>
                  <span className="text-[11px] text-slate-500">{low}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today in Jamestown */}
        <div className="px-6 pb-8">
          <div className="px-1 pb-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Today in Jamestown
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 hover:bg-slate-900/80 transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-400/10">
                  <Recycle className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Recycling
                </span>
              </div>
              <div className="text-[17px] font-bold leading-tight">Paper & Mail</div>
              <div className="text-[11px] text-slate-500 mt-1.5">Pickup this week</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Apr 13 – Apr 17</div>
            </button>

            <button className="text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 hover:bg-slate-900/80 transition">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-400/10">
                  <Car className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Parking
                </span>
              </div>
              <div className="text-[17px] font-bold leading-tight">Even Side</div>
              <div className="text-[11px] text-slate-500 mt-1.5">Park on even-numbered</div>
              <div className="text-[10px] text-slate-600 mt-0.5">Same all month</div>
            </button>
          </div>
        </div>

        {/* Top Story */}
        <div className="px-6 pb-6">
          <div className="px-1 pb-3 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Top Story
            </h3>
            <button className="flex items-center gap-0.5 text-[11px] text-slate-500 font-medium">
              All news <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>

          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden hover:bg-slate-900/80 transition">
            <div className="h-28 bg-gradient-to-br from-cyan-500/30 via-blue-600/20 to-slate-900 relative overflow-hidden">
              <GraduationCap
                className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.08]"
                strokeWidth={1}
              />
              <div className="absolute top-3 left-3">
                <span className="bg-black/50 backdrop-blur-md text-cyan-400 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-white/10">
                  City · 1h ago
                </span>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-[16px] leading-snug tracking-tight">
                Jamestown School Board Approves 2026-27 JPS Budget
              </h4>
              <div className="text-[11px] text-slate-500 mt-2">
                <span className="font-semibold text-slate-300">WRFA</span>
                <span className="mx-1.5">·</span>
                <span>Voters decide May 19</span>
              </div>
            </div>
          </button>
        </div>

        {/* This Weekend */}
        <div className="px-6 pb-8">
          <div className="px-1 pb-3 flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              This Weekend
            </h3>
            <button className="flex items-center gap-0.5 text-[11px] text-slate-500 font-medium">
              All events <ChevronRight className="w-3 h-3" strokeWidth={2.5} />
            </button>
          </div>

          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden hover:bg-slate-900/80 transition flex">
            <div className="w-1 bg-rose-400" />
            <div className="flex-1 p-4 flex items-center gap-4">
              <div className="flex-shrink-0 text-center w-14">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  Sat
                </div>
                <div className="text-2xl font-bold text-white tracking-tight leading-none mt-0.5">
                  18
                </div>
                <div className="text-[10px] text-slate-500 mt-1">7:00 PM</div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[15px] leading-snug tracking-tight">
                  Folsom Prison Experience
                </h4>
                <div className="text-[11px] text-slate-500 mt-1">Reg Lenna Center</div>
                <div className="mt-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400">
                    Music
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* From Jamestown */}
        <div className="px-6 pb-8">
          <div className="px-1 pb-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              From Jamestown
            </h3>
          </div>

          {/* CDIR live */}
          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 p-3 mb-2 hover:bg-slate-900/80 transition flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/30 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <Radio className="w-6 h-6 text-cyan-400" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                  CDIR
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-rose-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-[13px] font-semibold mt-0.5 truncate">
                The Road Home
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                The Deceivers · Now playing
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-slate-950 fill-slate-950 ml-0.5" strokeWidth={2.5} />
            </div>
          </button>

          {/* LOTD latest episode */}
          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 p-3 hover:bg-slate-900/80 transition flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-800">
              <span className="text-emerald-400 text-xl font-black tracking-tighter">L</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                  LOTD
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Ep. 575
                </span>
              </div>
              <div className="text-[13px] font-semibold mt-0.5 truncate">
                Coming Early Q3
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">55:25 · Latest episode</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 ml-0.5" strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Did You Know */}
        <div className="px-6 pb-6">
          <div className="px-1 pb-3">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Did You Know?
            </h3>
          </div>

          <button className="w-full text-left rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-slate-800/80 p-4 hover:from-slate-900/80 transition">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-400/10 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-amber-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed text-slate-200">
                  Charles Dahlstrom invented the world's first fireproof metal door in Jamestown in 1904 — later installed in the Empire State Building, Rockefeller Center, and the U.S. Capitol.
                </p>
                <div className="flex items-center gap-1 mt-3 text-[10px] text-slate-500">
                  <span className="font-medium">Jamestown History</span>
                  <span>·</span>
                  <span className="text-amber-400 font-semibold">Tap to read more</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 text-center">
          <p className="text-[10px] text-slate-600">Updated 9:16 PM</p>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#060e18]/95 backdrop-blur-xl border-t border-slate-800/80">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 pb-6">
          {[
            { icon: Home, label: "Home", active: true },
            { icon: Trophy, label: "Sports", active: false },
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
              <span className={`text-[10px] font-medium ${active ? "text-cyan-400" : "text-slate-500"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
