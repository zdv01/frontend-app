import { Crown, Eye, Target, Zap } from 'lucide-react'

export const SKILL_CATEGORIES = {
  TECNICA: { key: 'TECNICA', label: 'Técnica', tone: 'tecnica', icon: Target },
  FISICA: { key: 'FISICA', label: 'Física', tone: 'fisica', icon: Zap },
  TACTICA: { key: 'TACTICA', label: 'Táctica', tone: 'tactica', icon: Eye },
  MENTAL: { key: 'MENTAL', label: 'Mental', tone: 'mental', icon: Crown },
}

export const SKILL_CATEGORY_LIST = Object.values(SKILL_CATEGORIES)

export function getSkillCategoryMeta(categoria) {
  return (
    SKILL_CATEGORIES[categoria] ?? {
      key: categoria ?? 'OTRA',
      label: categoria ?? 'General',
      tone: 'tecnica',
      icon: Target,
    }
  )
}
