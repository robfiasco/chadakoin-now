import {
  Home,
  Trophy,
  Newspaper,
  Calendar,
  Map,
  Search,
  List,
  MapPin,
  Star,
  ChevronDown,
  Navigation,
  Globe,
  Utensils,
  Building2,
  Sparkles,
  Trees,
  Leaf,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useState } from "react";

export default function VisitRedesign() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [view, setView] = useState("list");

  const filters = [
    { key: "All", icon: null },
    { key: "Eat", icon: Utensils, color: "amber" },
    { key: "Stay", icon: Building2, color: "blue" },
    { key: "Do", icon: Trees, color: "teal" },
    { key: "See", icon: Sparkles, color: "violet" },
    { key: "Shop", icon: Leaf, color: "emerald" }
  ];

  const editorsPicks = [
    {
      name: "Labyrinth Press Co.",
      category: "Eat",
      accent: "amber",
      hours: "Open · Closes 9PM",
      isOpen: true,
      gradient: "from-amber-500/30 via-orange-900/20 to-slate-950",
      icon: Utensils,
      quote:
        "Don't let the vegan menu scare you off — this is genuinely one of the best restaurants in Jamestown. The Brazil Lounge has a serious cocktail menu.",
      address: "12 E 4th St"
    },
    {
      name: "National Comedy Center",
      category: "See",
      accent: "violet",
      hours: "Open · Closes 5PM",
      isOpen: true,
      gradient: "from-violet-500/30 via-purple-900/20 to-slate-950",
      icon: Sparkles,
      quote:
        "I've been three times and would go back. Genuinely the best museum I've ever been to. If you visit Jamestown and skip it, you made a mistake.",
      address: "203 W 2nd St"
    }
  ];

  const places = {
    Eat: [
      { name: "Pace's Pizzeria", address: "549 W 3rd St", hours: "Open · Closes 9PM", isOpen: true, visited: true },
      { name: "Wicked Warren's", address: "119 W 3rd St", hours: "Open · Closes 10PM", isOpen: true, visited: true },
      { name: "Honest John's Pizzeria", address: "1245 E 2nd St", hours: "Open · Closes 10PM", isOpen: true, visited: true },
      { name: "Crown Street Roasting Co.", address: "16 W 3rd St", hours: "Closed · Opens 7AM", isOpen: false, visited: true },
      { name: "The Eatery", address: "180 Fluvanna Ave", hours: "Closed · Opens 7AM", isOpen: false, visited: false },
      { name: "Brazil Lounge", address: "10-12 E 4th St", hours: "Open · Closes 11PM", isOpen: true, visited: true }
    ],
    Stay: [
      { name: "Chautauqua Harbor Hotel", address: "Celoron · 5 min drive", hours: "Check-in 3PM", isOpen: true, visited: false },
      { name: "DoubleTree by Hilton", address: "Downtown Jamestown", hours: "Check-in 3PM", isOpen: true, visited: true },
      { name: "Holiday Inn Express", address: "Off I-86 · Free parking", hours: "Check-in 3PM", isOpen: true, visited: false }
    ],
    Do: [
      { name: "Roger Tory Peterson Institute", address: "311 Curtis St", hours: "Open · Closes 4PM", isOpen: true, visited: true },
      { name: "Robert H. Jackson Center", address: "305 E 4th St", hours: "Open · Closes 5PM", isOpen: true, visited: false },
      { name: "Fenton History Center", address: "67 Washington St", hours: "Open · Closes 4PM", isOpen: true, visited: true }
    ],
    Shop: [
      { name: "Lifted Dispensary", address: "Jamestown", hours: "Check website", isOpen: true, visited: false },
      { name: "Yeti Greenery", address: "607 W 3rd St", hours: "Open · Closes 9PM", isOpen: true, visited: true }
    ]
  };

  const accentMap = {
    amber: { text: "text-amber-400", bar: "bg-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
    blue: { text: "text-blue-400", bar: "bg-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
    teal: { text: "text-teal-400", bar: "bg-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/30" },
    violet: { text: "text-violet-400", bar: "bg-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
    emerald: { text: "text-emerald-400", bar: "bg-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" }
  };

  const categoryAccent = {
    Eat: "amber",
    Stay: "blue",
    Do: "teal",
    See: "violet",
    Shop: "emerald"
  };

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-4">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">
            Visit Jamestown
          </h1>
          <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] mt-1.5 font-medium">
            Jamestown, NY
          </p>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search places, addresses, or tags"
              className="w-full bg-slate-900/60 border border-slate-800 rounded-full pl-11 pr-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50 transition"
            />
          </div>
        </div>

        {/* Filters + view toggle */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {filters.map((f) => {
              const active = activeFilter === f.key;
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-900/60 text-slate-400 border border-slate-800"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  {f.key}
                </button>
              );
            })}
          </div>
        </div>

        {/* List / Map toggle */}
        <div className="px-6 pb-6">
          <div className="flex gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-full w-fit">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                view === "list" ? "bg-slate-800 text-white" : "text-slate-500"
              }`}
            >
              <List className="w-3.5 h-3.5" strokeWidth={2.5} /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                view === "map" ? "bg-slate-800 text-white" : "text-slate-500"
              }`}
            >
              <Map className="w-3.5 h-3.5" strokeWidth={2.5} /> Map
            </button>
          </div>
        </div>

        {/* Editor's Picks */}
        <div className="pb-8">
          <div className="px-6 pb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" strokeWidth={2.5} />
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Editor's Picks
            </h3>
          </div>

          <div className="px-6 space-y-3">
            {editorsPicks.map((pick) => {
              const accent = accentMap[pick.accent];
              const Icon = pick.icon;
              return (
                <button
                  key={pick.name}
                  className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden hover:bg-slate-900/80 transition shadow-lg shadow-black/30"
                >
                  {/* Visual */}
                  <div className={`h-36 bg-gradient-to-br ${pick.gradient} relative overflow-hidden`}>
                    <div
                      className="absolute inset-0 opacity-[0.08]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 30% 40%, white 1px, transparent 1px)",
                        backgroundSize: "24px 24px"
                      }}
                    />
                    <Icon
                      className="absolute -right-4 -bottom-4 w-40 h-40 text-white/[0.08]"
                      strokeWidth={1}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`flex items-center gap-1 ${accent.bg} backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${accent.border} ${accent.text}`}>
                        {pick.category}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md ${
                          pick.isOpen
                            ? "bg-emerald-400/10 border border-emerald-400/30 text-emerald-400"
                            : "bg-slate-800/60 border border-slate-700 text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pick.isOpen ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                        {pick.hours}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="text-[18px] font-bold leading-tight tracking-tight">
                      {pick.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      <span>{pick.address}</span>
                    </div>
                    <p className="text-[13px] text-slate-300 italic leading-relaxed mt-3 border-l-2 pl-3 border-slate-700">
                      "{pick.quote}"
                    </p>
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-cyan-400">
                        <Globe className="w-3.5 h-3.5" strokeWidth={2.5} /> Website
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-cyan-400">
                        <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} /> Directions
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse all — grouped by category */}
        {Object.entries(places).map(([category, list]) => {
          const accent = accentMap[categoryAccent[category]];
          return (
            <div key={category} className="pb-6">
              <div className="px-6 pb-3 flex items-center gap-3 sticky top-0 bg-[#060e18]/95 backdrop-blur-sm py-2 z-10">
                <div className={`w-1 h-4 rounded-full ${accent.bar}`} />
                <h3 className={`text-[11px] uppercase tracking-[0.2em] font-bold ${accent.text}`}>
                  {category}
                </h3>
                <span className="text-[10px] text-slate-600 font-medium">
                  {list.length} places
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
              </div>

              <div className="px-6 space-y-2">
                {list.map((place) => (
                  <button
                    key={place.name}
                    className="w-full text-left rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 transition overflow-hidden flex"
                  >
                    <div className={`w-1 ${accent.bar}`} />
                    <div className="flex-1 p-3.5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[15px] leading-snug tracking-tight truncate">
                            {place.name}
                          </h4>
                          {place.visited && (
                            <span className="flex items-center gap-1 flex-shrink-0 text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 rounded-full px-1.5 py-0.5">
                              <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Been there</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 flex-shrink-0" strokeWidth={2} />
                          <span className="truncate">{place.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              place.isOpen ? "bg-emerald-400" : "bg-slate-600"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider ${
                              place.isOpen ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            {place.hours}
                          </span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0" strokeWidth={2} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Feature your business — monetization CTA */}
        <div className="px-6 pt-4 pb-6">
          <a
            href="https://chadakoindigital.com/featured"
            className="block w-full text-left rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-slate-900/40 border border-cyan-400/20 hover:border-cyan-400/40 transition p-5 group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">
                    Featured Placement
                  </span>
                </div>
                <h4 className="text-[16px] font-bold mt-1 tracking-tight">
                  Feature your business on Chadakoin Now
                </h4>
                <p className="text-[12px] text-slate-400 mt-1.5 leading-relaxed">
                  Hero-card treatment — a short endorsement from Rob and top placement. Seen by every visitor and local who opens the app.
                </p>
                <div className="flex items-center gap-1 mt-3 text-[12px] font-bold text-cyan-400 group-hover:gap-2 transition-all">
                  Learn more at chadakoindigital.com
                  <span>→</span>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#060e18]/95 backdrop-blur-xl border-t border-slate-800/80">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 pb-6">
          {[
            { icon: Home, label: "Home", active: false },
            { icon: Trophy, label: "Sports", active: false },
            { icon: Newspaper, label: "News", active: false },
            { icon: Calendar, label: "Events", active: false },
            { icon: Map, label: "Visit", active: true }
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
