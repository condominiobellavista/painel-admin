import { useState } from 'react'
import { Search } from 'lucide-react'

export default function Unidades() {
  const [busca, setBusca] = useState('')

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Unidades</h1>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número do apto..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-1 rounded-lg text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent transition"
        />
      </div>
      <div className="text-sm text-text-3">Conecte o Supabase para ver as unidades.</div>
    </div>
  )
}
