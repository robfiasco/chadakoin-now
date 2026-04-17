import {
  Home,
  Trophy,
  Newspaper,
  Calendar,
  Map,
  ArrowLeft,
  Leaf,
  Droplets,
  Trash2,
  Cross,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Clock,
  Snowflake
} from "lucide-react";
import { useState } from "react";

export default function CityServicesRedesign() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [expanded, setExpanded] = useState("yardWaste");

  const filters = ["All", "Active Now", "Coming Up", "Year Round"];

  const services = [
    {
      id: "yardWaste",
      name: "Yard Waste Site",
      sub: "1001 Monroe St · Sat from Apr 11 · Wed from May 13",
      icon: Leaf,
      accent: "emerald",
      status: "Active Now",
      statusLabel: "Open Now",
      details: [
        { label: "Location", value: "1001 Monroe St" },
        { label: "Saturdays", value: "Open now · 7am – 1pm" },
        { label: "Wednesdays", value: "Starting May 13 · 7am – 1pm" },
        { label: "2026 Sticker", value: "$20 · BPU Customer Service office" },
        { label: "Accepts", value: "Leaves, grass, brush, twigs, branches up to 8\" diameter" },
        { label: "Note", value: "Residential BPU customers only. Sticker must be on rear driver-side window." }
      ],
      callout: "Yard waste bags with curbside pickup are $15 per 4 bags — no sticker needed."
    },
    {
      id: "waterFlushing",
      name: "Water Main Flushing",
      sub: "Twice yearly · Spring & Fall · Check your zone",
      icon: Droplets,
      accent: "cyan",
      status: "Coming Up",
      statusLabel: "Spring 2026",
      details: [
        { label: "Schedule", value: "Late April through mid-May" },
        { label: "Your zone", value: "Zone 3 · Flushing week of May 5" },
        { label: "What to expect", value: "Discolored water for a few hours. Run cold tap until clear." },
        { label: "Note", value: "Avoid laundry during your zone's flush day to prevent staining." }
      ]
    },
    {
      id: "bulkTrash",
      name: "Bulk Trash & Electronics",
      sub: "Amnesty Day · City residents only · Free drop-off",
      icon: Trash2,
      accent: "amber",
      status: "Coming Up",
      statusLabel: "Date TBD",
      details: [
        { label: "When", value: "Typically late May or early June — city announces 2-3 weeks out" },
        { label: "Where", value: "BPU yard, 92 Steele St" },
        { label: "Accepts", value: "Furniture, appliances, TVs, electronics, mattresses" },
        { label: "Doesn't accept", value: "Hazardous waste, tires, construction debris" },
        { label: "ID required", value: "Jamestown city residents only · Bring ID" }
      ]
    },
    {
      id: "leafCollection",
      name: "Leaf Collection",
      sub: "Curbside pickup · October – November · Two phases",
      icon: Leaf,
      accent: "amber",
      status: "Coming Up",
      statusLabel: "Fall 2026",
      details: [
        { label: "Phase 1", value: "Mid-October · East side of Jamestown" },
        { label: "Phase 2", value: "Mid-November · West side" },
        { label: "How", value: "Rake to curb, not into street. No bags needed." },
        { label: "Note", value: "Dates announced in September via city news." }
      ]
    },
    {
      id: "sharps",
      name: "Sharps / Syringe Disposal",
      sub: "UPMC Chautauqua · Emergency entrance · 24/7",
      icon: Cross,
      accent: "rose",
      status: "Year Round",
      statusLabel: "Year Round",
      details: [
        { label: "Where", value: "UPMC Chautauqua Emergency Department entrance" },
        { label: "Hours", value: "24 hours · 7 days" },
        { label: "Container", value: "Drop box outside main entrance — no check-in required" },
        { label: "Accepts", value: "Sealed sharps containers, rigid plastic bottles with sharps" },
        { label: "Note", value: "Free, anonymous. Do not use glass or soft containers." }
      ]
    },
    {
      id: "snowRemoval",
      name: "Snow & Ice Removal",
      sub: "City priority routes · Call 911 for emergencies",
      icon: Snowflake,
      accent: "cyan",
      status: "Year Round",
      statusLabel: "Year Round",
      details: [
        { label: "Priority routes", value: "Main St, 2nd St, 3rd St, E/W Fairmount, Washington" },
        { label: "Residential", value: "Plowed after priority routes cleared" },
        { label: "Sidewalk clearing", value: "Property owners responsible within 24 hours of snowfall" },
        { label: "Report an issue", value: "Jamestown DPW · (716) 483-7500" }
      ]
    }
  ];

  const accentMap = {
    emerald: { bar: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
    cyan: { bar: "bg-cyan-400", text: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
    amber: { bar: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/30" },
    rose: { bar: "bg-rose-400", text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30" }
  };

  const statusMap = {
    "Active Now": { color: "emerald", pulse: true },
    "Coming Up": { color: "amber", pulse: false },
    "Year Round": { color: "cyan", pulse: false }
  };

  const filtered = services.filter((s) => activeFilter === "All" || s.status === activeFilter);

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5 flex items-start gap-3">
          <button className="p-2 rounded-full bg-slate-900/60 border border-slate-800 mt-1">
            <ArrowLeft className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </button>
          <div>
            <h1 className="text-[30px] font-bold leading-tight tracking-tight">City Services</h1>
            <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] mt-1.5 font-medium">
              BPU & DPW · Jamestown, NY
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
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

        {/* Service cards */}
        <div className="px-6 space-y-2">
          {filtered.map((service) => {
            const accent = accentMap[service.accent];
            const status = statusMap[service.status];
            const statusAccent = accentMap[status.color];
            const Icon = service.icon;
            const isOpen = expanded === service.id;

            return (
              <div
                key={service.id}
                className="rounded-xl bg-slate-900/40 border border-slate-800/60 overflow-hidden flex"
              >
                <div className={`w-1 ${accent.bar}`} />
                <div className="flex-1">
                  <button
                    onClick={() => setExpanded(isOpen ? null : service.id)}
                    className="w-full text-left p-4 hover:bg-slate-900/60 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${accent.bg} border ${accent.border} flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${accent.text}`} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[16px] leading-tight tracking-tight">
                          {service.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {service.sub}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span
                            className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusAccent.bg} ${statusAccent.text} border ${statusAccent.border}`}
                          >
                            {status.pulse && (
                              <span className={`w-1.5 h-1.5 rounded-full ${statusAccent.bar} animate-pulse`} />
                            )}
                            {service.statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/60">
                      <div className="space-y-3 pt-4">
                        {service.details.map((d) => (
                          <div key={d.label} className="grid grid-cols-[100px_1fr] gap-3">
                            <div className={`text-[11px] font-bold uppercase tracking-wider ${accent.text}`}>
                              {d.label}
                            </div>
                            <div className="text-[13px] text-slate-200 leading-relaxed">
                              {d.value}
                            </div>
                          </div>
                        ))}
                      </div>
                      {service.callout && (
                        <div className={`mt-4 rounded-lg ${accent.bg} border ${accent.border} p-3 flex items-start gap-2`}>
                          <Info className={`w-4 h-4 ${accent.text} flex-shrink-0 mt-0.5`} strokeWidth={2.5} />
                          <p className="text-[12px] text-slate-200 leading-relaxed">
                            {service.callout}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last updated */}
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[11px] text-slate-600">
            Pulled from jamestownny.gov & jamestownbpu.com
          </p>
          <p className="text-[10px] text-slate-700 mt-1">Last refreshed Apr 16, 9:16 PM</p>
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
