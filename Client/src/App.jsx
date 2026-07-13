import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./Login"
import Register from "./Register"
import Dashboard from "./Dashboard"
import ResidentDashboard from "./ResidentDashboard"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resident" element={<ResidentDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
