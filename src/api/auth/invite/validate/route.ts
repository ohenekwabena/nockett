import { NextApiRequest, NextApiResponse } from "next";
import { validateInviteToken } from "../../invite";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.query;
  if (!token || typeof token !== "string") return res.status(400).json({ error: "Missing token" });
  const invite = validateInviteToken(token);
  if (!invite) return res.status(404).json({ error: "Invalid or expired token" });
  res.status(200).json({ email: invite.email });
}
