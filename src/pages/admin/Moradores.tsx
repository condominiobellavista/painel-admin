import { useState } from 'react'
import { Search, Plus } from 'lucide-react'

export default function Moradores() {
  const [busca, setBusca] = useState('')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Moradores</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition">
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, apto..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border-1 rounded-lg text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent transition"
        />
      </div>
      <div className="text-sm text-text-3">Conecte o Supabase para ver os dados dos moradores.</div>
    </div>
  )
}
