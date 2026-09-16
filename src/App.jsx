import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import MusicPlayer from "./components/MusicPlayer";
import PoinInti from "./pages/PoinInti";
import Memori from "./pages/Memori";
import Jurnal from "./pages/Jurnal";
import JurnalDetail from "./pages/JurnalDetail";
import AdminJurnal from "./pages/AdminJurnal";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/50 text-gray-800 font-sans selection:bg-purple-200 overflow-x-hidden">
        <Navbar />
        <MusicPlayer />

        <main className="pt-32 pb-20 px-0 max-w-none flex flex-col items-center justify-center min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/poin-inti" replace />} />
            <Route path="/poin-inti" element={<PoinInti />} />
            <Route path="/memori" element={<Memori />} />
            <Route path="/jurnal" element={<Jurnal />} />
            <Route path="/jurnal/:id" element={<JurnalDetail />} />
            <Route path="/admin/jurnal" element={<AdminJurnal />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
