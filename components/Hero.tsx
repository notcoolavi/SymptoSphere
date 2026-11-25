"use client";

const steps = [
  { n: "1", title: "Describe how you feel", text: "Type it in your own words, like \"headache and a sore throat since yesterday\". No medical words needed." },
  { n: "2", title: "Review your possibilities", text: "See the most likely conditions, how sure the app is, and what to check next. Tick any other symptoms that apply." },
  { n: "3", title: "Get next steps", text: "Simple home care tips, warning signs that need urgent help, and hospitals or clinics near you with phone numbers." },
];

export default function Hero() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 20px 24px" }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-teal)", marginBottom: 14 }}>
        SYMPTOM CHECKER · FREE · PRIVATE BY DEFAULT
      </p>
      <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", lineHeight: 1.1, fontWeight: 800, maxWidth: 760 }}>
        Understand your symptoms, <span style={{ color: "var(--accent-teal)" }}>then know who to call.</span>
      </h1>
      <p style={{ fontSize: 17, color: "var(--text-secondary)", maxWidth: 640, marginTop: 16, lineHeight: 1.6 }}>
        SymptoSphere helps you understand what your symptoms might mean and where to get care. It is not a replacement for a doctor.
      </p>
      <a href="#check" style={{
        display: "inline-block", marginTop: 26, padding: "13px 22px", borderRadius: 12, background: "var(--accent-teal)", color: "#041b14",
        fontWeight: 700, textDecoration: "none", fontSize: 15,
      }}>Start a symptom check</a>

      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 40 }}>
        {steps.map(s => (
          <div key={s.n} style={{ padding: 20, borderRadius: 16, background: "rgba(20,27,38,0.85)", border: "1px solid var(--border-dim)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--accent-teal-glow)", color: "var(--accent-teal)", fontWeight: 800, marginBottom: 12 }}>{s.n}</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{s.text}</p>
          </div>
        ))}
      </div>

      <div role="note" style={{ marginTop: 22, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.08)", fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>
        <strong style={{ color: "#F59E0B" }}>Emergency?</strong> Call <strong>112</strong> (India, general) or <strong>108</strong> (ambulance). Outside India, use your local emergency number.
      </div>
    </section>
  );
}
