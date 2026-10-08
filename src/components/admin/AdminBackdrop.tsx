/** The site's loading-screen wood (walnut over the night base), fixed behind every portal page. */
export default function AdminBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-night">
      <div className="absolute inset-0 bg-wood opacity-25" />
    </div>
  )
}
