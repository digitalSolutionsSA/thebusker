import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ShowsPage from './pages/ShowsPage'
import BokTownPage from './pages/BokTownPage'
import BookingSuccess from './pages/BookingSuccess'
import BookingCancelled from './pages/BookingCancelled'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-ink">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shows" element={<ShowsPage />} />
            <Route path="/bok-town" element={<BokTownPage />} />
            <Route path="/booking/success" element={<BookingSuccess />} />
            <Route path="/booking/cancelled" element={<BookingCancelled />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
