export interface NavItem {
  id: string
  label: string
  icon: string
  ready: boolean
}

export interface NavGroup {
  section: string
  items: NavItem[]
}

export const PROJECT_REQUIRED = new Set(['params', 'spectrum', 'combinations', 'verification'])

export const NAV_GROUPS: NavGroup[] = [
  {
    section: 'G\u00e9n\u00e9ral',
    items: [
      { id: 'projects', label: 'Projets', icon: '\u25a6', ready: true },
      { id: 'params', label: 'Param\u00e8tres g\u00e9n\u00e9raux', icon: '\u2699', ready: true },
    ],
  },
  {
    section: 'Sismique - RPA 2024',
    items: [
      { id: 'spectrum', label: 'Spectre de r\u00e9ponse', icon: '\u223f', ready: true },
      { id: 'combinations', label: 'Combinaisons', icon: '\u2a01', ready: true },
      { id: 'verification', label: 'V\u00e9rification sismique', icon: '\u2714', ready: true },
    ],
  },
  {
    section: 'Ferraillage BA',
    items: [
      { id: 'beams', label: 'Poutres - CBA93', icon: '\u2500', ready: false },
      { id: 'columns', label: 'Poteaux - CBA93', icon: '\u2502', ready: false },
      { id: 'walls', label: 'Voiles - CBA93', icon: '\u2588', ready: false },
    ],
  },
  {
    section: 'Connecteurs',
    items: [
      { id: 'robot', label: 'Robot Structural', icon: '\u2b82', ready: false },
      { id: 'etabs', label: 'ETABS', icon: '\u2b82', ready: false },
    ],
  },
]

export const PAGE_META: Record<string, { eyebrow: string; title: string; description: string }> = {
  projects: {
    eyebrow: 'Pilotage projet',
    title: 'Tableau de bord projet',
    description: 'Centralisez vos \u00e9tudes, reprenez rapidement un projet et s\u00e9curisez la sauvegarde.',
  },
  params: {
    eyebrow: 'Entr\u00e9es globales',
    title: 'Param\u00e8tres g\u00e9n\u00e9raux',
    description: 'Rassemblez les donn\u00e9es principales du projet avant les v\u00e9rifications et calculs sismiques.',
  },
  spectrum: {
    eyebrow: 'Analyse spectrale',
    title: 'Spectre de r\u00e9ponse',
    description: 'Contr\u00f4lez les param\u00e8tres RPA 2024 et visualisez les courbes horizontales et verticales.',
  },
  combinations: {
    eyebrow: 'Charges sismiques',
    title: 'Combinaisons sismiques',
    description: 'V\u00e9rifiez rapidement les combinaisons actives et la pr\u00e9sence \u00e9ventuelle de la composante verticale.',
  },
  verification: {
    eyebrow: 'Contr\u00f4les r\u00e9glementaires',
    title: 'V\u00e9rification sismique',
    description: "Passez de l'effort tranchant aux contr\u00f4les de stabilit\u00e9 sans quitter le flux principal.",
  },
  default: {
    eyebrow: 'Module',
    title: 'Module en pr\u00e9paration',
    description: "Cette zone est r\u00e9serv\u00e9e \u00e0 une \u00e9tape produit encore en d\u00e9veloppement.",
  },
}
