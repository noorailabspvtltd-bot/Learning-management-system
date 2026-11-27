import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './layouts/DashboardLayout'
import { MyBatchesPage } from './pages/MyBatchesPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/batches" replace />} />
          <Route path="batches" element={<MyBatchesPage />} />
          <Route path="*" element={<Navigate to="/batches" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
