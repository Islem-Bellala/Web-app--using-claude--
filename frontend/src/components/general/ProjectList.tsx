/**
 * Bunyan — Project List Page (Phase 6: Atlas theme)
 */

import { useEffect, useState } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'

export default function ProjectList() {
  const {
    projects, fetchProjects, createProject, loadProject, deleteProject, isSaving, currentProjectId,
  } = useProjectStore()
  const { setActivePage } = useUIStore()

  const [newName, setNewName]         = useState('')
  const [creating, setCreating]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createProject(newName.trim())
      setNewName('')
      setActivePage('params')
    } finally {
      setCreating(false)
    }
  }

  async function handleOpen(id: string) {
    setLoading(true)
    try {
      await loadProject(id)
      setActivePage('params')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    await deleteProject(id)
    setConfirmDelete(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-DZ', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-atlas-text dark:text-atlas-dark-text mb-6">
        Mes projets
      </h2>

      {/* ── New project form ─────────────────────────────────────────── */}
      <form onSubmit={handleCreate} className="flex gap-2.5 mb-7">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nom du nouveau projet…"
          className="flex-1 px-3 py-2 rounded-lg text-sm
            bg-atlas-card dark:bg-atlas-dark-card
            border border-atlas-border dark:border-atlas-dark-border
            text-atlas-text dark:text-atlas-dark-text
            placeholder:text-atlas-text-muted dark:placeholder:text-atlas-dark-text-muted
            outline-none focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/30 transition-colors"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
            bg-atlas-gold text-atlas-green hover:bg-atlas-gold/90
            disabled:opacity-50 disabled:cursor-default"
        >
          {creating ? '…' : 'Nouveau projet'}
        </button>
      </form>

      {/* ── Loading indicator ────────────────────────────────────────── */}
      {loading && (
        <p className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted mb-4">
          Chargement…
        </p>
      )}

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {projects.length === 0 && !loading ? (
        <div className="text-center py-16 text-atlas-text-muted dark:text-atlas-dark-text-muted text-sm">
          Aucun projet — créez votre premier projet ci-dessus.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {projects.map(p => {
            const isOpen = p.id === currentProjectId
            return (
              <div
                key={p.id}
                className={[
                  'flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-colors',
                  isOpen
                    ? 'bg-atlas-gold/5 border-atlas-gold/40 dark:border-atlas-gold/30'
                    : 'bg-atlas-card dark:bg-atlas-dark-card border-atlas-card-border dark:border-atlas-dark-card-border',
                ].join(' ')}
              >
                {/* Colored left accent for open project */}
                {isOpen && (
                  <div className="w-1 h-8 rounded-full bg-atlas-gold flex-shrink-0 -ml-1" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-atlas-text dark:text-atlas-dark-text truncate">
                    {p.name}
                  </div>
                  {p.description && (
                    <div className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5 truncate">
                      {p.description}
                    </div>
                  )}
                  <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mt-1">
                    Modifié le {formatDate(p.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                {confirmDelete === p.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-atlas-danger">Supprimer ?</span>
                    <button type="button" onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-atlas-danger text-white hover:bg-atlas-danger/90 transition-colors">
                      Oui
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)}
                      className="px-2.5 py-1 rounded-md text-xs border border-atlas-border dark:border-atlas-dark-border
                        text-atlas-text-sec dark:text-atlas-dark-text-sec hover:bg-atlas-border/30 transition-colors">
                      Non
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleOpen(p.id)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold
                        bg-atlas-topbar dark:bg-atlas-dark-card text-atlas-gold border border-atlas-gold/40
                        hover:bg-atlas-topbar/80 transition-colors">
                      Ouvrir
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(p.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs
                        border border-atlas-border dark:border-atlas-dark-border
                        text-atlas-text-muted dark:text-atlas-dark-text-muted
                        hover:border-atlas-danger/50 hover:text-atlas-danger transition-colors">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Save open project ────────────────────────────────────────── */}
      {currentProjectId && (
        <div className="mt-7">
          <button
            type="button"
            onClick={() => useProjectStore.getState().saveCurrentProject()}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              bg-atlas-success text-white hover:bg-atlas-success/90
              disabled:opacity-50 disabled:cursor-default"
          >
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder le projet ouvert'}
          </button>
        </div>
      )}
    </div>
  )
}
