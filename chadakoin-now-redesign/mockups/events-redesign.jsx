import { Home, Trophy, Newspaper, Calendar, Map, Music, Film, Sprout, Palette, Sparkles, MapPin } from "lucide-react";
import { useState } from "react";

export default function EventsRedesign() {
  const [activeFilter, setActiveFilter] = useState("This Weekend");
  const filters = ["This Weekend", "This Week", "Apr", "May", "Jun", "Jul"];

  const featured = {
    title: "Folsom Prison Experience",
    subtitle: "A Johnny Cash tribute — Live on Stage",
    venue: "Reg Lenna Center",
    dateLabel: "Sat, Apr 18",
    time: "7:00 PM",
    category: "Music",
    icon: Music,
    gradient: "from-rose-500/30 via-red-900/20 to-slate-950",
    accent: "text-rose-400",
    dot: "bg-rose-400"
  };

  const days = [
    {
      day: "WED",
      date: "22",
      fullHeader: "WED · APR 22",
      events: [
        {
          time: "6:00 PM",
          title: "The Amazing Bubble Factory Live",
          venue: "Reg Lenna Center",
          category: "Family",
          accent: "text-emerald-400",
          bar: "bg-emerald-400"
        }
      ]
    },
    {
      day: "FRI",
      date: "24",
      fullHeader: "FRI · APR 24",
      events: [
        {
          time: "7:00 PM",
          title: "50th Annual Banff Centre Mountain Film Festival",
          venue: "Reg Lenna Center",
          category: "Film",
          accent: "text-amber-400",
          bar: "bg-amber-400"
        }
      ]
    },
    {
      day: "SAT",
      date: "25",
      fullHeader: "SAT · APR 25",
      events: [
        {
          time: "9:00 AM",
          title: "Jamestown Farmers Market",
          venue: "410 N Main St, Jamestown",
          category: "Community",
          accent: "text-emerald-400",
          bar: "bg-emerald-400"
        },
        {
          time: "2:00 PM",
          title: "Jennifer Anderson Gallery Talk & Drypoint Demo",
          venue: "The Lodge at RTPI",
          category: "Arts",
          accent: "text-violet-400",
          bar: "bg-violet-400"
        }
      ]
    },
    {
      day: "THU",
      date: "30",
      fullHeader: "THU · APR 30",
      events: [
        {
          time: "7:30 PM",
          title: "Spring Jazz Series: Chautauqua Brass Ensemble",
          venue: "Robert H. Jackson Center",
          category: "Music",
          accent: "text-rose-400",
          bar: "bg-rose-400"
        }
      ]
    }
  ];

  const FeaturedIcon = featured.icon;

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        {/* Status bar spacing */}
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-5">
          <h1 className="text-[34px] font-bold leading-tight tracking-tight">Events</h1>
          <p className="text-cyan-400 text-xs uppercase tracking-[0.2em] mt-1.5 font-medium">
            Upcoming in Jamestown
          </p>
        </div>

        {/* Filter chips */}
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

        {/* Featured event */}
        <div className="px-6 pb-8">
          <div className="px-1 pb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2.5} />
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Featured This Weekend
            </h3>
          </div>

          <button className="w-full text-left group">
            <div className="rounded-2xl overflow-hidden bg-slate-900/40 border border-slate-800/80 shadow-xl shadow-black/30">
              {/* Visual area */}
              <div className={`h-44 bg-gradient-to-br ${featured.gradient} relative overflow-hidden`}>
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)",
                    backgroundSize: "40px 40px, 60px 60px"
                  }}
                />
                <FeaturedIcon
                  className="absolute -right-6 -bottom-6 w-48 h-48 text-white/[0.08]"
                  strokeWidth={1}
                />

                {/* Date pill top-left */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10">
                    {featured.dateLabel}
                  </span>
                  <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10">
                    {featured.time}
                  </span>
                </div>

                {/* Category bottom-left */}
                <div className="absolute bottom-4 left-4">
                  <span className={`flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border border-white/10 ${featured.accent}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${featured.dot}`} />
                    {featured.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h2 className="text-[20px] font-bold leading-[1.2] tracking-tight">
                  {featured.title}
                </h2>
                <p className="text-slate-400 text-[13px] mt-1.5 leading-relaxed">
                  {featured.subtitle}
                </p>
                <div className="flex items-center gap-1.5 mt-4 text-[12px] text-slate-400">
                  <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{featured.venue}</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Day-grouped events */}
        {days.map((day) => (
          <div key={day.fullHeader} className="pb-6">
            {/* Day header */}
            <div className="px-6 pb-3 flex items-center gap-3 sticky top-0 bg-[#060e18]/95 backdrop-blur-sm py-2 z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
                  {day.day}
                </span>
                <span className="text-lg font-bold text-white tracking-tight">
                  Apr {day.date}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
            </div>

            {/* Events for this day */}
            <div className="px-6 space-y-2">
              {day.events.map((event, i) => (
                <button
                  key={i}
                  className="w-full text-left rounded-xl bg-slate-900/40 border border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700 transition active:scale-[0.99] overflow-hidden flex"
                >
                  {/* Colored accent bar */}
                  <div className={`w-1 ${event.bar}`} />

                  <div className="flex-1 p-4 flex gap-4">
                    {/* Time */}
                    <div className="flex-shrink-0 w-16">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        {event.time.split(" ")[1]}
                      </div>
                      <div className="text-base font-bold text-white tracking-tight leading-tight">
                        {event.time.split(" ")[0]}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] leading-snug tracking-tight line-clamp-2">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3" strokeWidth={2} />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${event.accent}`}>
                          {event.category}
                        </span>
                      </div>
                    </div>
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
            { icon: Newspaper, label: "News", active: false },
            { icon: Calendar, label: "Events", active: true },
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
