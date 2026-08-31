export default function Footer() {
  return (
    <footer id="venue" className="border-t border-brass/20 bg-ink-2">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="text-xl font-headline brass-text tracking-wider mb-3">THE BUSKER</h3>
          <p className="text-cream/60 text-sm leading-relaxed">
            Music Hall &amp; Venue — the new home of great food, good shows, and turning V-Town
            into Bok Town on match day.
          </p>
        </div>
        <div>
          <h4 className="uppercase text-xs tracking-[0.3em] text-brass-light mb-3">Find Us</h4>
          <p className="text-cream/60 text-sm leading-relaxed">
            1 Club Street, Peacehaven<br />
            Vereeniging (Old Barnyard)<br />
            South Africa
          </p>
        </div>
        <div>
          <h4 className="uppercase text-xs tracking-[0.3em] text-brass-light mb-3">Get In Touch</h4>
          <p className="text-cream/60 text-sm leading-relaxed">
            074 000 0002<br />
            thebusker.theatregmail.com
          </p>
        </div>
      </div>
      <div className="border-t border-brass/10 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} The Busker Music Hall &amp; Venue. All rights reserved.
      </div>
    </footer>
  )
}
