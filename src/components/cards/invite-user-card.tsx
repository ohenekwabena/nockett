import React, { useState } from "react";

export function InviteUserCard() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInviteLink("");
    setCopied(false);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setError(data.error || "Failed to generate invite");
      } else {
        const link = `${window.location.origin}/auth/signup?invite=${data.token}`;
        setInviteLink(link);
      }
    } catch (err) {
      setError("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700 max-w-md w-full mx-auto">
      <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Invite a User</h2>
      <form onSubmit={handleInvite} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary"
          placeholder="user@email.com"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Generate Invite"}
        </button>
      </form>
      {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
      {inviteLink && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 text-xs"
            />
            <button
              onClick={handleCopy}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1 text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              type="button"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
