const WINDOWS_MS = 60000;
const CAP = 30;

const buckets = new Map<string, { count: number; windowStart: number }>();

export function allow(ip: string) {
    const now = Date.now();
    const b = buckets.get(ip);
    if (!b || now - b.windowStart > WINDOWS_MS) {
        buckets.set(ip, { count: 1, windowStart: now });
        return true;
    }
    if (b.count >= CAP) return false
    b.count += 1;
    return true;
}
