//
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Registrar from './pages/Registrar'
import Insurer from './pages/Insurer'
import Claimant from './pages/Claimant'
import Admin from './pages/Admin'
import Layout from './components/Layout'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Contact from './pages/Contact'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/registrar" element={<Registrar />} />
          <Route path="/insurer" element={<Insurer />} />
          <Route path="/claimant" element={<Claimant />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
