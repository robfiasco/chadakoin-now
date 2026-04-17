import { Home, Trophy, Newspaper, Calendar, Map, Radio, Building2, Landmark, GraduationCap } from "lucide-react";
import { useState } from "react";

export default function NewsRedesign() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "WRFA", "City", "State", "JCC"];

  const hero = {
    title: "Jamestown School Board Approves 2026-27 JPS Budget",
    summary: "$120.8M district budget now heads to voters on May 19. Board approved unanimously after public comment period.",
    source: "WRFA",
    time: "1h ago",
    category: "City",
    icon: GraduationCap,
    gradient: "from-cyan-500/30 via-blue-600/20 to-slate-900",
    accent: "bg-cyan-500"
  };

  const sections = [
    {
      label: "Just In",
      items: [
        {
          title: "WRFA Rock and Roll Rundown – April 16, 2026",
          source: "WRFA",
          time: "2h ago",
          category: "Music",
          accent: "text-rose-400"
        },
        {
          title: "Deer Over Population Concerns Raised With Jamestown City Council Again",
          source: "WRFA",
          time: "4h ago",
          category: "City",
          accent: "text-cyan-400"
        }
      ]
    },
    {
      label: "Earlier Today",
      items: [
        {
          title: "Historic Cross Returned To St. Lukes Episcopal Church",
          source: "WRFA",
          time: "9h ago",
          category: "Community",
          accent: "text-emerald-400"
        },
        {
          title: "Borrello, Molitor Raising Concerns With Public Service Commission About NYS Climate Act",
          source: "WRFA",
          time: "11h ago",
          category: "State",
          accent: "text-amber-400"
        }
      ]
    },
    {
      label: "This Week",
      items: [
        {
          title: "JCC Announces New Workforce Development Partnership with Chautauqua County",
          source: "WRFA",
          time: "2d ago",
          category: "JCC",
          accent: "text-violet-400"
        },
        {
          title: "Northwest Arena Hosts Record-Breaking Youth Hockey Tournament",
          source: "Post-Journal",
          time: "3d ago",
          category: "Community",
          accent: "text-emerald-400"
        },
        {
          title: "Reg Lenna Announces Summer 2026 Concert Series Lineup",
          source: "WRFA",
          time: "4d ago",
          category: "Music",
          accent: "text-rose-400"
        }
      ]
    }
  ];

  const HeroIcon = hero.icon;

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        {/* Status bar spacing */}
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5">
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">Local News</h1>
          <p className="text-cyan-400 text-xs uppercase tracking-[0.2em] mt-1.5 font-medium">Jamestown, NY</p>
        </div>

        {/* Filter chips */}
        <div className="px-6 pb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  activeFilter === f
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Hero card */}
        <div className="px-6 pb-8">
          <button className="w-full text-left group">
            <div className="rounded-2xl overflow-hidden bg-slate-900/40 border border-slate-800/80 shadow-xl shadow-black/30">
              {/* Visual area */}
              <div className={`h-40 bg-gradient-to-br ${hero.gradient} relative overflow-hidden`}>
                {/* Subtle pattern */}
                <div className="absolute inset-0 opacity-10"
                     style={{
                       backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
                       backgroundSize: "40px 40px, 60px 60px"
                     }}
                />
                <HeroIcon className="absolute -right-4 -bottom-4 w-44 h-44 text-white/10" strokeWidth={1} />

                {/* Top badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Top Story
                  </span>
                </div>

                {/* Bottom category */}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10">
                    {hero.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="text-[19px] font-bold leading-[1.25] tracking-tight">
                  {hero.title}
                </h2>
                <p className="text-slate-400 text-[13px] mt-2 leading-relaxed line-clamp-2">
                  {hero.summary}
                </p>
                <div className="flex items-center gap-1.5 mt-4 text-[11px]">
                  <span className="font-semibold text-slate-200">{hero.source}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500">{hero.time}</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.label} className="pb-6">
            <div className="px-6 pb-3 flex items-center gap-3">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
                {section.label}
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            <div className="px-6 space-y-2">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  className="w-full text-left p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 transition active:scale-[0.99]"
                >
                  <h4 className="font-semibold text-[15px] leading-snug tracking-tight line-clamp-2">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[11px]">
                    <span className="font-semibold text-slate-300">{item.source}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{item.time}</span>
                    <span className="text-slate-600">·</span>
                    <span className={`font-medium ${item.accent}`}>{item.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#060e18]/95 backdrop-blur-xl border-t border-slate-800/80">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 pb-6">
          {[
            { icon: Home, label: "Home", active: false },
            { icon: Trophy, label: "Sports", active: false },
            { icon: Newspaper, label: "News", active: true },
            { icon: Calendar, label: "Events", active: false },
            { icon: Map, label: "Visit", active: false }
          ].map(({ icon: Icon, label, active }) => (
            <button key={label} className="flex flex-col items-center gap-1 px-3">
              <div className={active ? "p-1.5 rounded-lg bg-cyan-400/10" : ""}>
                <Icon className={`w-5 h-5 ${active ? "text-cyan-400" : "text-slate-500"}`} strokeWidth={active ? 2.5 : 2} />
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
