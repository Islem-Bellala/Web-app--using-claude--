import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import QFModal from '../shared/QFModal'
import RModal, { type BracingSystem } from '../shared/RModal'
import type { AppColors } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import './ProjectParams.css'

const ZONE_LABELS: Record<string, string> = {
  '0': 'Zone 0 - Tres faible',
  I: 'Zone I (0.07g)',
  II: 'Zone II (0.10g)',
  III: 'Zone III (0.15g)',
  IV: 'Zone IV (0.20g)',
  V: 'Zone V (0.25g)',
  VI: 'Zone VI (0.30g)',
}

interface FrameSystem {
  v: string
  l: string
  ct: string
}

const FRAME_SYSTEMS: FrameSystem[] = [
  { v: 'ba_no_infill', l: 'Ossature BA sans remplissage', ct: 'CT=0.075' },
  { v: 'steel_no_infill', l: 'Ossature acier sans remplissage', ct: 'CT=0.085' },
  { v: 'ba_with_infill', l: 'Ossature BA/acier avec remplissage', ct: 'CT=0.050' },
  { v: 'other', l: 'Autres systemes', ct: 'CT=0.050' },
]

type ProjectStoreState = ReturnType<typeof useProjectStore>
type SeismicStoreState = ReturnType<typeof useSeismicStore>
type StructuralStoreState = ReturnType<typeof useStructuralStore>
type StatusTone = 'complete' | 'attention' | 'optional'

interface ProjectParamsProps {
  c: AppColors
}

function alpha(color: string, opacity: string) {
  return `${color}${opacity}`
}

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function formatMetric(value: string | number, unit: string, digits = 2) {
  if (value === '' || value === null || value === undefined) return '—'
  const numeric = typeof value === 'number' ? value : parseFloat(value)
  if (Number.isNaN(numeric)) return '—'
  return `${numeric.toFixed(digits)} ${unit}`
}

function CardShell({
  c,
  title,
  kicker,
  description,
  accent,
  statusLabel,
  statusTone,
  className,
  children,
}: {
  c: AppColors
  title: string
  kicker: string
  description: string
  accent: string
  statusLabel: string
  statusTone: StatusTone
  className?: string
  children: ReactNode
}) {
  return (
    <section className={joinClasses('pp-card', className)}>
      <div className="pp-card-header">
        <div className="pp-card-heading">
          <div className="pp-card-kicker" style={{ color: accent }}>
            {kicker}
          </div>
          <h2 className="pp-card-title">{title}</h2>
          <p className="pp-card-description">{description}</p>
        </div>
        <StatusBadge c={c} tone={statusTone}>
          {statusLabel}
        </StatusBadge>
      </div>
      {children}
    </section>
  )
}

function StatusBadge({
  c,
  tone,
  children,
}: {
  c: AppColors
  tone: StatusTone
  children: ReactNode
}) {
  const toneStyles =
    tone === 'complete'
      ? { color: c.green, border: alpha(c.green, '44'), background: alpha(c.green, '12') }
      : tone === 'attention'
        ? { color: c.amber, border: alpha(c.amber, '44'), background: alpha(c.amber, '12') }
        : { color: c.textSec, border: c.border, background: c.elevated }

  return (
    <span
      className="pp-status-badge"
      style={{
        color: toneStyles.color,
        borderColor: toneStyles.border,
        background: toneStyles.background,
      }}
    >
      {children}
    </span>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pp-section-title-wrap">
      <div className="pp-section-title">{title}</div>
      {subtitle && <div className="pp-section-subtitle">{subtitle}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="pp-field">
      <span className="pp-label">{label}</span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  style,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: CSSProperties
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="pp-input"
      style={style}
    />
  )
}

function ChoiceButton({
  active,
  accent,
  children,
  onClick,
}: {
  active: boolean
  accent: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={joinClasses('pp-choice-button', active && 'is-active')}
      style={
        {
          '--pp-choice-accent': accent,
          '--pp-choice-background': alpha(accent, '14'),
        } as CSSProperties
      }
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ActionTrigger({
  accent,
  title,
  value,
  helper,
  action,
}: {
  accent: string
  title: string
  value: ReactNode
  helper?: ReactNode
  action: ReactNode
}) {
  return (
    <div
      className="pp-action-trigger"
      style={
        {
          '--pp-trigger-accent': accent,
          '--pp-trigger-background': alpha(accent, '12'),
        } as CSSProperties
      }
    >
      <div className="pp-action-copy">
        <div className="pp-action-label">{title}</div>
        <div className="pp-action-value">{value}</div>
        {helper && <div className="pp-action-helper">{helper}</div>}
      </div>
      <div>{action}</div>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="pp-header">
      <div>
        <div className="pp-eyebrow">Bunyan - Parametres</div>
        <h1 className="pp-page-title">Parametres generaux</h1>
        <p className="pp-page-subtitle">
          Point d&apos;entree unique pour les donnees de projet, les coefficients sismiques et les
          resultats d&apos;analyse dynamique.
        </p>
      </div>
      <div className="pp-header-note">
        Ces valeurs alimentent le spectre, les combinaisons et la verification sismique.
      </div>
    </header>
  )
}

function SummaryStrip({
  c,
  zoneLabel,
  site,
  group,
  analysisMode,
  storyCount,
  totalW,
  hn,
}: {
  c: AppColors
  zoneLabel: string
  site: string
  group: string
  analysisMode: string
  storyCount: number
  totalW: number
  hn: number
}) {
  const items = [
    { label: 'Zone', value: zoneLabel, helper: 'Classification RPA 2024', accent: c.blue },
    { label: 'Site', value: site || '—', helper: 'Classe de site', accent: c.green },
    { label: 'Groupe', value: group || '—', helper: 'Importance du projet', accent: c.amber },
    { label: 'Mode', value: analysisMode, helper: 'Spectre de calcul', accent: c.purple },
    { label: 'Niveaux', value: String(storyCount), helper: 'Niveaux modelises', accent: c.blue },
    { label: 'W total', value: `${totalW.toFixed(0)} kN`, helper: 'Poids cumule', accent: c.green },
    { label: 'h_n', value: `${hn.toFixed(1)} m`, helper: 'Hauteur totale', accent: c.purple },
  ]

  return (
    <section className="pp-summary-strip">
      {items.map((item) => (
        <article
          key={item.label}
          className="pp-summary-card"
          style={{ borderTopColor: item.accent }}
        >
          <div className="pp-summary-label">{item.label}</div>
          <div className="pp-summary-value">{item.value}</div>
          <div className="pp-summary-helper">{item.helper}</div>
        </article>
      ))}
    </section>
  )
}

function IdentificationCard({
  c,
  project,
  completedCount,
}: {
  c: AppColors
  project: ProjectStoreState
  completedCount: number
}) {
  const statusLabel = completedCount > 0 ? `${completedCount}/3 renseignes` : 'Facultatif'
  const statusTone: StatusTone = completedCount > 0 ? 'complete' : 'optional'

  return (
    <CardShell
      c={c}
      title="Identification"
      kicker="1 - Informations projet"
      description="Bloc secondaire. Les champs vides restent utilisables grace aux valeurs generees automatiquement."
      accent={c.textMuted}
      statusLabel={statusLabel}
      statusTone={statusTone}
      className="pp-identification-card"
    >
      <div className="pp-note pp-note--neutral">
        Nom du projet, ingenieur et reference sont optionnels. La date reste affichee telle quelle.
      </div>

      <div className="pp-card-stack">
        <Field label="Nom du projet">
          <TextInput
            value={project.projectName}
            onChange={(value) => project.setProjectMeta({ projectName: value })}
            placeholder={`Projet_${project.date}`}
          />
        </Field>
        <Field label="Ingenieur">
          <TextInput
            value={project.engineer}
            onChange={(value) => project.setProjectMeta({ engineer: value })}
            placeholder="Nom de l'ingenieur"
          />
        </Field>
        <Field label="Reference">
          <TextInput
            value={project.reference}
            onChange={(value) => project.setProjectMeta({ reference: value })}
            placeholder="Ref. dossier"
          />
        </Field>
        <Field label="Date">
          <div className="pp-static-value">{project.date}</div>
        </Field>
      </div>
    </CardShell>
  )
}

function SeismicCard({
  c,
  project,
  seismic,
  wilayaName,
  wilayaHasSplitZones,
  hasCommunes,
  seismicReady,
  hasPlanGeometry,
  onOpenQF,
  onOpenR,
}: {
  c: AppColors
  project: ProjectStoreState
  seismic: SeismicStoreState
  wilayaName: string
  wilayaHasSplitZones: boolean
  hasCommunes: boolean
  seismicReady: boolean
  hasPlanGeometry: boolean
  onOpenQF: (mode: string) => void
  onOpenR: (mode: string) => void
}) {
  return (
    <CardShell
      c={c}
      title="Parametres sismiques"
      kicker="2 - Pilotage RPA 2024"
      description="Zone, classification, coefficients de comportement et geometrie en plan regroupes dans un bloc principal."
      accent={c.blue}
      statusLabel={seismicReady ? 'Complet' : 'A verifier'}
      statusTone={seismicReady ? 'complete' : 'attention'}
      className="pp-seismic-card"
    >
      <div className="pp-card-section pp-card-section--first">
        <SectionTitle title="Localite" subtitle="Wilaya, commune et zone sismique derivee." />
        <div className="pp-field-grid pp-field-grid--two">
          <Field label="Wilaya">
            <select
              value={project.wilayaCode}
              onChange={(event) => project.setWilaya(event.target.value)}
              disabled={project.wilayasLoading}
              className="pp-input pp-select"
            >
              {project.wilayas.map((wilaya) => (
                <option key={wilaya.code} value={wilaya.code}>
                  {wilaya.code} - {wilaya.name}
                </option>
              ))}
            </select>
          </Field>

          {wilayaHasSplitZones && hasCommunes ? (
            <Field label="Commune">
              <select
                value={project.commune}
                onChange={(event) => project.setCommune(event.target.value)}
                disabled={project.communesLoading}
                className="pp-input pp-select"
                style={{ borderColor: alpha(c.amber, '66') }}
              >
                <option value="">- Autre commune (Zone {project.zone || '—'})</option>
                {[...project.communes]
                  .sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name))
                  .map((commune) => (
                    <option key={commune.name} value={commune.name}>
                      {commune.name} - Zone {commune.zone}
                    </option>
                  ))}
              </select>
            </Field>
          ) : (
            <Field label="Commune">
              <div className="pp-static-value">{project.commune || 'Non applicable'}</div>
            </Field>
          )}
        </div>

        <div className="pp-highlight-card" style={{ borderColor: alpha(c.blue, '44') }}>
          <div className="pp-highlight-row">
            <div>
              <div className="pp-highlight-label">Wilaya active</div>
              <div className="pp-highlight-value">{wilayaName}</div>
            </div>
            <div>
              <div className="pp-highlight-label">Zone sismique</div>
              <div className="pp-highlight-value" style={{ color: project.zone === '0' ? c.amber : c.blue }}>
                {ZONE_LABELS[project.zone] || project.zone || 'En attente'}
              </div>
            </div>
          </div>
          {wilayaHasSplitZones && !hasCommunes && !project.communesLoading && (
            <div className="pp-inline-note" style={{ color: c.amber }}>
              Wilaya partagee - consulter l&apos;Annexe A du RPA 2024 pour confirmer la commune.
            </div>
          )}
        </div>
      </div>

      <div className="pp-card-section">
        <SectionTitle title="Classification" subtitle="Parametres de site, d&apos;usage et de structure." />
        <div className="pp-field-grid pp-field-grid--two">
          <Field label="Classe de site">
            <div className="pp-button-row pp-button-row--four">
              {['S1', 'S2', 'S3', 'S4'].map((site) => (
                <ChoiceButton
                  key={site}
                  active={project.site === site}
                  accent={c.green}
                  onClick={() => project.setSite(site)}
                >
                  {site}
                </ChoiceButton>
              ))}
            </div>
          </Field>

          <Field label="Groupe d'importance">
            <select
              value={project.group}
              onChange={(event) => project.setGroup(event.target.value)}
              className="pp-input pp-select"
            >
              <option value="1A">Groupe 1A - I=1.4</option>
              <option value="1B">Groupe 1B - I=1.2</option>
              <option value="2">Groupe 2 - I=1.0</option>
              <option value="3">Groupe 3 - I=0.8</option>
            </select>
          </Field>

          <Field label="Usage (ψ)">
            <select
              value={project.psiCase}
              onChange={(event) => project.setPsiCase(parseInt(event.target.value, 10))}
              className="pp-input pp-select"
            >
              <option value={1}>Habitation, bureaux (ψ = 0.30)</option>
              <option value={2}>Public temporaire - salles, restaurants... (ψ = 0.40)</option>
              <option value={3}>Entrepots, hangars (ψ = 0.50)</option>
              <option value={4}>Archives, bibliotheques, reservoirs (ψ = 1.00)</option>
              <option value={5}>Autres locaux (ψ = 0.60)</option>
            </select>
          </Field>

          <Field label="Type de structure">
            <select
              value={project.structureType}
              onChange={(event) => project.setStructureType(event.target.value)}
              className="pp-input pp-select"
            >
              <option value="acier">Acier</option>
              <option value="beton_arme">Beton arme</option>
              <option value="paf">PAF</option>
              <option value="bois">Bois</option>
              <option value="maconnerie">Maconnerie chainee</option>
            </select>
          </Field>

          <Field label="Elements non structuraux">
            <select
              value={project.nonStructuralType}
              onChange={(event) => project.setNonStructuralType(event.target.value)}
              className="pp-input pp-select"
            >
              <option value="fragile">Fragiles</option>
              <option value="ductile">Ductiles</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="pp-card-section">
        <SectionTitle title="Coefficients et directions" subtitle="Mode d'analyse, facteur QF, coefficient R et systeme CT." />
        <div className="pp-card-stack">
          <Field label="Directions d'analyse (spectre)">
            <div className="pp-button-row pp-button-row--two">
              <ChoiceButton
                active={!seismic.twoDir}
                accent={c.blue}
                onClick={() => seismic.setTwoDir(false)}
              >
                Direction unique
              </ChoiceButton>
              <ChoiceButton
                active={seismic.twoDir}
                accent={c.purple}
                onClick={() => seismic.setTwoDir(true)}
              >
                X et Y separees
              </ChoiceButton>
            </div>
          </Field>

          {!seismic.twoDir ? (
            <div className="pp-field-grid pp-field-grid--two">
              <ActionTrigger
                accent={c.amber}
                title="Facteur qualite QF"
                value={
                  <>
                    Q<sub>F</sub> = <strong>{seismic.QF.toFixed(2)}</strong>
                  </>
                }
                helper="Calcul du facteur de qualite"
                action={
                  <button type="button" className="pp-link-button" onClick={() => onOpenQF('single')}>
                    Calculer
                  </button>
                }
              />

              <ActionTrigger
                accent={c.red}
                title="Coefficient de comportement R"
                value={
                  <>
                    R = <strong>{seismic.R}</strong>
                  </>
                }
                helper={
                  <>
                    Systeme {seismic.selSys} - Cat. Q<sub>F</sub> ({seismic.qfCat})
                  </>
                }
                action={
                  <button type="button" className="pp-link-button" onClick={() => onOpenR('single')}>
                    Identifier
                  </button>
                }
              />
            </div>
          ) : (
            <div className="pp-direction-grid">
              <div className="pp-direction-card" style={{ borderColor: alpha(c.blue, '44') }}>
                <div className="pp-direction-title" style={{ color: c.blue }}>
                  Direction X
                </div>
                <div className="pp-card-stack">
                  <ActionTrigger
                    accent={c.amber}
                    title="Facteur qualite"
                    value={
                      <>
                        Q<sub>Fx</sub> = <strong>{seismic.QFx.toFixed(2)}</strong>
                      </>
                    }
                    action={
                      <button type="button" className="pp-link-button" onClick={() => onOpenQF('x')}>
                        Calculer
                      </button>
                    }
                  />
                  <ActionTrigger
                    accent={c.red}
                    title="Coefficient R"
                    value={
                      <>
                        R<sub>x</sub> = <strong>{seismic.Rx}</strong>
                      </>
                    }
                    helper={
                      <>
                        Systeme {seismic.selSysX} - Cat. Q<sub>F</sub> ({seismic.qfCatX})
                      </>
                    }
                    action={
                      <button type="button" className="pp-link-button" onClick={() => onOpenR('x')}>
                        Identifier
                      </button>
                    }
                  />
                </div>
              </div>
              <div className="pp-direction-card" style={{ borderColor: alpha(c.purple, '44') }}>
                <div className="pp-direction-title" style={{ color: c.purple }}>
                  Direction Y
                </div>
                <div className="pp-card-stack">
                  <ActionTrigger
                    accent={c.amber}
                    title="Facteur qualite"
                    value={
                      <>
                        Q<sub>Fy</sub> = <strong>{seismic.QFy.toFixed(2)}</strong>
                      </>
                    }
                    action={
                      <button type="button" className="pp-link-button" onClick={() => onOpenQF('y')}>
                        Calculer
                      </button>
                    }
                  />
                  <ActionTrigger
                    accent={c.red}
                    title="Coefficient R"
                    value={
                      <>
                        R<sub>y</sub> = <strong>{seismic.Ry}</strong>
                      </>
                    }
                    helper={
                      <>
                        Systeme {seismic.selSysY} - Cat. Q<sub>F</sub> ({seismic.qfCatY})
                      </>
                    }
                    action={
                      <button type="button" className="pp-link-button" onClick={() => onOpenR('y')}>
                        Identifier
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <Field label="Systeme pour periode T (CT)">
            <select
              value={seismic.frameSys}
              onChange={(event) => seismic.setField('frameSys', event.target.value)}
              className="pp-input pp-select"
            >
              {FRAME_SYSTEMS.map((frame) => (
                <option key={frame.v} value={frame.v}>
                  {frame.ct} - {frame.l}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="pp-card-section">
        <SectionTitle title="Geometrie en plan" subtitle="Dimensions en plan et coefficient de frottement." />
        <div className="pp-field-grid pp-field-grid--three">
          <Field label="Lx (m)">
            <input
              type="number"
              value={project.lx || ''}
              min={0}
              step={0.5}
              onChange={(event) => project.setLx(parseFloat(event.target.value) || 0)}
              placeholder="0"
              className="pp-input pp-input--numeric"
            />
          </Field>
          <Field label="Ly (m)">
            <input
              type="number"
              value={project.ly || ''}
              min={0}
              step={0.5}
              onChange={(event) => project.setLy(parseFloat(event.target.value) || 0)}
              placeholder="0"
              className="pp-input pp-input--numeric"
            />
          </Field>
          <Field label="μ (frottement)">
            <input
              type="number"
              value={project.mu}
              min={0}
              max={1}
              step={0.05}
              onChange={(event) => project.setMu(parseFloat(event.target.value) || 0.4)}
              placeholder="0.40"
              className="pp-input pp-input--numeric"
            />
          </Field>
        </div>

        <div className={joinClasses('pp-inline-status', hasPlanGeometry ? 'is-complete' : 'is-attention')}>
          {hasPlanGeometry
            ? 'Lx et Ly sont renseignes pour les controles de renversement et de glissement.'
            : 'Renseigner Lx et Ly pour completer les verifications de renversement et de glissement.'}
        </div>
      </div>
    </CardShell>
  )
}

function GeometryMassesCard({
  c,
  project,
  structural,
  totalW,
  hn,
  storyCount,
  filledStoryCount,
  geometryReady,
}: {
  c: AppColors
  project: ProjectStoreState
  structural: StructuralStoreState
  totalW: number
  hn: number
  storyCount: number
  filledStoryCount: number
  geometryReady: boolean
}) {
  return (
    <CardShell
      c={c}
      title="Geometrie et masses"
      kicker="3 - Niveaux"
      description="Table de niveaux, hauteurs et poids utilises dans les verifications sismiques."
      accent={c.green}
      statusLabel={geometryReady ? 'Complet' : `${filledStoryCount}/${storyCount} lignes completes`}
      statusTone={geometryReady ? 'complete' : 'attention'}
      className="pp-geometry-card"
    >
      <div className="pp-note pp-note--neutral">
        Les valeurs de hauteur et de poids sont lues directement par les modules de calcul.
      </div>

      <div className="pp-table-shell pp-table-shell--stories">
        <div
          className="pp-table-header"
          style={{ gridTemplateColumns: 'minmax(160px, 1.5fr) 92px 110px 40px' }}
        >
          <div>Niveau</div>
          <div>h (m)</div>
          <div>W (kN)</div>
          <div />
        </div>
        <div className="pp-table-scroll">
          {structural.stories.map((story) => (
            <div
              key={story.id}
              className="pp-table-row"
              style={{ gridTemplateColumns: 'minmax(160px, 1.5fr) 92px 110px 40px' }}
            >
              <input
                value={story.name}
                placeholder="Niveau"
                onChange={(event) => structural.updateStory(story.id, 'name', event.target.value)}
                className="pp-input"
              />
              <input
                type="number"
                value={story.elevation}
                min={0}
                step={0.5}
                onChange={(event) => structural.updateStory(story.id, 'elevation', event.target.value)}
                className="pp-input pp-input--numeric"
              />
              <input
                type="number"
                value={story.weight}
                min={0}
                onChange={(event) => structural.updateStory(story.id, 'weight', event.target.value)}
                className="pp-input pp-input--numeric"
                style={{ color: c.green }}
              />
              <button
                type="button"
                onClick={() => structural.removeStory(story.id)}
                disabled={structural.stories.length <= 1}
                className="pp-icon-button"
                aria-label={`Supprimer ${story.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pp-actions-row">
        <button type="button" onClick={() => structural.addStory()} className="pp-primary-button">
          + Ajouter un niveau
        </button>
        <div className="pp-inline-note" style={{ color: c.textMuted }}>
          {project.lx > 0 || project.ly > 0
            ? `Plan saisi: ${project.lx || 0} m x ${project.ly || 0} m`
            : 'Plan non saisi'}
        </div>
      </div>

      <div className="pp-totals-grid">
        <div className="pp-total-card">
          <div className="pp-total-label">Poids total W</div>
          <div className="pp-total-value" style={{ color: c.green }}>
            {totalW.toFixed(0)} kN
          </div>
        </div>
        <div className="pp-total-card">
          <div className="pp-total-label">Hauteur totale h_n</div>
          <div className="pp-total-value" style={{ color: c.purple }}>
            {hn.toFixed(1)} m
          </div>
        </div>
      </div>
    </CardShell>
  )
}

function MetricInputCard({
  accent,
  label,
  value,
  display,
  onChange,
}: {
  accent: string
  label: string
  value: string
  display: string
  onChange: (value: string) => void
}) {
  return (
    <div
      className="pp-metric-card"
      style={
        {
          '--pp-metric-accent': accent,
          '--pp-metric-background': alpha(accent, '10'),
        } as CSSProperties
      }
    >
      <div className="pp-metric-label">{label}</div>
      <div className="pp-metric-display" style={{ color: accent }}>
        {display}
      </div>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        placeholder="—"
        onChange={(event) => onChange(event.target.value)}
        className="pp-input pp-input--numeric"
      />
    </div>
  )
}

function DynamicResultsCard({
  c,
  seismic,
  structural,
  dynamicReady,
  missingDynamic,
}: {
  c: AppColors
  seismic: SeismicStoreState
  structural: StructuralStoreState
  dynamicReady: boolean
  missingDynamic: string[]
}) {
  const metrics = [
    {
      label: 'Periode Tx (s)',
      value: seismic.Tx,
      display: formatMetric(seismic.Tx, 's', 2),
      accent: c.blue,
      onChange: (next: string) => seismic.setField('Tx', next),
    },
    {
      label: 'Periode Ty (s)',
      value: seismic.Ty,
      display: formatMetric(seismic.Ty, 's', 2),
      accent: c.purple,
      onChange: (next: string) => seismic.setField('Ty', next),
    },
    {
      label: 'Effort dyn. Vxd (kN)',
      value: seismic.Vxd,
      display: formatMetric(seismic.Vxd, 'kN', 0),
      accent: c.blue,
      onChange: (next: string) => seismic.setField('Vxd', next),
    },
    {
      label: 'Effort dyn. Vyd (kN)',
      value: seismic.Vyd,
      display: formatMetric(seismic.Vyd, 'kN', 0),
      accent: c.purple,
      onChange: (next: string) => seismic.setField('Vyd', next),
    },
  ]

  return (
    <CardShell
      c={c}
      title="Resultats analyse dynamique"
      kicker="4 - Saisie etat modal"
      description="Periodes, efforts dynamiques et deplacements elastiques importes ou saisis manuellement."
      accent={c.amber}
      statusLabel={dynamicReady ? 'Pret pour verification' : 'Saisie partielle'}
      statusTone={dynamicReady ? 'complete' : 'attention'}
      className="pp-results-card"
    >
      <div className="pp-import-banner">
        <div className="pp-import-dot" />
        <span className="pp-import-copy">Robot / ETABS non connecte - saisie manuelle</span>
        <button type="button" className="pp-disabled-button" disabled>
          Importer
        </button>
      </div>

      <div className={joinClasses('pp-note', dynamicReady ? 'pp-note--positive' : 'pp-note--warning')}>
        {dynamicReady
          ? 'Les periodes, efforts et deplacements requis sont renseignes pour la verification en cours.'
          : `A completer: ${missingDynamic.join(', ')}.`}
      </div>

      <div className="pp-results-body">
        <div className="pp-results-left">
          <SectionTitle title="Metriques principales" subtitle="Valeurs saisies en entree d'analyse dynamique." />
          <div className="pp-metrics-grid">
            {metrics.map((metric) => (
              <MetricInputCard
                key={metric.label}
                accent={metric.accent}
                label={metric.label}
                value={metric.value}
                display={metric.display}
                onChange={metric.onChange}
              />
            ))}
          </div>
        </div>

        <div className="pp-results-right">
          <SectionTitle
            title="Deplacements elastiques δek (cm)"
            subtitle="Une ligne par niveau, avec alignement numerique et en-tete fixe."
          />
          <div className="pp-table-shell pp-table-shell--displacements">
            <div
              className="pp-table-header"
              style={{ gridTemplateColumns: 'minmax(160px, 1.4fr) 120px 120px' }}
            >
              <div>Niveau</div>
              <div>δek,x (cm)</div>
              <div>δek,y (cm)</div>
            </div>
            <div className="pp-table-scroll pp-table-scroll--tall">
              {structural.stories.map((story) => (
                <div
                  key={story.id}
                  className="pp-table-row"
                  style={{ gridTemplateColumns: 'minmax(160px, 1.4fr) 120px 120px' }}
                >
                  <div className="pp-row-title">{story.name}</div>
                  <input
                    type="number"
                    value={story.dek_x || ''}
                    min={0}
                    step="0.01"
                    placeholder="—"
                    onChange={(event) => structural.updateStory(story.id, 'dek_x', event.target.value)}
                    className="pp-input pp-input--numeric"
                    style={{ color: c.blue }}
                  />
                  <input
                    type="number"
                    value={story.dek_y || ''}
                    min={0}
                    step="0.01"
                    placeholder="—"
                    onChange={(event) => structural.updateStory(story.id, 'dek_y', event.target.value)}
                    className="pp-input pp-input--numeric"
                    style={{ color: c.purple }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  )
}

export default function ProjectParams({ c }: ProjectParamsProps) {
  const project = useProjectStore()
  const seismic = useSeismicStore()
  const structural = useStructuralStore()

  const [showQF, setShowQF] = useState<string | null>(null)
  const [showR, setShowR] = useState<string | null>(null)

  useEffect(() => {
    if (project.wilayas.length === 0) {
      project.fetchWilayas()
    }
  }, [])

  const wilaya = project.wilayas.find((entry) => entry.code === project.wilayaCode)
  const hasCommunes = project.communes.length > 0

  function handleQFValidate(qf: number, cat: string, chk: Record<string, boolean>) {
    if (showQF === 'x') {
      seismic.setQFParams({ QFx: qf, qfCatX: cat, qfChkX: chk })
    } else if (showQF === 'y') {
      seismic.setQFParams({ QFy: qf, qfCatY: cat, qfChkY: chk })
    } else {
      seismic.setQFParams({ QF: qf, qfCat: cat, qfChk: chk })
    }
    setShowQF(null)
  }

  function handleRValidate(r: number | undefined, system: BracingSystem | null | undefined) {
    if (showR === 'x') {
      seismic.setRParams({ Rx: r ?? seismic.Rx, selSysX: system?.id ?? 1 })
      seismic.setField('qfCatX', system?.qfCat ?? 'a')
    } else if (showR === 'y') {
      seismic.setRParams({ Ry: r ?? seismic.Ry, selSysY: system?.id ?? 1 })
      seismic.setField('qfCatY', system?.qfCat ?? 'a')
    } else {
      seismic.setRParams({ R: r ?? seismic.R, selSys: system?.id ?? 1 })
      seismic.setField('qfCat', system?.qfCat ?? 'a')
    }
    setShowR(null)
  }

  const totalW = structural.stories.reduce((acc, story) => acc + (parseFloat(story.weight) || 0), 0)
  const hn = structural.stories.length
    ? Math.max(...structural.stories.map((story) => parseFloat(story.elevation) || 0))
    : 0
  const storyCount = structural.stories.length
  const filledStoryCount = structural.stories.filter(
    (story) => story.name.trim() && story.elevation !== '' && story.weight !== '',
  ).length
  const identificationCount = [project.projectName, project.engineer, project.reference].filter(
    (value) => value.trim() !== '',
  ).length
  const hasPlanGeometry = project.lx > 0 && project.ly > 0
  const seismicReady =
    Boolean(project.wilayaCode && project.zone && project.site && project.group && seismic.frameSys) &&
    (!seismic.twoDir
      ? seismic.QF > 0 && seismic.R > 0
      : seismic.QFx > 0 && seismic.QFy > 0 && seismic.Rx > 0 && seismic.Ry > 0)
  const geometryReady = filledStoryCount === storyCount && storyCount > 0 && hasPlanGeometry
  const missingDekX = structural.stories.filter((story) => !story.dek_x).length
  const missingDekY = structural.stories.filter((story) => !story.dek_y).length
  const missingDynamic: string[] = []

  if (!seismic.Tx) missingDynamic.push('Tx')
  if (!seismic.Vxd) missingDynamic.push('Vxd')
  if (seismic.twoDir && !seismic.Ty) missingDynamic.push('Ty')
  if (seismic.twoDir && !seismic.Vyd) missingDynamic.push('Vyd')
  if (missingDekX > 0) missingDynamic.push(`δek,x (${missingDekX} niveau${missingDekX > 1 ? 'x' : ''})`)
  if (seismic.twoDir && missingDekY > 0) {
    missingDynamic.push(`δek,y (${missingDekY} niveau${missingDekY > 1 ? 'x' : ''})`)
  }

  const dynamicReady = missingDynamic.length === 0
  const zoneLabel = ZONE_LABELS[project.zone] || project.zone || 'En attente'
  const analysisMode = seismic.twoDir ? 'X et Y separees' : 'Direction unique'

  const pageVars = {
    '--pp-bg': c.bg,
    '--pp-bg-soft': alpha(c.elevated, '99'),
    '--pp-surface': c.surface,
    '--pp-surface-alt': alpha(c.surface, 'f5'),
    '--pp-elevated': c.elevated,
    '--pp-border': c.border,
    '--pp-border-strong': c.borderLight,
    '--pp-text': c.text,
    '--pp-text-sec': c.textSec,
    '--pp-text-muted': c.textMuted,
    '--pp-blue': c.blue,
    '--pp-green': c.green,
    '--pp-amber': c.amber,
    '--pp-red': c.red,
    '--pp-purple': c.purple,
    '--pp-focus': c.blue,
    '--pp-focus-ring': alpha(c.blue, '22'),
  } as CSSProperties

  return (
    <div className="project-params-page" style={pageVars}>
      {showQF && (
        <QFModal
          c={c}
          initCat={showQF === 'x' ? seismic.qfCatX : showQF === 'y' ? seismic.qfCatY : seismic.qfCat}
          initChecked={
            showQF === 'x' ? seismic.qfChkX : showQF === 'y' ? seismic.qfChkY : seismic.qfChk
          }
          onClose={() => setShowQF(null)}
          onValidate={handleQFValidate}
        />
      )}

      {showR && (
        <RModal
          c={c}
          initSystem={showR === 'x' ? seismic.selSysX : showR === 'y' ? seismic.selSysY : seismic.selSys}
          onClose={() => setShowR(null)}
          onValidate={handleRValidate}
        />
      )}

      <PageHeader />

      <SummaryStrip
        c={c}
        zoneLabel={zoneLabel}
        site={project.site}
        group={project.group}
        analysisMode={analysisMode}
        storyCount={storyCount}
        totalW={totalW}
        hn={hn}
      />

      <div className="pp-dashboard-row">
        <IdentificationCard c={c} project={project} completedCount={identificationCount} />
        <SeismicCard
          c={c}
          project={project}
          seismic={seismic}
          wilayaName={wilaya ? `${wilaya.code} - ${wilaya.name}` : 'Chargement...'}
          wilayaHasSplitZones={Boolean(wilaya?.has_split_zones)}
          hasCommunes={hasCommunes}
          seismicReady={seismicReady}
          hasPlanGeometry={hasPlanGeometry}
          onOpenQF={setShowQF}
          onOpenR={setShowR}
        />
        <GeometryMassesCard
          c={c}
          project={project}
          structural={structural}
          totalW={totalW}
          hn={hn}
          storyCount={storyCount}
          filledStoryCount={filledStoryCount}
          geometryReady={geometryReady}
        />
      </div>

      <DynamicResultsCard
        c={c}
        seismic={seismic}
        structural={structural}
        dynamicReady={dynamicReady}
        missingDynamic={missingDynamic}
      />
    </div>
  )
}
