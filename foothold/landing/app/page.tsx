import { WaitlistForm } from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sand">
      {/* Nav */}
      <header className="container-tight flex items-center justify-between pt-8">
        <a href="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-clay">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-clay" />
          Foothold
        </a>
        <a href="#waitlist" className="btn-ghost text-sm">Join waitlist</a>
      </header>

      {/* Hero */}
      <section className="container-tight pt-16 pb-20 sm:pt-24 sm:pb-28">
        <span className="pill">Now in private beta</span>
        <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Lasting ground for your <span className="text-clay">GLP-1 journey.</span>
        </h1>
        <p className="mt-6 max-w-prose text-lg text-stone sm:text-xl">
          The companion built for every dose — and the days you're off it. Doctor-ready reports,
          live pharmacy shortage tracking, and the off-ramp nobody else covers.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div id="waitlist" className="rounded-3xl border border-clay/15 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl text-ink">Get early access</h2>
            <p className="mt-1 text-sm text-stone">
              We'll send first-1,000 invites to the people we can help most.
            </p>
            <div className="mt-6">
              <WaitlistForm />
            </div>
          </div>

          <ul className="space-y-3 text-stone">
            {[
              "Track every dose with side-effect, weight, and protein context",
              "Body-map injection rotation",
              "Dose-cycle awareness — know when food noise comes back",
              "Doctor-ready PDF export for every appointment",
              "Shortage map — find pharmacies with stock near you",
              "Stay supported through tapering and maintenance",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-y border-clay/10 bg-moss/50 py-20">
        <div className="container-tight">
          <span className="pill">What competitors miss</span>
          <h2 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
            Other apps log your shot. Foothold helps you keep what you've earned.
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Pillar
              n="01"
              title="Doctor-Ready Reports"
              body="One tap exports a clinical-grade PDF — dose history, side effects, weight, vitals, protein adherence — formatted the way your endocrinologist actually wants it. Walk into your 15-minute appointment prepared."
            />
            <Pillar
              n="02"
              title="Shortage & Pharmacy Tracker"
              body="GLP-1 supply is unpredictable. See real-time inventory crowdsourced from other users near you. Stop driving 90 minutes to find an empty shelf."
            />
            <Pillar
              n="03"
              title="The Off-Ramp"
              body="65% of users regain weight within a year of stopping. Every other app abandons you the moment you stop. We stay — through tapering, maintenance, and life after the drug."
            />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-tight py-20 text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          Built for the long arc, not just the loss.
        </h2>
        <p className="mx-auto mt-4 max-w-prose text-lg text-stone">
          Join the waitlist. We'll send your invite as we open seats.
        </p>
        <div className="mt-8">
          <a href="#waitlist" className="btn-primary">Get early access</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-clay/10 py-10">
        <div className="container-tight flex flex-col items-center justify-between gap-4 text-sm text-stone sm:flex-row">
          <p>© {new Date().getFullYear()} Foothold. Built for the journey.</p>
          <p className="text-xs">
            Not medical advice. Not affiliated with Novo Nordisk, Eli Lilly, or any pharmaceutical manufacturer.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay/10">
      <span className="font-display text-sm font-semibold text-amber">{n}</span>
      <h3 className="mt-2 font-display text-xl text-ink">{title}</h3>
      <p className="mt-3 text-stone">{body}</p>
    </div>
  );
}
