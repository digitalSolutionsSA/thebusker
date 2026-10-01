import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { site } from '../../../config/site'
import { useReveal } from '../../../hooks/useReveal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'

/**
 * There's no form backend yet, so this opens the visitor's email app with the message
 * pre-filled. Swap handleSubmit for an API call (e.g. a Supabase function) when one exists.
 */
export default function ContactForm() {
  const ref = useReveal<HTMLFormElement>({ origin: 'right', distance: '40px' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const body = `${message}\n\n— ${name} (${email})`
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject || `Enquiry from ${name}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <form ref={ref} onSubmit={handleSubmit} className="glass space-y-4 rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-2xl uppercase">Send us a message</h2>
      <p className="text-sm text-mist">We'll get back to you as soon as we can.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" value={name} onChange={setName} autoComplete="name" required />
        <FormField label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" required />
      </div>
      <FormField label="Subject" value={subject} onChange={setSubject} />
      <FormField label="Your message" value={message} onChange={setMessage} multiline rows={6} required />
      <Button type="submit" size="lg" fullWidth>
        Send message <ArrowRight size={16} />
      </Button>
      <p className="text-center text-xs text-ivory/40" aria-live="polite">
        {sent ? 'Your email app should have opened with your message ready to send.' : 'Opens your email app to send.'}
      </p>
    </form>
  )
}
