"use client";

/**
 * Covers the app with a themed loading screen until the Material Symbols icon
 * font has finished loading, so users never see the raw ligature names
 * (grid_view, confirmation_number, …) before the glyphs swap in.
 *
 * The overlay sits ON TOP of the already-rendered app (children mount straight
 * away so data-fetching starts immediately); it's just removed once the font is
 * ready. Initial state is deterministically `false` on both server and client
 * to avoid a hydration mismatch — the reveal happens in an effect.
 */

import { useEffect, useState } from "react";

const ICON_FAMILY = "Material Symbols Outlined";
const FONT_SPEC = `24px "${ICON_FAMILY}"`;
const POLL_MS = 90;
const MAX_TRIES = 70; // ~6.3s safety net before we reveal regardless

function isIconFace(face: FontFace) {
  return face.family.replace(/["']/g, "") === ICON_FAMILY;
}

export function FontGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // No Font Loading API (very old browsers) — never block the app.
    if (typeof document === "undefined" || !document.fonts) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let tries = 0;

    const reveal = () => {
      if (!cancelled) setReady(true);
    };

    // Google's stylesheet is remote, so the @font-face may not be registered
    // yet when this effect first runs. Poll until the face exists AND reports
    // `loaded`, rather than trusting a single fonts.load()/check() call (which
    // resolves true when no matching face is registered — a false positive).
    const tick = async () => {
      if (cancelled) return;

      const face = Array.from(document.fonts).find(isIconFace);
      if (face) {
        try {
          await face.load();
        } catch {
          /* ignore — handled by the status check / safety net below */
        }
        if (face.status === "loaded") {
          reveal();
          return;
        }
      } else {
        // Nudge the set to fetch the font once its @font-face registers.
        try {
          await document.fonts.load(FONT_SPEC);
        } catch {
          /* ignore */
        }
      }

      if (cancelled) return;
      if (++tries >= MAX_TRIES) {
        reveal();
        return;
      }
      window.setTimeout(tick, POLL_MS);
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {children}
      {!ready && (
        <div className="font-gate" role="status" aria-live="polite">
          <div className="ws-logo font-gate-logo">N</div>
          <div className="font-gate-spinner" aria-hidden="true" />
          <span className="font-gate-label">Loading Nockett…</span>
        </div>
      )}
    </>
  );
}
