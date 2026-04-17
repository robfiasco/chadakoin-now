import {
  Home,
  Trophy,
  Newspaper,
  Calendar,
  Map,
  X,
  ChevronRight,
  MapPin,
  Bell,
  Radio,
  Mic,
  Sparkles,
  Building2,
  Check,
  Palette
} from "lucide-react";
import { useState } from "react";

export default function SettingsRedesign() {
  const [notifs, setNotifs] = useState({
    parking: true,
    recycling: true,
    news: false,
    events: true,
    lotd: true,
    cdir: false
  });

  const themes = [
    { name: "Lake Effect", color: "bg-cyan-400", active: true },
    { name: "Signal", color: "bg-blue-400" },
    { name: "Bluebird", color: "bg-sky-400" },
    { name: "Twilight", color: "bg-violet-400" },
    { name: "Grayscale", color: "bg-slate-400" },
    { name: "Harvest", color: "bg-amber-400" },
    { name: "Nightshift", color: "bg-emerald-400" },
    { name: "Coalfire", color: "bg-rose-400" }
  ];

  const toggle = (key) => setNotifs({ ...notifs, [key]: !notifs[key] });

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans pb-24">
      <div className="max-w-md mx-auto">
        <div className="h-12" />

        {/* Header */}
        <div className="px-6 pt-4 pb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">Settings</h1>
            <p className="text-cyan-400 text-[11px] uppercase tracking-[0.2em] mt-1.5 font-medium">
              Chadakoin Now
            </p>
          </div>
          <button className="p-2 rounded-full bg-slate-900/60 border border-slate-800">
            <X className="w-4 h-4 text-slate-400" strokeWidth={2} />
          </button>
        </div>

        {/* Your Zone */}
        <SectionLabel>Your Zone</SectionLabel>
        <div className="px-6 pb-6">
          <button className="w-full text-left rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 hover:bg-slate-900/80 transition flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
              <MapPin className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[15px] tracking-tight">Zone 3 · West Side</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Used for trash, parking, and water flushing alerts
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600" strokeWidth={2} />
          </button>
        </div>

        {/* Notifications */}
        <SectionLabel>Notifications</SectionLabel>
        <div className="px-6 pb-6">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <ToggleRow
              icon={Bell}
              iconColor="text-cyan-400 bg-cyan-400/10"
              label="Parking side changes"
              sub="Morning before alternate-side switches"
              enabled={notifs.parking}
              onToggle={() => toggle("parking")}
            />
            <ToggleRow
              icon={Bell}
              iconColor="text-emerald-400 bg-emerald-400/10"
              label="Recycling pickup"
              sub="Night before your pickup day"
              enabled={notifs.recycling}
              onToggle={() => toggle("recycling")}
            />
            <ToggleRow
              icon={Newspaper}
              iconColor="text-cyan-400 bg-cyan-400/10"
              label="Breaking local news"
              sub="Major stories only, no spam"
              enabled={notifs.news}
              onToggle={() => toggle("news")}
            />
            <ToggleRow
              icon={Calendar}
              iconColor="text-violet-400 bg-violet-400/10"
              label="Events this weekend"
              sub="Friday morning digest"
              enabled={notifs.events}
              onToggle={() => toggle("events")}
            />
            <ToggleRow
              icon={Mic}
              iconColor="text-emerald-400 bg-emerald-400/10"
              label="New LOTD episodes"
              sub="When a new episode drops"
              enabled={notifs.lotd}
              onToggle={() => toggle("lotd")}
            />
            <ToggleRow
              icon={Radio}
              iconColor="text-rose-400 bg-rose-400/10"
              label="CDIR live shows"
              sub="When a live show starts"
              enabled={notifs.cdir}
              onToggle={() => toggle("cdir")}
              last
            />
          </div>
        </div>

        {/* Appearance */}
        <SectionLabel>Appearance</SectionLabel>
        <div className="px-6 pb-6">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                <Palette className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-semibold text-[15px] tracking-tight">Theme</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Active: <span className="text-cyan-400 font-medium">Lake Effect</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.name}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition ${
                    t.active ? "bg-slate-800/80" : "hover:bg-slate-800/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full ${t.color} flex items-center justify-center relative`}
                  >
                    {t.active && (
                      <Check className="w-4 h-4 text-slate-950" strokeWidth={3} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-tight ${
                      t.active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* About */}
        <SectionLabel>About</SectionLabel>
        <div className="px-6 pb-6">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
            <NavRow label="What's new" sub="v1.2.0 · April 2026" />
            <NavRow label="Send feedback" sub="rob@chadakoindigital.com" />
            <NavRow label="Privacy policy" />
            <NavRow label="Terms of service" last />
          </div>
        </div>

        {/* Feature your business */}
        <div className="px-6 pt-2 pb-6">
          <a
            href="https://chadakoindigital.com/featured"
            className="block w-full text-left rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-slate-900/40 border border-cyan-400/20 hover:border-cyan-400/40 transition p-4 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex-shrink-0">
                <Building2 className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-cyan-400">
                    Featured Placement
                  </span>
                </div>
                <div className="font-semibold text-[15px] tracking-tight mt-0.5">
                  Feature your business
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  chadakoindigital.com/featured
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition" strokeWidth={2.5} />
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="px-6 pt-2 pb-8 text-center">
          <p className="text-[11px] text-slate-600">Chadakoin Now · v1.2.0</p>
          <p className="text-[10px] text-slate-700 mt-1">Built by Chadakoin Digital in Jamestown, NY</p>
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

function SectionLabel({ children }) {
  return (
    <div className="px-7 pb-3">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
        {children}
      </h3>
    </div>
  );
}

function ToggleRow({ icon: Icon, iconColor, label, sub, enabled, onToggle, last }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/60 transition ${
        !last ? "border-b border-slate-800/60" : ""
      }`}
    >
      <div className={`p-2 rounded-lg ${iconColor} border border-white/5 flex-shrink-0`}>
        <Icon className="w-4 h-4" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[14px] tracking-tight">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</div>
      </div>
      <div
        className={`w-11 h-6 rounded-full flex-shrink-0 transition relative ${
          enabled ? "bg-cyan-400" : "bg-slate-800"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </div>
    </button>
  );
}

function NavRow({ label, sub, last }) {
  return (
    <button
      className={`w-full text-left p-4 flex items-center gap-3 hover:bg-slate-900/60 transition ${
        !last ? "border-b border-slate-800/60" : ""
      }`}
    >
      <div className="flex-1">
        <div className="font-semibold text-[14px] tracking-tight">{label}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" strokeWidth={2} />
    </button>
  );
}
