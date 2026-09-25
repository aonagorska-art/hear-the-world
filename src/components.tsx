import { useEffect, useState } from 'react'
import type { CityMoment, JourneyNode, SongStory, TimeTravelDestination } from './types'

const artworkCache = new Map<string,string>()
const previewCache = new Map<string,string>()

export function AlbumCover({artist,title,className='',fallbackUrl}:{artist:string;title:string;className?:string;fallbackUrl?:string}) {
  const key=`${artist} ${title}`
  const [artwork,setArtwork]=useState(artworkCache.get(key)||'')
  useEffect(()=>{
    if(artworkCache.has(key)) return
    let active=true
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(key)}&entity=song&limit=1`)
      .then(response=>response.ok?response.json():Promise.reject())
      .then(data=>{
        const small=data.results?.[0]?.artworkUrl100
        if(!small||!active) {
          if(active&&fallbackUrl) setArtwork(fallbackUrl)
          return
        }
        const large=small.replace(/100x100bb/, '600x600bb')
        artworkCache.set(key,large)
        setArtwork(large)
      }).catch(()=>active&&fallbackUrl&&setArtwork(fallbackUrl))
    return()=>{active=false}
  },[key,fallbackUrl])
  return <span className={`album-art ${className}`} aria-label={`Cover artwork for ${title}`}>
    {artwork?<img src={artwork} alt={`${title} by ${artist} cover artwork`} loading="lazy" onError={()=>artwork!==fallbackUrl&&fallbackUrl?setArtwork(fallbackUrl):setArtwork('')}/>:<span className="album-art-fallback"><i>HTW</i><b>{title.slice(0,1)}</b><small>{artist}</small></span>}
  </span>
}

export function AudioPreview({artist,title,onPlay}:{artist:string;title:string;onPlay?:()=>void}) {
  const key=`${artist} ${title}`
  const [preview,setPreview]=useState(previewCache.get(key)||'')
  const [checked,setChecked]=useState(previewCache.has(key))
  useEffect(()=>{
    if(previewCache.has(key)) return
    let active=true
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(key)}&entity=song&limit=1`)
      .then(response=>response.ok?response.json():Promise.reject())
      .then(data=>{
        if(!active) return
        const url=data.results?.[0]?.previewUrl||''
        previewCache.set(key,url)
        setPreview(url)
        setChecked(true)
      }).catch(()=>active&&setChecked(true))
    return()=>{active=false}
  },[key])
  if(!checked) return <div className="preview-loading">Finding audio preview…</div>
  if(!preview) return <p className="preview-unavailable">Audio preview unavailable for this recording.</p>
  return <div className="audio-preview"><audio controls preload="none" src={preview} onPlay={onPlay}/><small>30-second preview · Apple Music catalogue</small></div>
}

export function SaveButton({active,onClick,label='Save'}:{active:boolean;onClick:()=>void;label?:string}) {
  return <button className={`save-button ${active?'saved':''}`} onClick={onClick} aria-pressed={active}><span>{active?'♥':'♡'}</span>{active?'Saved':label}</button>
}

export function SpotifyEmbed({spotifyUri,spotifyUrl,title,artist,onInteract}:{spotifyUri?:string;spotifyUrl?:string;title:string;artist:string;onInteract?:()=>void}) {
  const id = spotifyUri?.split(':').pop() || spotifyUrl?.split('/track/')[1]?.split('?')[0]
  if (!id) return <div className="media-fallback"><span>SPOTIFY UNAVAILABLE</span><h3>{title}</h3><p>Playback is unavailable here for this track.</p>{spotifyUrl&&<a href={spotifyUrl} target="_blank" rel="noreferrer">Open in Spotify ↗</a>}</div>
  return <div className="spotify-embed"><iframe title={`Listen to ${title} by ${artist} on Spotify`} src={`https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`} width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" onLoad={onInteract}/><a className="media-external" href={spotifyUrl} target="_blank" rel="noreferrer">Open in Spotify ↗</a></div>
}

export function YouTubeVideoPlayer({videoId,title,artist,youtubeUrl,videoType,onPlay}:{videoId?:string;title:string;artist:string;youtubeUrl?:string;videoType?:string;responsive?:boolean;onPlay?:()=>void}) {
  const [started,setStarted] = useState(false)
  if (!videoId) return <div className="media-fallback video-fallback"><span>VIDEO UNAVAILABLE</span><h3>{title}</h3><p>No embeddable video is available for this story.</p>{youtubeUrl&&<a href={youtubeUrl} target="_blank" rel="noreferrer">Watch on YouTube ↗</a>}</div>
  return <div><div className="video-label"><span>{videoType || 'VIDEO'}</span><span>{artist}</span></div><div className="video-frame">{!started?<button className="video-poster" onClick={()=>{setStarted(true);onPlay?.()}} aria-label={`Play ${title} by ${artist}`}><img src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`} alt=""/><span className="play">▶</span><span className="play-copy">Play video</span></button>:<iframe title={`${title} by ${artist}`} src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>}</div><a className="media-external" href={youtubeUrl} target="_blank" rel="noreferrer">Watch on YouTube ↗</a></div>
}

export function SongMediaPanel({song,onEvent}:{song:SongStory;onEvent:(event:string)=>void}) {
  return <div className="media-panel"><section><div className="media-heading"><span>01</span><h2>Listen on Spotify</h2></div><SpotifyEmbed {...song} onInteract={()=>onEvent('spotify_embed_opened')}/></section><section><div className="media-heading"><span>02</span><h2>Watch the video</h2></div><YouTubeVideoPlayer videoId={song.youtubeVideoId} title={song.videoTitle || song.title} artist={song.artist} youtubeUrl={song.youtubeUrl} videoType={song.videoType} onPlay={()=>onEvent('youtube_video_started')}/></section></div>
}

export function TimeTravelCard({destination,onTravel,onWhy}:{destination:TimeTravelDestination;onTravel:()=>void;onWhy?:()=>void}) {
  const [why,setWhy] = useState(false)
  return <article className="travel-card"><div className="travel-card-top"><span>DESTINATION</span><span>{destination.connectionType}</span></div><p className="travel-year">{destination.year}</p><h3>{destination.city}</h3><p className="travel-country">{destination.country}</p><p>{destination.connectionExplanation}</p><button className="text-button" onClick={()=>{setWhy(!why);onWhy?.()}}>Why am I seeing this?</button>{why&&<p className="why-copy">Recommended because these scenes share a meaningful cultural or political bridge—not merely a similar sound.</p>}<button className="button primary" onClick={onTravel}>Travel There <span>→</span></button></article>
}

export function TimeTravelPath({nodes,onRevisit,emptyCopy='You have not started time travelling yet.'}:{nodes:JourneyNode[];onRevisit?:(node:JourneyNode)=>void;emptyCopy?:string}) {
  if(!nodes.length) return <div className="empty-state"><span>YOUR JOURNEY</span><p>{emptyCopy}</p></div>
  return <div className="journey-path">{nodes.map((node,i)=><div className="journey-node-wrap" key={node.id}>{i>0&&<span className="journey-arrow">→</span>}<button className="journey-node" onClick={()=>onRevisit?.(node)}><span>{node.year}</span><strong>{node.city}</strong><small>{node.label}</small><em>{node.reason}</em></button></div>)}</div>
}

export function CityCard({city,onOpen,onSave,saved}:{city:CityMoment;onOpen:()=>void;onSave:()=>void;saved:boolean}) {
  return <article className="city-card"><div><span>{city.year}</span><button onClick={onSave} aria-label={`Save ${city.city}`}>{saved?'♥':'♡'}</button></div><p>{city.country}</p><h3>{city.city}</h3><p>{city.summary}</p><p className="genre-line">{city.genres.join(' · ')}</p><button className="text-link" onClick={onOpen}>Enter the city →</button></article>
}

export function CulturalDecoder({song}:{song:SongStory}) {
  const items=[['LANGUAGE','The central image is simple enough to travel across languages, while its ambiguity leaves room for personal and political readings.'],['HISTORY',song.historicalContext],['POLITICS','Division is present as lived geography rather than a slogan. The song’s later political symbolism grew through public memory.'],['CULTURE',song.culturalContext],['SOCIAL CONTEXT','West Berlin offered unusual artistic freedom inside a city still shaped by Cold War separation.'],['SYMBOLISM','The wall, the kiss and the temporary “we” have become symbols of intimacy surviving systems built to divide.']]
  return <div className="decoder-grid">{items.map(([k,v])=><div key={k}><span>{k}</span><p>{v}</p></div>)}</div>
}

export function DiscoveryGraph({onNode}:{onNode:(id:string)=>void}) {
  const nodes=[{id:'london-1977',label:'LONDON',year:'1977',x:13,y:38,c:'red'},{id:'punk',label:'PUNK',year:'MOVEMENT',x:36,y:20,c:'cream'},{id:'warsaw-1981',label:'WARSAW',year:'1982',x:54,y:46,c:'orange'},{id:'berlin-1989',label:'BERLIN',year:'1985',x:72,y:20,c:'blue'},{id:'moscow-1991',label:'MOSCOW',year:'1988',x:88,y:55,c:'olive'}]
  return <div className="graph" role="group" aria-label="How punk travelled across Europe"><svg viewBox="0 0 100 70" aria-hidden="true"><path d="M13 38 Q24 18 36 20 T54 46 T72 20 T88 55"/><path className="graph-dash" d="M13 38 L54 46 L88 55"/></svg>{nodes.map(n=><button key={n.id} className={`graph-node ${n.c}`} style={{left:`${n.x}%`,top:`${n.y}%`}} onClick={()=>onNode(n.id)}><span>{n.year}</span><strong>{n.label}</strong></button>)}<div className="graph-legend"><span>— INFLUENCED / ADAPTED BY</span><span>--- SHARED POLITICAL CONTEXT</span></div></div>
}
