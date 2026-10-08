import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import { ADMIN_BASE } from './config/site'

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

// Staff portal: separate chunks and no site chrome (preloader, WebGL, custom cursor)
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminSetPassword = lazy(() => import('./pages/admin/AdminSetPassword'))
const AdminShows = lazy(() => import('./pages/admin/AdminShows'))
const AdminShowEdit = lazy(() => import('./pages/admin/AdminShowEdit'))
const AdminShowGuests = lazy(() => import('./pages/admin/AdminShowGuests'))

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={`${ADMIN_BASE}/login`} element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
        <Route path={`${ADMIN_BASE}/set-password`} element={<Suspense fallback={null}><AdminSetPassword /></Suspense>} />
        <Route path={ADMIN_BASE} element={<Suspense fallback={null}><AdminLayout /></Suspense>}>
          <Route index element={<AdminShows />} />
          <Route path="shows/new" element={<AdminShowEdit />} />
          <Route path="shows/:id/edit" element={<AdminShowEdit />} />
          <Route path="shows/:id/guests" element={<AdminShowGuests />} />
        </Route>

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
