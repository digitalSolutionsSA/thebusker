import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined

export const isStripeConfigured = Boolean(stripePublishableKey)

let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePublishableKey) return null
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}
