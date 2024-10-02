import {BrowserRouter,Route, Routes,} from'react-router-dom' 
import Home from './pages/Home'
import Student from './pages/Student/Index'
import Instructor from './pages/Instructor/Index'
import Admin from './pages/Admin/Index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MonitorLab from './pages/Instructor/MonitorLab'
function App() {
const queryClient = new QueryClient()

  return (
    <>
       <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/student" element={<Student />} />
            <Route path="/instructor">
              <Route index element={<Instructor />} />
              <Route path="lab/:id" element={<MonitorLab />} /> {/* Fixed path */}
            </Route>
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </BrowserRouter>
       </QueryClientProvider>
    </>
  )
}

export default App
