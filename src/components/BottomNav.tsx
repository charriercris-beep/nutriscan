import { NavLink } from 'react-router-dom'

const onglets = [
  { to: '/', label: 'Accueil', icon: '🏠' },
  { to: '/planning', label: 'Planning', icon: '📅' },
  { to: '/statistiques', label: 'Stats', icon: '📊' },
  { to: '/profil', label: 'Profil', icon: '🙋' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 dark:bg-anthracite-800/95 backdrop-blur border-t border-sauge-100 dark:border-anthracite-700 safe-bottom z-40">
      <ul className="flex justify-around">
        {onglets.map((o) => (
          <li key={o.to} className="flex-1">
            <NavLink
              to={o.to}
              end={o.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs font-medium transition-colors ${
                  isActive ? 'text-sauge-700 dark:text-sauge-300' : 'text-anthracite-700/60 dark:text-creme-50/50'
                }`
              }
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {o.icon}
              </span>
              <span>{o.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
