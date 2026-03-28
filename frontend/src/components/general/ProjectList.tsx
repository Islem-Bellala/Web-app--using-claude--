/**
 * Bunyan — Project List Page
 * Shows the user's projects; allows create, open, delete.
 * Navigates to ProjectParams after creating or opening a project.
 */

import { useEffect, useState } from 'react'
import type { AppColors } from '../../types'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'

interface ProjectListProps {
  c: AppColors
}

export default function ProjectList({ c }: ProjectListProps) {
  const {
    projects, fetchProjects, createProject, loadProject, deleteProject, isSaving, currentProjectId,
  } = useProjectStore()
  const { setActivePage } = useUIStore()

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)
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
    <div style={{ padding: 32, maxWidth: 700 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 24 }}>
        Mes projets
      </h2>

      {/* New project form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Nom du nouveau projet…"
          style={{
            flex: 1, padding: '9px 12px',
            background: c.elevated, border: `1px solid ${c.border}`,
            borderRadius: 8, color: c.text, fontSize: 14, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          style={{
            padding: '9px 18px',
            background: creating || !newName.trim() ? c.borderLight : c.blue,
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: creating || !newName.trim() ? 'default' : 'pointer',
          }}
        >
          {creating ? '…' : 'Nouveau projet'}
        </button>
      </form>

      {/* Project list */}
      {loading && (
        <div style={{ color: c.textMuted, fontSize: 13, marginBottom: 16 }}>Chargement…</div>
      )}

      {projects.length === 0 && !loading ? (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          color: c.textMuted, fontSize: 14,
        }}>
          Aucun projet. Créez-en un ci-dessus.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              background: p.id === currentProjectId ? c.elevated : c.surface,
              border: `1px solid ${p.id === currentProjectId ? c.blue : c.border}`,
              borderRadius: 10, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: c.text, fontSize: 14 }}>{p.name}</div>
                {p.description && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{p.description}</div>
                )}
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
                  Modifié le {formatDate(p.updated_at)}
                </div>
              </div>

              {/* Confirm delete inline */}
              {confirmDelete === p.id ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: c.red }}>Supprimer ?</span>
                  <button type="button" onClick={() => handleDelete(p.id)} style={{
                    background: c.red, border: 'none', borderRadius: 6,
                    padding: '5px 10px', color: '#fff', fontSize: 12, cursor: 'pointer',
                  }}>Oui</button>
                  <button type="button" onClick={() => setConfirmDelete(null)} style={{
                    background: c.elevated, border: `1px solid ${c.border}`,
                    borderRadius: 6, padding: '5px 10px', color: c.textSec,
                    fontSize: 12, cursor: 'pointer',
                  }}>Non</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => handleOpen(p.id)} style={{
                    background: c.blue, border: 'none', borderRadius: 7,
                    padding: '7px 14px', color: '#fff', fontSize: 13,
                    fontWeight: 600, cursor: 'pointer',
                  }}>
                    Ouvrir
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(p.id)} style={{
                    background: 'none', border: `1px solid ${c.border}`,
                    borderRadius: 7, padding: '7px 10px', color: c.textMuted,
                    fontSize: 13, cursor: 'pointer',
                  }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save indicator for open project */}
      {currentProjectId && (
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => useProjectStore.getState().saveCurrentProject()}
            disabled={isSaving}
            style={{
              padding: '8px 18px',
              background: isSaving ? c.borderLight : c.green,
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: isSaving ? 'default' : 'pointer',
            }}
          >
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder le projet ouvert'}
          </button>
        </div>
      )}
    </div>
  )
}
