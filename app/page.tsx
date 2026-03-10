import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>API Spend Guard</h1>
      <p>Read-only spend monitoring with threshold alerts.</p>
      <div className="card">
        <h2>Quick Links</h2>
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/admin">Admin Diagnostics</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
