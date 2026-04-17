import {
  Sparkles,
  Check,
  MapPin,
  Newspaper,
  MessageSquare,
  TrendingUp,
  Shield,
  ArrowRight,
  Mail,
  Utensils,
  Navigation,
  Globe,
  ChevronDown
} from "lucide-react";
import { useState } from "react";

export default function FeaturedLanding() {
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: "How do you choose who gets featured?",
      a: "I apply two filters. First, I've been there — if I haven't eaten the food, walked the floor, or sat at the bar, you're not getting featured. Second, I have to actually vouch for it. If I'd send my mom there, we can talk. If I wouldn't, no amount of money changes that."
    },
    {
      q: "What's the difference between Editor's Pick and Featured?",
      a: "Editor's Pick is my personal list. It's free, it's editorial, and it's not for sale. Ever. Featured is a paid placement on the same Visit page — clearly marked as Featured so users know the difference. I only accept Featured applications from businesses that would qualify as Editor's Picks anyway. Different tier, same standard."
    },
    {
      q: "How long is the commitment?",
      a: "Month-to-month. Cancel anytime. Most partners run for 3–6 months and renew once they see the traffic pattern."
    },
    {
      q: "What do I need to provide?",
      a: "Almost nothing. I'll write a few sentences in my voice and build the listing. If you've got a photo you love, send it over. If not, your card uses the app's native design — clean, on-brand, no effort required from you. I'll send a draft before it goes live."
    },
    {
      q: "Can I see stats?",
      a: "Yes. Monthly report with impressions, taps, and directions requests. If the numbers don't make sense for you, don't renew. I'd rather lose a month than keep a partner who isn't getting value."
    },
    {
      q: "What if I'm not a restaurant?",
      a: "Featured placement works for any category in the Visit section — Eat, Stay, Do, See, or Shop. Retail, services, hotels, museums, dispensaries, all fit."
    }
  ];

  return (
    <div className="min-h-screen bg-[#060e18] text-white font-sans antialiased">
      {/* Nav */}
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <span className="text-cyan-400 font-black text-sm">C</span>
          </div>
          <span className="font-bold tracking-tight">Chadakoin Now</span>
        </div>
        <a
          href="#apply"
          className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition"
        >
          Apply →
        </a>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" strokeWidth={2.5} />
              <span className="text-cyan-400 text-[11px] font-bold uppercase tracking-[0.2em]">
                Featured Placement
              </span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold leading-[1.05] tracking-tight">
              Reach every<br />Jamestown visitor.<br />
              <span className="text-cyan-400">And every local.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mt-6 max-w-lg">
              Chadakoin Now is Jamestown's local-first app for news, events, and where to go. Featured partners get the hero treatment — top placement, a short endorsement from me, right where people look.
            </p>
            <div className="flex items-center gap-4 mt-8">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-cyan-400 text-slate-950 font-bold text-sm hover:bg-cyan-300 transition"
              >
                Apply to be featured
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
              <a href="#how" className="text-sm font-semibold text-slate-400 hover:text-white transition">
                How it works
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                Month-to-month
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                5 slots max
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                Intro rate available
              </div>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/20 via-transparent to-amber-500/20 blur-2xl opacity-50" />
            <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden shadow-2xl shadow-black/60">
              <div className="h-40 bg-gradient-to-br from-amber-500/30 via-orange-900/20 to-slate-950 relative overflow-hidden">
                <Utensils
                  className="absolute -right-4 -bottom-4 w-40 h-40 text-white/[0.08]"
                  strokeWidth={1}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 bg-amber-400/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-amber-400/30 text-amber-400">
                    Eat
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Open · Closes 9PM
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="flex items-center gap-1 bg-cyan-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                    <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                    Featured
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="text-[18px] font-bold leading-tight tracking-tight">
                  Your Business Here
                </h4>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3" strokeWidth={2} />
                  <span>Your address, Jamestown</span>
                </div>
                <p className="text-[13px] text-slate-300 italic leading-relaxed mt-3 border-l-2 pl-3 border-slate-700">
                  "A few honest sentences from me on why this place is worth your time. The kind of thing locals trust."
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
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
            Three steps, two weeks, zero hassle.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: "01",
              title: "Apply",
              desc: "Fill out the form below. Takes three minutes. Tell me about your place and I'll take it from there."
            },
            {
              n: "02",
              title: "Visit",
              desc: "I visit in person if I haven't already. No photos, no tour, no sales pitch — just a real visit as a customer."
            },
            {
              n: "03",
              title: "Launch",
              desc: "I write a short note and build the listing. You send over your best photo (optional) and approve the draft. We go live within two weeks."
            }
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6"
            >
              <div className="text-cyan-400 font-black text-2xl tracking-tight">{step.n}</div>
              <h3 className="text-xl font-bold mt-2 tracking-tight">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            What's included
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
            Everything. Nothing à la carte.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              icon: MessageSquare,
              title: "Editor's note in my voice",
              desc: "A few honest sentences on why locals and visitors should go. Short, direct, and signed by me. Draft approval before it goes live."
            },
            {
              icon: Sparkles,
              title: "Featured badge + top placement",
              desc: "Hero card at the top of the Visit page. Clearly marked Featured so users know — and trust — the distinction."
            },
            {
              icon: Newspaper,
              title: "Priority coverage across the app",
              desc: "Hosting an event? New menu? Anniversary? Featured partners get priority placement in News and Events when it matters."
            },
            {
              icon: TrendingUp,
              title: "Monthly performance stats",
              desc: "Impressions, taps, directions requests. Real numbers so you can decide if it's worth renewing."
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl bg-slate-900/40 border border-slate-800 p-5 flex gap-4"
              >
                <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20 h-fit flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Integrity */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 mb-6">
            <Shield className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.2em]">
              The honest part
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            Why Featured works on Chadakoin Now and fails everywhere else.
          </h2>
          <div className="space-y-5 mt-8 text-slate-300 leading-relaxed">
            <p>
              Most directory apps will feature anyone with a credit card. The result: users stop trusting what's featured, the feature becomes worthless, advertisers churn, and the app is stuck racing to the bottom on price.
            </p>
            <p>
              Chadakoin Now runs on different rules. <span className="text-white font-semibold">Editor's Picks are editorial</span> — my personal list of places I vouch for, free, never for sale. <span className="text-white font-semibold">Featured is paid</span>, clearly marked, and capped at five slots. I only accept applications from businesses that would qualify as Editor's Picks anyway — same standard, different tier.
            </p>
            <p>
              One important thing: <span className="text-white font-semibold">right now, zero paid Featured partners exist.</span> Every hero card in the app today is an Editor's Pick — editorial, unpaid, chosen because I've been there and I vouch for it. Featured is a new tier I'm opening up, and when it rolls out, every Featured placement will be clearly labeled as such. No one gets the Featured badge retroactively. You'd be among the first five.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="mb-12 text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
            One tier. Simple math.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* Listed */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-7">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">
              Listed
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">Free</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              Name, address, category, hours. Every Jamestown business is eligible.
            </p>
            <div className="h-px bg-slate-800 my-5" />
            <ul className="space-y-2.5 text-sm">
              {["Directory listing", "Category placement", "Hours & contact info", "Basic map pin"].map((i) => (
                <li key={i} className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Featured */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-900/40 to-slate-900/40 border border-cyan-400/30 p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
              Launch offer
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
              Featured
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">$199</span>
              <span className="text-slate-400 text-sm">/month</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">
              <span className="text-cyan-400 font-semibold">Intro rate: $99/mo</span> for the first 5 partners. Locked in as long as you stay subscribed.
            </p>
            <div className="h-px bg-slate-800 my-5" />
            <ul className="space-y-2.5 text-sm">
              {[
                "Everything in Listed",
                "Hero card placement",
                "Editor's note in Rob's voice",
                "Priority coverage in News & Events",
                "Monthly stats report",
                "Month-to-month, cancel anytime"
              ].map((i) => (
                <li key={i} className="flex items-center gap-2 text-white">
                  <Check className="w-4 h-4 text-cyan-400" strokeWidth={2.5} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            Questions
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
            Asked and answered.
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              className="w-full text-left rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition overflow-hidden"
            >
              <div className="p-5 flex items-center justify-between gap-4">
                <h3 className="font-semibold tracking-tight">{faq.q}</h3>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.5}
                />
              </div>
              {openFaq === i && (
                <div className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-4">
                  {faq.a}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="max-w-3xl mx-auto px-6 py-20 border-t border-slate-800/60">
        <div className="mb-10">
          <span className="text-[11px] uppercase tracking-[0.2em] text-cyan-400 font-bold">
            Apply
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight">
            Let's talk.
          </h2>
          <p className="text-slate-400 mt-3 leading-relaxed">
            Three minutes. I'll get back to you within two business days.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                Business name
              </label>
              <input
                type="text"
                placeholder="Wicked Warren's"
                className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                Your name
              </label>
              <input
                type="text"
                placeholder="First last"
                className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                Email
              </label>
              <input
                type="email"
                placeholder="you@yourbusiness.com"
                className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
                Phone (optional)
              </label>
              <input
                type="tel"
                placeholder="(716) ..."
                className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
              Category
            </label>
            <select className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 transition appearance-none">
              <option>Eat — Restaurant, café, bar</option>
              <option>Stay — Hotel, B&B, short-term rental</option>
              <option>Do — Activity, park, fitness</option>
              <option>See — Museum, gallery, landmark</option>
              <option>Shop — Retail, dispensary, services</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
              Tell me about your place
            </label>
            <textarea
              rows={4}
              placeholder="What makes it worth visiting? What should I try? What should I avoid telling my readers?"
              className="w-full mt-2 bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-3 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 transition resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-bold">
              Have I been there yet?
            </label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {["Yes, I think so", "No, not yet", "Not sure"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="px-4 py-3 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-slate-400 hover:border-cyan-400/50 hover:text-white transition"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 px-6 py-4 rounded-lg bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition flex items-center justify-center gap-2"
          >
            Submit application
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            You'll hear back from Rob within two business days.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <span className="text-cyan-400 font-black text-xs">C</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Chadakoin Now</span>
            <span className="text-xs text-slate-600">· Jamestown, NY</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="mailto:rob@chadakoindigital.com" className="flex items-center gap-1 hover:text-white transition">
              <Mail className="w-3 h-3" strokeWidth={2} />
              rob@chadakoindigital.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
