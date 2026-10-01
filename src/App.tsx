import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'

// Each page is its own chunk, so visitors only download what they open.
const Home = lazy(() => import('./pages/Home'))
const Shows = lazy(() => import('./pages/Shows'))
const ShowDetail = lazy(() => import('./pages/ShowDetail'))
const BokTown = lazy(() => import('./pages/BokTown'))
const About = lazy(() => import('./pages/About'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Contact = lazy(() => import('./pages/Contact'))
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'))
const BookingCancelled = lazy(() => import('./pages/BookingCancelled'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/shows/:slug" element={<ShowDetail />} />
          <Route path="/bok-town" element={<BokTown />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking/success" element={<BookingSuccess />} />
          <Route path="/booking/cancelled" element={<BookingCancelled />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
