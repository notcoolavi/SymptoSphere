"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#E6EDF3", fontFamily: "sans-serif", textAlign: "center", padding: "2rem" }}>
      <div>
        <h2>Something went wrong</h2>
        <p>Your symptoms were not sent anywhere. Please try again.</p>
        <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Reload</button>
      </div>
    </div>
  );
}
