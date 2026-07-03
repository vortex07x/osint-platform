import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import ScanResults from './pages/ScanResults'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan/:scanId" element={<ScanResults />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App