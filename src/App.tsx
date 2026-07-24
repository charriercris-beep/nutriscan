import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Accueil from './pages/Accueil'
import Scanner from './pages/Scanner'
import Comparateur from './pages/Comparateur'
import Profil from './pages/Profil'
import Planning from './pages/Planning'
import Statistiques from './pages/Statistiques'

function App() {
  return (
    <>
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/comparateur" element={<Comparateur />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/statistiques" element={<Statistiques />} />
        </Routes>
      </main>
      <BottomNav />
    </>
  )
}

export default App
