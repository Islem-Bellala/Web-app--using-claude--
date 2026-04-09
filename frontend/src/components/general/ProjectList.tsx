import { useEffect, useMemo, useState } from 'react'
import type { AppColors } from '../../types'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { BadgeStrip, PageHero, PageShell, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface ProjectListProps {
  c: AppColors
}

export default function ProjectList({ c }: ProjectListProps) {
  const {
    projects,
    fetchProjects,
    createProject,
    loadProject,
    deleteProject,
    saveCurrentProject,
    isSaving,
    currentProjectId,
    currentProjectName,
    projectName,
    engineer,
    reference,
    date,
    setProjectMeta,
  } = useProjectStore()
  const { setActivePage } = useUIStore()

  const [newName, setNewName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    try {
      await createProject(newName.trim(), description.trim() || undefined)
      setNewName('')
      setDescription('')
      setActivePage('params')
    } finally {
      setCreating(false)
    }
  }

  async function handleOpen(id: string) {
    setLoadingId(id)
    try {
      await loadProject(id)
      setActivePage('params')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDelete(id: string) {
    await deleteProject(id)
    setConfirmDelete(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const lastUpdated = useMemo(() => {
    if (projects.length === 0) return 'Aucun projet'
    const dates = projects.map((project) => new Date(project.updated_at).getTime())
    return formatDate(new Date(Math.max(...dates)).toISOString())
  }, [projects])

  return (
    <PageShell c={c}>
      <PageHero
        eyebrow="Pilotage projet"
        title="Reprendre un projet sans perdre le fil"
        description="Créez une nouvelle étude, rechargez un projet existant et gardez toujours un point d’entrée clair vers les paramètres généraux."
        aside={
          <>
            Le projet actif se gère depuis cet écran et reste visible dans l’en-tête principal pendant toute la session.
          </>
        }
      />

      <BadgeStrip
        items={[
          { label: 'Projets', value: String(projects.length), color: c.blue },
          { label: 'Projet actif', value: currentProjectName || 'Aucun', color: currentProjectId ? c.green : c.textMuted },
          { label: 'Dernière mise à jour', value: lastUpdated, color: c.purple },
        ]}
      />

      {currentProjectId ? (
        <StateBanner tone="info">
          Projet ouvert : <strong>{currentProjectName || 'Projet sans nom'}</strong>. Vous pouvez poursuivre les
          paramètres, naviguer dans les vérifications, puis sauvegarder ici ou depuis l’en-tête.
        </StateBanner>
      ) : null}

      <div className="project-dashboard">
        <div className="project-stack">
          <SurfacePanel eyebrow="Nouveau projet" title="Démarrer une étude">
            <form className="project-create-form" onSubmit={handleCreate}>
              <input
                className="project-input"
                type="text"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Nom du projet"
              />
              <textarea
                className="project-textarea"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description rapide du contexte ou de la mission"
              />
              <button type="submit" className="project-button" disabled={creating || !newName.trim()}>
                {creating ? 'Création…' : 'Créer et ouvrir'}
              </button>
            </form>
          </SurfacePanel>

          <SurfacePanel eyebrow="Projet actif" title="Identité et références">
            {currentProjectId ? (
              <div className="project-meta-grid">
                <div className="project-meta-grid project-meta-grid--two">
                  <label className="project-field">
                    <span className="project-field__label">Nom du projet</span>
                    <input
                      className="project-input"
                      type="text"
                      value={projectName}
                      onChange={(event) => setProjectMeta({ projectName: event.target.value })}
                      placeholder="Nom du projet"
                    />
                  </label>
                  <label className="project-field">
                    <span className="project-field__label">Ingénieur</span>
                    <input
                      className="project-input"
                      type="text"
                      value={engineer}
                      onChange={(event) => setProjectMeta({ engineer: event.target.value })}
                      placeholder="Nom de l'ingénieur"
                    />
                  </label>
                </div>

                <div className="project-meta-grid project-meta-grid--two">
                  <label className="project-field">
                    <span className="project-field__label">Référence</span>
                    <input
                      className="project-input"
                      type="text"
                      value={reference}
                      onChange={(event) => setProjectMeta({ reference: event.target.value })}
                      placeholder="Ref. dossier"
                    />
                  </label>
                  <div className="project-field">
                    <span className="project-field__label">Date</span>
                    <div className="project-static-value">{date}</div>
                  </div>
                </div>

                <div className="project-meta-note">
                  Ces informations d&apos;identification se gèrent ici, puis restent disponibles dans le projet enregistré.
                </div>

                <div>
                  <button
                    type="button"
                    className="project-secondary-button"
                    onClick={saveCurrentProject}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Sauvegarde…' : 'Sauvegarder les informations du projet'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="state-empty">
                Ouvrez un projet pour renseigner son identité, son ingénieur et sa référence ici.
              </div>
            )}
          </SurfacePanel>

          <SurfacePanel eyebrow="Vue rapide" title="Résumé de session">
            <div className="project-stat-grid">
              <div className="project-stat">
                <div className="project-stat__label">Ouverts récemment</div>
                <div className="project-stat__value">{projects.length}</div>
              </div>
              <div className="project-stat">
                <div className="project-stat__label">Projet actif</div>
                <div className="project-stat__value" style={{ fontSize: 15 }}>
                  {projectName || currentProjectName || 'Aucun'}
                </div>
              </div>
              <div className="project-stat">
                <div className="project-stat__label">Sauvegarde</div>
                <div className="project-stat__value" style={{ fontSize: 15 }}>
                  {isSaving ? 'En cours' : 'Prête'}
                </div>
              </div>
            </div>
          </SurfacePanel>
        </div>

        <SurfacePanel eyebrow="Bibliothèque" title="Vos projets" flushTop={projects.length === 0}>
          {projects.length === 0 ? (
            <div className="state-empty">
              Aucun projet pour le moment. Créez votre première étude pour démarrer le workflow Bunyan.
            </div>
          ) : (
            <div className="project-grid">
              {projects.map((project) => {
                const isActive = project.id === currentProjectId
                const isLoading = loadingId === project.id
                const isDeleting = confirmDelete === project.id

                return (
                  <article key={project.id} className={`project-card ${isActive ? 'is-active' : ''}`.trim()}>
                    <div className="project-card__title-row">
                      <div>
                        <h3 className="project-card__title">{project.name}</h3>
                        <div className="project-card__meta">Modifié le {formatDate(project.updated_at)}</div>
                      </div>
                      {isActive ? <span className="project-ghost-button" style={{ minHeight: 34 }}>Actif</span> : null}
                    </div>

                    <div className="project-card__desc">
                      {project.description || 'Aucune description fournie. Utilisez ce projet comme point de reprise rapide.'}
                    </div>

                    <div className="project-card__actions">
                      <button type="button" className="project-button" onClick={() => handleOpen(project.id)} disabled={isLoading}>
                        {isLoading ? 'Ouverture…' : 'Ouvrir'}
                      </button>
                      {isDeleting ? (
                        <>
                          <button type="button" className="project-secondary-button" onClick={() => handleDelete(project.id)}>
                            Confirmer la suppression
                          </button>
                          <button type="button" className="project-ghost-button" onClick={() => setConfirmDelete(null)}>
                            Annuler
                          </button>
                        </>
                      ) : (
                        <button type="button" className="project-ghost-button" onClick={() => setConfirmDelete(project.id)}>
                          Supprimer
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </SurfacePanel>
      </div>
    </PageShell>
  )
}
