/**
 * Re-mounted on every navigation: a short, subtle entrance so moving between screens feels
 * native rather than abrupt. Skipped entirely when the user prefers reduced motion.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-page-enter">{children}</div>;
}
