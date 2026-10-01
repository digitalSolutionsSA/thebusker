import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'
import Footer from '../Footer'
import Preloader from '../Preloader'
import ScrollManager from '../ScrollManager'
import PageTransition from '../PageTransition'
import CursorGlow from '../CursorGlow'
import Cursor from '../Cursor'
import { useScrollRevealPresets } from '../../../hooks/useScrollRevealPresets'

export default function SiteLayout() {
  useScrollRevealPresets()

  return (
    <div className="flex min-h-screen flex-col">
      <Preloader />
      <ScrollManager />
      <CursorGlow />
      <Cursor />
      <Navbar />
      <main className="relative flex-1">
        <Suspense fallback={<div className="min-h-screen" />}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
