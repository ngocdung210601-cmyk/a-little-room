import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import Landing from './pages/Landing'
import ChatRoomPage from './pages/ChatRoomPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat/:code" element={<ChatRoomPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
