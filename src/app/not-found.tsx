import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", padding: "2rem", color: "#f4f1ea", background: "#05070a", textAlign: "center" }}><div><p style={{ color: "#8fd3da", letterSpacing: ".14em", textTransform: "uppercase" }}>404 · Signal not found</p><h1 style={{ fontSize: "clamp(3rem,10vw,7rem)", margin: "1rem 0" }}>This path does not exist.</h1><p><Link style={{ color: "#bceaf0" }} href="/">Return to Ascend Vanta</Link> or explore the <Link style={{ color: "#bceaf0" }} href="/capabilities">capability system</Link>.</p></div></main>;
}
