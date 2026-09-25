import { useCallback, useEffect, useState } from 'react'
import type { JourneyNode } from './types'

interface ArchiveState {
  savedSongs: string[]
  savedCities: string[]
  savedStories: string[]
  favoriteGenres: string[]
  recent: string[]
  journey: JourneyNode[]
  events: Record<string, number>
}

const initial: ArchiveState = { savedSongs:[], savedCities:[], savedStories:[], favoriteGenres:[], recent:[], journey:[], events:{} }

export function useArchive() {
  const [archive,setArchive] = useState<ArchiveState>(() => {
    try { return {...initial,...JSON.parse(localStorage.getItem('hear-the-world-archive') || '{}')} }
    catch { return initial }
  })
  useEffect(() => localStorage.setItem('hear-the-world-archive',JSON.stringify(archive)),[archive])
  const toggle = useCallback((key:'savedSongs'|'savedCities'|'savedStories'|'favoriteGenres',id:string) => setArchive(a => ({...a,[key]:a[key].includes(id)?a[key].filter(x=>x!==id):[...a[key],id]})),[])
  const track = useCallback((event:string) => setArchive(a => ({...a,events:{...a.events,[event]:(a.events[event]||0)+1}})),[])
  const visit = useCallback((id:string) => setArchive(a => ({...a,recent:[id,...a.recent.filter(x=>x!==id)].slice(0,8)})),[])
  const addJourney = useCallback((node:JourneyNode) => setArchive(a => ({...a,journey:[...a.journey.filter(x=>x.id!==node.id),node]})),[])
  const clearJourney = useCallback(() => setArchive(a => ({...a,journey:[]})),[])
  return {archive,toggle,track,visit,addJourney,clearJourney}
}
