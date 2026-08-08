// Gestion du cycle de vie des sessions.
// Implémente la capacité `user-auth` : expiration sur inactivité.

const DEFAULT_IDLE_MS = 30 * 60 * 1000;
const ADMIN_IDLE_MS = 15 * 60 * 1000;

export interface Session {
  id: string;
  userId: string;
  isAdmin: boolean;
  lastSeenAt: number;
}

export function idleLimitFor(session: Session): number {
  return session.isAdmin ? ADMIN_IDLE_MS : DEFAULT_IDLE_MS;
}

export function isExpired(session: Session, now: number): boolean {
  return now - session.lastSeenAt >= idleLimitFor(session);
}

export function touch(session: Session, now: number): Session {
  return { ...session, lastSeenAt: now };
}
