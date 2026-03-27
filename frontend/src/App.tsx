/**
 * StructCalc — Main Application (Phase 3)
 * App.tsx is now layout + routing only.
 * All state lives in Zustand stores.
 */

import { useEffect } from 'react'
import SpectrumChart from './components/seismic/SpectrumChart'
import BaseShearPage from './components/seismic/BaseShearPage'
import ProjectParams from './components/general/ProjectParams'
import ProjectList from './components/general/ProjectList'
import LoginPage from './components/auth/LoginPage'
import type { AppColors } from './types'
import { useUIStore, useAuthStore, useProjectStore } from './stores'

const DARK: AppColors = {
  bg:'#020817', surface:'#0a1628', elevated:'#0f172a',
  border:'#1e293b', borderLight:'#475569',
  text:'#f1f5f9', textSec:'#cbd5e1', textMuted:'#94a3b8',
  blue:'#60a5fa', green:'#34d399', amber:'#fbbf24',
  red:'#f87171', purple:'#c4b5fd',
}
const LIGHT: AppColors = {
  bg:'#f8fafc', surface:'#ffffff', elevated:'#f1f5f9',
  border:'#e2e8f0', borderLight:'#cbd5e1',
  text:'#0f172a', textSec:'#475569', textMuted:'#94a3b8',
  blue:'#2563eb', green:'#059669', amber:'#d97706',
  red:'#dc2626', purple:'#7c3aed',
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  ready: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: 'Général',
    items: [
      { id:'projects', label:'Projets',            icon:'📁', ready:true },
      { id:'params',   label:'Paramètres généraux', icon:'⚙️', ready:true },
    ]
  },
  {
    section: 'Sismique — RPA 2024',
    items: [
      { id:'spectrum',     label:'Spectre de réponse', icon:'📈', ready:true  },
      { id:'base_shear',   label:'Effort tranchant V', icon:'⚡', ready:true  },
      { id:'combinations', label:'Combinaisons',        icon:'🔗', ready:false },
    ]
  },
  {
    section: 'Ferraillage BA',
    items: [
      { id:'beams',   label:'Poutres — CBA93',  icon:'🏗️', ready:false },
      { id:'columns', label:'Poteaux — CBA93',  icon:'🏛️', ready:false },
      { id:'walls',   label:'Voiles — CBA93',   icon:'🧱', ready:false },
    ]
  },
  {
    section: 'Connexion',
    items: [
      { id:'robot', label:'Robot Structural', icon:'🔌', ready:false },
      { id:'etabs', label:'ETABS',            icon:'🔌', ready:false },
    ]
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarProps {
  activePage: string;
  onNavigate: (id: string) => void;
  c: AppColors;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

function Sidebar({ activePage, onNavigate, c, isDark, onToggleTheme, onLogout }: SidebarProps) {
  return (
    <aside style={{
      width:220, flexShrink:0,
      background:c.surface,
      borderRight:`1px solid ${c.border}`,
      display:'flex', flexDirection:'column',
      height:'100vh', overflow:'hidden',
      transition:'background 0.2s, border-color 0.2s',
    }}>
      <div style={{ padding:'22px 18px 16px', borderBottom:`1px solid ${c.border}` }}>
        <div style={{ fontSize:19, fontWeight:700, color:c.text, letterSpacing:'-0.02em' }}>
          StructCalc
        </div>
        <div style={{ fontSize:11, color:c.textMuted, marginTop:3 }}>
          RPA 2024 · CBA93 · BAEL91
        </div>
      </div>

      <nav style={{ flex:1, overflowY:'auto', padding:'10px 0' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom:6 }}>
            <div style={{
              fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase',
              color:c.textMuted, padding:'10px 18px 5px',
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const isActive = item.id === activePage
              return (
                <button type="button" key={item.id}
                  onClick={() => item.ready && onNavigate(item.id)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center',
                    gap:9, padding:'8px 18px',
                    background: isActive ? (isDark ? '#1e3a5f' : '#dbeafe') : 'transparent',
                    border:'none',
                    borderLeft: isActive ? `2px solid ${c.blue}` : '2px solid transparent',
                    color: item.ready ? (isActive ? c.blue : c.textSec) : c.textMuted,
                    cursor: item.ready ? 'pointer' : 'default',
                    fontSize:13, textAlign:'left',
                  }}>
                  <span style={{ fontSize:14 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {!item.ready && (
                    <span style={{
                      fontSize:9, background:c.elevated,
                      color:c.textMuted, borderRadius:4, padding:'2px 5px',
                    }}>
                      BIENTÔT
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{
        padding:'12px 18px', borderTop:`1px solid ${c.border}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <button type="button" onClick={onLogout} style={{
          background:'none', border:'none', color:c.textMuted,
          cursor:'pointer', fontSize:12, padding:0,
        }}>
          Déconnexion
        </button>
        <button type="button" onClick={onToggleTheme} style={{
          background:c.elevated, border:`1px solid ${c.border}`,
          borderRadius:7, padding:'5px 10px', cursor:'pointer',
          color:c.textSec, fontSize:12,
        }}>
          {isDark ? '☀️ Clair' : '🌙 Sombre'}
        </button>
      </div>
    </aside>
  )
}

function ComingSoon({ c }: { c: AppColors }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', height:'100%', gap:14, color:c.textMuted,
    }}>
      <div style={{ fontSize:44 }}>🚧</div>
      <div style={{ fontSize:17, color:c.textSec, fontWeight:600 }}>En développement</div>
      <div style={{ fontSize:13 }}>Session prochaine</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP — layout + routing only
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const { theme, activePage, setActivePage, toggleTheme } = useUIStore()
  const { isAuthenticated, isLoading, checkAuth, logout } = useAuthStore()
  const { currentProjectId, currentProjectName, isSaving, saveCurrentProject } = useProjectStore()

  const isDark = theme === 'dark'
  const c: AppColors = isDark ? DARK : LIGHT

  // On mount: restore session from localStorage
  useEffect(() => { checkAuth() }, [])

  function renderPage() {
    switch (activePage) {
      case 'projects':   return <ProjectList   c={c} />
      case 'params':     return <ProjectParams c={c} />
      case 'spectrum':   return <SpectrumChart  c={c} isDark={isDark} />
      case 'base_shear': return <BaseShearPage  c={c} />
      default:           return <ComingSoon c={c} />
    }
  }

  // ── Auth gate ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:c.bg }}>
        <span style={{ color:c.textMuted, fontSize:14 }}>Chargement…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage c={c} isDark={isDark} />
  }

  // ── Authenticated app shell ───────────────────────────────────────────────

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:c.bg }}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        c={c}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      />
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:c.bg, transition:'background 0.2s' }}>
        {/* Save bar — only when a project is open */}
        {currentProjectId && (
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'6px 20px', borderBottom:`1px solid ${c.border}`,
            background:c.surface, flexShrink:0,
          }}>
            <span style={{ fontSize:12, color:c.textMuted }}>
              Projet : <strong style={{ color:c.text }}>{currentProjectName}</strong>
            </span>
            <button type="button" onClick={saveCurrentProject} disabled={isSaving} style={{
              background: isSaving ? c.borderLight : c.green,
              border:'none', borderRadius:6, padding:'4px 12px',
              color:'#fff', fontSize:12, fontWeight:600,
              cursor: isSaving ? 'default' : 'pointer',
            }}>
              {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        )}
        <div style={{ flex:1, overflowY:'auto' }}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
