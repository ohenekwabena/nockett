"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { getProfile } from "@/lib/identity";
import { useTheme } from "@/components/ui/theme-provider";
import { Avatar, Btn, Chip, MIcon, SegTabs, Select } from "@/components/nk/ui";

interface SentInvite {
  email: string;
  role: string;
  link: string;
}

function InviteCard() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState<SentInvite[]>([]);

  const send = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        toast.error(data.error || "Failed to generate invite");
        return;
      }
      const link = `${window.location.origin}/auth/signup?invite=${data.token}`;
      setInvites((previous) => [{ email, role, link }, ...previous]);
      toast.success(`Invite created for ${email} — single-use link, expires in 24 hours`);
      setEmail("");
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  };

  return (
    <div className="set-card">
      <div className="set-card-title">Invite a teammate</div>
      <p className="dim" style={{ margin: "0 0 12px", fontSize: 12.5 }}>
        Nockett is invite-only. Each invite is a single-use link that expires after 24 hours.
      </p>
      <div className="invite-row">
        <input
          className="input"
          placeholder="colleague@afriwave.com"
          value={email}
          disabled={loading}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
        />
        <Select
          value={role}
          onChange={setRole}
          options={[
            { value: "user", label: "User" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <Btn kind="primary" icon="send" disabled={loading} onClick={send}>
          {loading ? "Sending…" : "Send invite"}
        </Btn>
      </div>
      {invites.length > 0 && (
        <div className="invite-list">
          {invites.map((invite, index) => (
            <div key={index} className="invite-item">
              <MIcon name="schedule_send" size={16} className="dim" />
              <span className="invite-email">{invite.email}</span>
              <Chip>{invite.role === "admin" ? "Admin" : "User"}</Chip>
              <button type="button" className="link-btn" onClick={() => copy(invite.link)}>
                <MIcon name="content_copy" size={13} /> Copy link
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then((profile) => setProfileName(profile.name))
      .catch(() => setProfileName(null));
  }, [user]);

  const displayName = profileName || user?.email || "—";

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-title-row">
          <MIcon name="settings" size={20} className="accent" fill={1} />
          <h1>Settings</h1>
        </div>
      </div>
      <div className="set-grid">
        <div className="set-card">
          <div className="set-card-title">Profile</div>
          <div className="set-me">
            <Avatar name={displayName} size={40} />
            <span className="me-meta">
              <span className="me-name" style={{ fontSize: 14 }}>
                {displayName}
              </span>
              <span className="dim" style={{ fontSize: 12.5 }}>
                {user?.email}
              </span>
            </span>
            <Chip tone={isAdmin ? "blue" : undefined}>{isAdmin ? "Admin" : "User"}</Chip>
          </div>
          <div className="set-row">
            <span>Appearance</span>
            <SegTabs
              value={theme}
              onChange={(next) => setTheme(next as "light" | "dark")}
              tabs={[
                { id: "light", label: "Light", icon: "light_mode" },
                { id: "dark", label: "Dark", icon: "dark_mode" },
              ]}
            />
          </div>
        </div>

        {isAdmin && <InviteCard />}
      </div>
    </div>
  );
}
