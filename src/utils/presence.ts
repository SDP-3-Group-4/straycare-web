export interface PresenceLabel {
  label: string;
  online: boolean;
}

export const presenceText = (
  lastSeenAt?: string | null,
  now: number = Date.now(),
): PresenceLabel => {
  if (!lastSeenAt) return { label: "Offline", online: false };
  const ts = new Date(lastSeenAt).getTime();
  if (isNaN(ts)) return { label: "Long time ago", online: false };

  const diffMs = now - ts;
  if (diffMs < 0) return { label: "Online", online: true };

  const mins = diffMs / 60000;
  if (mins < 1) return { label: "Online", online: true };
  if (mins < 60) {
    const m = Math.floor(mins);
    return { label: `${m} minute${m === 1 ? "" : "s"} ago`, online: false };
  }
  const hours = mins / 60;
  if (hours < 24) {
    const h = Math.floor(hours);
    return { label: `${h} hour${h === 1 ? "" : "s"} ago`, online: false };
  }
  const days = hours / 24;
  if (days < 7) {
    const d = Math.floor(days);
    return { label: `${d} day${d === 1 ? "" : "s"} ago`, online: false };
  }
  return { label: "Long time ago", online: false };
};
