export function pad(s: string): string {
    while (s.length % 2 == 1) s = "0" + s;
    return s;
}