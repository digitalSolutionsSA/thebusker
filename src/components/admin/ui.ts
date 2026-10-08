// Shared class names for the admin portal: plain, quick, thumb-friendly controls on the site's palette.

export const adminCard = 'rounded-2xl border border-white/10 bg-night-2/80'

export const adminInput =
  'w-full rounded-xl border border-white/15 bg-night px-4 py-3 text-sm text-ivory placeholder:text-ivory/35 outline-none transition-colors focus:border-gold'

export const adminLabel = 'mb-1.5 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-mist'

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition-[filter,background-color,border-color] disabled:cursor-not-allowed disabled:opacity-50'

export const btnGold = `${btnBase} bg-[linear-gradient(115deg,#f6e3b0_0%,#d9b45c_35%,#a8842a_70%,#e2bd6d_100%)] text-night hover:brightness-110`
export const btnOutline = `${btnBase} border border-white/20 text-ivory hover:border-gold hover:bg-gold/10`
export const btnDanger = `${btnBase} border border-red-400/40 text-red-200 hover:bg-red-500/15`
export const btnGreen = `${btnBase} bg-emerald-600 text-white hover:bg-emerald-500`

export const badge = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em]'
