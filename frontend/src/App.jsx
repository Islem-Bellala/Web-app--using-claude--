/**
 * StructCalc — Main Application (Session 9b)
 *
 * Bug fix: sidebar footer (night mode button) was hidden because
 * zoom:1.08 on the aside made content 8% taller than 100vh.
 * Fix: aside height = calc(100vh / 1.08) so everything fits.
 */

import { useState } from 'react'
import SpectrumChart  from './components/seismic/SpectrumChart.jsx'
import BaseShearPage  from './components/seismic/BaseShearPage.jsx'
import ProjectParams  from './components/general/ProjectParams.jsx'

const DARK = {
  bg:'#020817', surface:'#0a1628', elevated:'#0f172a',
  border:'#1e293b', borderLight:'#475569',
  text:'#f1f5f9', textSec:'#cbd5e1', textMuted:'#94a3b8',
  blue:'#60a5fa', green:'#34d399', amber:'#fbbf24',
  red:'#f87171', purple:'#c4b5fd',
}
const LIGHT = {
  bg:'#f8fafc', surface:'#ffffff', elevated:'#f1f5f9',
  border:'#e2e8f0', borderLight:'#cbd5e1',
  text:'#0f172a', textSec:'#475569', textMuted:'#94a3b8',
  blue:'#2563eb', green:'#059669', amber:'#d97706',
  red:'#dc2626', purple:'#7c3aed',
}

const NAV = [
  {
    section: 'Général',
    items: [{ id:'params', label:'Paramètres généraux', icon:'⚙️', ready:true }]
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

const today = new Date().toISOString().split('T')[0]

export const DEFAULT_PARAMS = {
  projectName:'', engineer:'', reference:'', date:today,
  wilayaCode:'09', commune:'', zone:'VI',
  site:'S2', group:'2',
  twoDir:false,
  QF:1.0, R:4.5, selSys:1, qfCat:'a',
  qfChk:{a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true},
  QFx:1.0, Rx:4.5, selSysX:1, qfCatX:'a',
  QFy:1.0, Ry:4.5, selSysY:1, qfCatY:'a',
  qfChkX:{a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true},
  qfChkY:{a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true},
  frameSys:'ba_with_infill',
  stories:[
    {id:1,name:'RDC',    elevation:'3.0', weight:'1200',drx:'',dry:''},
    {id:2,name:'Etage 1',elevation:'6.0', weight:'1100',drx:'',dry:''},
    {id:3,name:'Etage 2',elevation:'9.0', weight:'1100',drx:'',dry:''},
    {id:4,name:'Etage 3',elevation:'12.0',weight:'900', drx:'',dry:''},
  ],
  Tx:'', Ty:'', Vxd:'', Vyd:'',
}

const SIDEBAR_ZOOM    = 1.08
const SIDEBAR_W_CSS   = 220   // logical px inside the zoom
// Effective screen width = 220 * 1.08 ≈ 238px — used for margin-left
const SIDEBAR_W_SCREEN = Math.round(220 * SIDEBAR_ZOOM)

function Sidebar({ activePage, onNavigate, c, isDark, onToggleTheme, isOpen, onToggle }) {
  return (
    <>
      <aside style={{
        width:        SIDEBAR_W_CSS,
        zoom:         SIDEBAR_ZOOM,
        // KEY FIX: divide 100vh by zoom so the content fits exactly in the viewport.
        // Without this, zoom:1.08 makes the aside 8% taller than the screen,
        // pushing the footer (night mode button) out of view.
        height:       `calc(100vh / ${SIDEBAR_ZOOM})`,
        position:     'fixed',
        top:          0,
        left:         isOpen ? 0 : -SIDEBAR_W_CSS * 1.15,
        background:   c.surface,
        borderRight:  `1px solid ${c.border}`,
        display:      'flex',
        flexDirection:'column',
        zIndex:       200,
        transition:   'left 0.22s ease',
        overflow:     'hidden',
      }}>
        {/* Logo row + close button */}
        <div style={{
          padding:'18px 18px 14px',
          borderBottom:`1px solid ${c.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexShrink:0,
        }}>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:c.text,letterSpacing:'-0.02em'}}>
              StructCalc
            </div>
            <div style={{fontSize:10,color:c.textMuted,marginTop:2}}>
              RPA 2024 · CBA93 · BAEL91
            </div>
          </div>
          <button type="button" onClick={onToggle} style={{
            background:'none',border:'none',color:c.textMuted,
            fontSize:18,cursor:'pointer',padding:4,lineHeight:1,
          }}>✕</button>
        </div>

        {/* Nav */}
        <nav style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
          {NAV.map(group => (
            <div key={group.section} style={{marginBottom:6}}>
              <div style={{
                fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',
                color:c.textMuted,padding:'10px 18px 5px',
              }}>
                {group.section}
              </div>
              {group.items.map(item => {
                const isActive = item.id === activePage
                return (
                  <button type="button" key={item.id}
                    onClick={() => item.ready && onNavigate(item.id)}
                    style={{
                      width:'100%',display:'flex',alignItems:'center',
                      gap:9,padding:'8px 18px',
                      background:isActive?(isDark?'#1e3a5f':'#dbeafe'):'transparent',
                      border:'none',
                      borderLeft:isActive?`2px solid ${c.blue}`:'2px solid transparent',
                      color:item.ready?(isActive?c.blue:c.textSec):c.textMuted,
                      cursor:item.ready?'pointer':'default',
                      fontSize:13,textAlign:'left',
                    }}>
                    <span style={{fontSize:14}}>{item.icon}</span>
                    <span style={{flex:1}}>{item.label}</span>
                    {!item.ready&&(
                      <span style={{
                        fontSize:9,background:c.elevated,
                        color:c.textMuted,borderRadius:4,padding:'2px 5px',
                      }}>BIENTÔT</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer — theme toggle + version — always visible thanks to height fix */}
        <div style={{
          padding:'12px 18px',
          borderTop:`1px solid ${c.border}`,
          display:'flex',alignItems:'center',justifyContent:'space-between',
          flexShrink:0,
        }}>
          <span style={{fontSize:11,color:c.textMuted}}>v0.1.0</span>
          <button type="button" onClick={onToggleTheme} style={{
            background:c.elevated,border:`1px solid ${c.border}`,
            borderRadius:7,padding:'5px 10px',cursor:'pointer',
            color:c.textSec,fontSize:12,
          }}>
            {isDark?'☀️ Clair':'🌙 Sombre'}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen&&(
        <div onClick={onToggle} style={{
          position:'fixed',inset:0,
          background:'rgba(0,0,0,0.45)',
          zIndex:199,
          display: window.innerWidth>768?'none':'block',
        }}/>
      )}
    </>
  )
}

function ComingSoon({ c }) {
  return (
    <div style={{
      display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'center',height:'100%',gap:14,color:c.textMuted,
    }}>
      <div style={{fontSize:44}}>🚧</div>
      <div style={{fontSize:17,color:c.textSec,fontWeight:600}}>En développement</div>
      <div style={{fontSize:13}}>Session prochaine</div>
    </div>
  )
}

export default function App() {
  const [isDark,      setIsDark]      = useState(true)
  const [activePage,  setActivePage]  = useState('params')
  const [params,      setParams]      = useState(DEFAULT_PARAMS)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const c = isDark ? DARK : LIGHT

  function renderPage() {
    switch (activePage) {
      case 'params':     return <ProjectParams params={params} setParams={setParams} c={c}/>
      case 'spectrum':   return <SpectrumChart  params={params} c={c} isDark={isDark}/>
      case 'base_shear': return <BaseShearPage  params={params} c={c}/>
      default:           return <ComingSoon c={c}/>
    }
  }

  return (
    <div style={{display:'flex',minHeight:'100vh',background:c.bg}}>
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        c={c} isDark={isDark}
        onToggleTheme={() => setIsDark(d=>!d)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(o=>!o)}
      />

      <div style={{
        flex:1,
        marginLeft: sidebarOpen ? SIDEBAR_W_SCREEN : 0,
        transition:'margin-left 0.22s ease',
        minHeight:'100vh',
      }}>
        {/* Sticky top bar with hamburger */}
        <div style={{
          position:'sticky',top:0,zIndex:100,
          background:c.surface,borderBottom:`1px solid ${c.border}`,
          padding:'0 16px',height:44,
          display:'flex',alignItems:'center',gap:12,
        }}>
          <button type="button" onClick={() => setSidebarOpen(o=>!o)} style={{
            background:'none',border:'none',cursor:'pointer',
            color:c.textSec,padding:4,
            display:'flex',flexDirection:'column',gap:4,alignItems:'center',
          }}>
            {[0,1,2].map(i=>(
              <span key={i} style={{
                display:'block',width:20,height:2,
                background:c.textSec,borderRadius:2,
              }}/>
            ))}
          </button>
          <span style={{fontSize:13,color:c.textMuted,fontWeight:500}}>StructCalc</span>
        </div>

        {/* Page content — zoom 1.35 */}
        <div style={{zoom:1.35, minHeight:'calc(100vh - 44px)'}}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
