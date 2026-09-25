export type VideoType = 'OFFICIAL VIDEO' | 'LIVE PERFORMANCE' | 'ARCHIVE FOOTAGE' | 'LYRIC VIDEO' | 'INTERVIEW'

export interface TimeTravelDestination {
  id: string
  sourceId: string
  destinationType: 'city' | 'song' | 'genre' | 'story'
  destinationId: string
  city: string
  country: string
  year: number
  connectionType: string
  connectionExplanation: string
}

export interface SongStory {
  id: string
  title: string
  artist: string
  year: number
  country: string
  genre: string
  summary: string
  themes: string[]
  historicalContext: string
  culturalContext: string
  sound: string
  impact: string
  then: string
  now: string
  spotifyUrl?: string
  spotifyUri?: string
  youtubeVideoId?: string
  youtubeUrl?: string
  videoType?: VideoType
  videoTitle?: string
  videoSourceLabel?: string
  sources: string[]
  relatedTimeTravelDestinations: TimeTravelDestination[]
}

export interface CityMoment {
  id: string
  city: string
  country: string
  year: number
  summary: string
  genres: string[]
  artists: string[]
  songs: string[]
  youthCulture: string
  politicalContext: string
  censorshipContext: string
  culturalMood: string
  mediaAccess: string
  image?: string
  sources: string[]
}

export interface JourneyNode {
  id: string
  city: string
  year: number
  label: string
  reason: string
}

export interface CatalogSong extends SongStory {
  city: string
  decade: number
  artistContext: string
  lyricsMeaning: string
  politicalMoment: string
  archiveLabel: string
  accent: 'red' | 'blue' | 'olive' | 'orange' | 'cream'
  rollingStoneRank?: number
}
