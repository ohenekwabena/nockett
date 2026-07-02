import Link from "next/link";

export default function Home() {
  return (
    <div className="auth-wrap landing">
      <div className="landing-inner">
        <span className="ws-logo landing-logo">N</span>
        <h1 className="landing-h">Nockett</h1>
        <p className="landing-p">
          One place for the NOC: ticket lifecycle, incident timelines, reference vocabularies, shift
          rotas, and an immutable audit trail.
        </p>
        <Link href="/dashboard" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: 14 }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
