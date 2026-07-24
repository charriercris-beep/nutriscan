import { useState } from 'react'

function estSombreActif() {
  return document.documentElement.classList.contains('dark')
}

export default function ToggleModeSombre() {
  const [sombre, setSombre] = useState(estSombreActif)

  function basculer() {
    const nouveau = !sombre
    document.documentElement.classList.toggle('dark', nouveau)
    localStorage.setItem('nutriscan-theme', nouveau ? 'dark' : 'light')
    setSombre(nouveau)
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className="flex items-center gap-2 min-h-[44px] px-3 rounded-xl border-2 border-sauge-100 dark:border-anthracite-700 text-sm font-medium text-anthracite-700 dark:text-creme-100"
    >
      <span aria-hidden="true">{sombre ? '🌙' : '☀️'}</span>
      {sombre ? 'Mode sombre' : 'Mode clair'}
    </button>
  )
}
