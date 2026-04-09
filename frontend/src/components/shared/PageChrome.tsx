import type { CSSProperties, ReactNode } from 'react'
import type { AppColors } from '../../types'

type Tone = 'info' | 'success' | 'warning' | 'danger'

export interface BadgeItem {
  label: string
  value: ReactNode
  color?: string
}

export function pageVars(c: AppColors): CSSProperties {
  return {
    '--page-bg': c.bg,
    '--page-bg-soft': `${c.elevated}ee`,
    '--page-surface': c.surface,
    '--page-elevated': c.elevated,
    '--page-border': c.border,
    '--page-border-strong': c.borderLight,
    '--page-text': c.text,
    '--page-text-sec': c.textSec,
    '--page-text-muted': c.textMuted,
    '--page-blue': c.blue,
    '--page-green': c.green,
    '--page-amber': c.amber,
    '--page-red': c.red,
    '--page-purple': c.purple,
  } as CSSProperties
}

export function PageShell({
  c,
  children,
  className = '',
}: {
  c: AppColors
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`page-shell ${className}`.trim()} style={pageVars(c)}>
      {children}
    </div>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string
  title: ReactNode
  description: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="page-hero">
      <div className="page-hero__body">
        <div className="page-hero__eyebrow">{eyebrow}</div>
        <h1 className="page-hero__title">{title}</h1>
        <div className="page-hero__description">{description}</div>
      </div>
      {aside ? <div className="page-hero__aside">{aside}</div> : null}
    </header>
  )
}

export function BadgeStrip({ items }: { items: BadgeItem[] }) {
  return (
    <div className="page-badge-strip">
      {items.map((item) => (
        <div
          key={item.label}
          className="page-badge"
          style={{ '--page-badge-color': item.color ?? 'var(--page-text)' } as CSSProperties}
        >
          <span className="page-badge__label">{item.label}</span>
          <span className="page-badge__value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function StateBanner({
  tone,
  children,
}: {
  tone: Tone
  children: ReactNode
}) {
  return <div className={`page-banner page-banner--${tone}`}>{children}</div>
}

export function SurfacePanel({
  eyebrow,
  title,
  action,
  children,
  flushTop = false,
}: {
  eyebrow?: string
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  flushTop?: boolean
}) {
  return (
    <section className="surface-panel">
      {(eyebrow || title || action) && (
        <div className="surface-panel__header">
          <div>
            {eyebrow ? <div className="surface-panel__eyebrow">{eyebrow}</div> : null}
            {title ? <h2 className="surface-panel__title">{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      <div className={`surface-panel__body ${flushTop ? 'surface-panel__body--flush-top' : ''}`}>
        {children}
      </div>
    </section>
  )
}
