import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <h1>Let’s get you back to the celebration.</h1>
      <Link className="button" href="/">
        Back to Santa Social
      </Link>
    </main>
  );
}
