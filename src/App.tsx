import { useEffect, useMemo, useRef, useState } from 'react'
import { AlbumCover, AudioPreview, SaveButton, YouTubeVideoPlayer } from './components'
import { rollingStoneCatalog } from './data'
import { rollingStone500, type RankedSong } from './rollingStone500'
import { useArchive } from './useArchive'
import type { CatalogSong } from './types'

type Route={page:'catalog'}|{page:'song';id:string}|{page:'saved'}
const listUrl='https://au.rollingstone.com/music/music-lists/best-songs-of-all-time-30065/'
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'')
const richFor=(song:RankedSong)=>rollingStoneCatalog.find(item=>normalize(item.title)===normalize(song.title)&&normalize(item.artist).includes(normalize(song.artist).slice(0,8)))
const spotifySearch=(song:RankedSong)=>`https://open.spotify.com/search/${encodeURIComponent(`${song.artist} ${song.title}`)}`
const youtubeSearch=(song:RankedSong)=>`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title} official`)}`
const songByTitle=(title:string)=>rollingStone500.find(song=>normalize(song.title)===normalize(title))||rollingStone500[0]
const songHook=(song:RankedSong)=>{
  const rich=richFor(song)
  if(rich) return rich.summary
  const era=(song.year||0)<1960?'before pop had settled into its rules':(song.year||0)<1980?'while popular music was becoming a public argument':(song.year||0)<2000?'as sound, image and identity collided':'in an era when every song could travel instantly'
  return `${song.year||'An unknown year'} · ${song.artist}. A record made ${era}. What did listeners hear that we might miss now?`
}
const curatedJourneys=[
  {id:'protest',eyebrow:'POWER · 6 SONGS',title:'Songs That Became Protest',description:'From private grief to language a crowd could carry.',titles:['Fight the Power','A Change Is Gonna Come','Mississippi Goddam','What’s Going On','Alright','Formation']},
  {id:'voices',eyebrow:'VOICE · 6 SONGS',title:'Women Who Changed the Rules',description:'Songs that redrew who could demand, desire and define.',titles:['Respect','Strange Fruit','Like a Prayer','Formation','Fast Car','I Will Survive']},
  {id:'systems',eyebrow:'CONTROL · 6 SONGS',title:'Songs the World Couldn’t Contain',description:'Censorship, class, policing and the thrill of refusing permission.',titles:['The Message','London Calling','God Save the Queen','Get Up, Stand Up','People Get Ready','Fight the Power']}
]
const moodDoors=[
  {label:'I need courage',titles:['Alright','A Change Is Gonna Come','Get Up, Stand Up']},
  {label:'I want to question power',titles:['Fight the Power','The Message','God Save the Queen']},
  {label:'I want a hidden story',titles:['Born in the U.S.A.','Strange Fruit','Heroes']}
]
const resolveSong=(id:string)=>{
  const ranked=rollingStone500.find(song=>String(song.rank)===id)
  if(ranked) return ranked
  const legacy=rollingStoneCatalog.find(song=>song.id===id)
  if(!legacy) return rollingStone500[0]
  return rollingStone500.find(song=>normalize(song.title)===normalize(legacy.title)&&normalize(song.artist).includes(normalize(legacy.artist).slice(0,8)))||rollingStone500[0]
}

function readRoute():Route{
  if(location.pathname.startsWith('/song/')) return {page:'song',id:location.pathname.split('/')[2]}
  if(location.pathname==='/saved') return {page:'saved'}
  return {page:'catalog'}
}

export default function App(){
  const [route,setRoute]=useState<Route>(()=>readRoute())
  const {archive,toggle,track,visit}=useArchive()
  const navigate=(path:string)=>{history.pushState({},'',path);setRoute(readRoute());scrollTo({top:0,behavior:'smooth'})}
  useEffect(()=>{const onPop=()=>setRoute(readRoute());addEventListener('popstate',onPop);return()=>removeEventListener('popstate',onPop)},[])
  const openSong=(song:RankedSong)=>{track('song_opened');visit(String(song.rank));navigate(`/song/${song.rank}`)}
  return <div className="app">
    <Header navigate={navigate} savedCount={archive.savedSongs.filter(id=>/^\d+$/.test(id)).length}/>
    <main>
      {route.page==='catalog'&&<Catalog onOpen={openSong} saved={archive.savedSongs} recent={archive.recent} onSave={id=>toggle('savedSongs',String(id))}/>}
      {route.page==='song'&&<RankedSongPage song={resolveSong(route.id)} navigate={navigate} saved={archive.savedSongs} onSave={id=>toggle('savedSongs',String(id))} track={track}/>} 
      {route.page==='saved'&&<SavedPage navigate={navigate} saved={archive.savedSongs} onSave={id=>toggle('savedSongs',String(id))} onOpen={openSong}/>} 
    </main>
    <Footer/>
  </div>
}

function Header({navigate,savedCount}:{navigate:(path:string)=>void;savedCount:number}){
  return <header className="site-head"><button className="head-side" onClick={()=>navigate('/')}>EXPLORE <span>500</span></button><button className="wordmark" onClick={()=>navigate('/')} aria-label="Hear the World home"><i/><span>HEAR</span><b>THE WORLD</b><i/></button><button className="head-side saved-head" onClick={()=>navigate('/saved')}>SAVED <span>{savedCount}</span></button></header>
}

function Catalog({onOpen,saved,recent,onSave}:{onOpen:(song:RankedSong)=>void;saved:string[];recent:string[];onSave:(rank:number)=>void}){
  const [query,setQuery]=useState('')
  const [decade,setDecade]=useState('ALL')
  const [sort,setSort]=useState('RANK')
  const [visible,setVisible]=useState(40)
  const [surprise,setSurprise]=useState<RankedSong|null>(null)
  const [activeJourney,setActiveJourney]=useState(curatedJourneys[0].id)
  const decades=[...new Set(rollingStone500.map(song=>Math.floor((song.year||0)/10)*10))].filter(Boolean).sort()
  const filtered=useMemo(()=>rollingStone500.filter(song=>{
    const haystack=`${song.title} ${song.artist} ${song.year} ${song.rank}`.toLowerCase()
    return haystack.includes(query.toLowerCase().trim())&&(decade==='ALL'||Math.floor((song.year||0)/10)*10===Number(decade))
  }).sort((a,b)=>sort==='YEAR'?a.year!-b.year!:sort==='ARTIST'?a.artist.localeCompare(b.artist):sort==='TITLE'?a.title.localeCompare(b.title):a.rank-b.rank),[query,decade,sort])
  const researched=useMemo(()=>rollingStone500.filter(song=>Boolean(richFor(song))),[])
  const randomSong=()=>{const filteredResearch=filtered.filter(song=>Boolean(richFor(song)));const pool=filteredResearch.length?filteredResearch:researched;setSurprise(pool[Math.floor(Math.random()*pool.length)])}
  const openMood=(titles:string[])=>setSurprise(songByTitle(titles[Math.floor(Math.random()*titles.length)]))
  const recentSongs=recent.map(id=>rollingStone500.find(song=>String(song.rank)===id)).filter((song):song is RankedSong=>Boolean(song))
  const trailConnection=recentSongs.length>2?`You crossed ${new Set(recentSongs.map(song=>Math.floor(Number(song.year)/10)*10)).size} eras. Different sounds, the same question: what does a song ask its listener to notice?`:'Your first connection will appear after three songs.'
  useEffect(()=>setVisible(40),[query,decade,sort])
  return <>
    <section className="discovery-intro"><div className="star-field" aria-hidden="true"/><div className="discovery-stage"><div className="discovery-copy"><span className="issue-label">ONE SONG AT A TIME</span><h1>Hear it.<br/><em>Then hear more.</em></h1><p>Listen first. Decode what is hidden. Follow the song into the world that made it.</p><button className="random-cta" onClick={randomSong}><span aria-hidden="true">✦</span><div><strong>Surprise me</strong><small>A DEEPLY RESEARCHED SONG FROM THE 500</small></div></button></div><article className="featured-entry"><div className="featured-cover"><img src="/images/fight-the-power/do-the-right-thing-poster.jpg" alt="Do the Right Thing, the film that commissioned Fight the Power"/><span>START HERE · 1989</span></div><div><p>A DIRECTOR NEEDED AN ANTHEM.</p><h2>Public Enemy gave him an argument.</h2><button onClick={()=>onOpen(songByTitle('Fight the Power'))}>Enter the song →</button></div></article></div><div className="door-row">{moodDoors.map(door=><button key={door.label} onClick={()=>openMood(door.titles)}><span>ENTER THROUGH A FEELING</span><strong>{door.label}</strong><i>→</i></button>)}</div></section>
    <section className="journey-hub"><header><div><span className="issue-label">CURATED LISTENING PATHS</span><h2>Don’t browse.<br/>Follow a thread.</h2></div>{recent.length>0&&<aside className="trail-summary"><span>YOUR TRAIL</span><strong>{recent.length} {recent.length===1?'song':'songs'} heard</strong><p>{[...new Set(recent.map(id=>rollingStone500.find(song=>String(song.rank)===id)?.year).filter(Boolean).map(year=>`${Math.floor(Number(year)/10)*10}s`))].slice(0,3).join(' · ')||'Your first path is taking shape'}</p><div><b>WHAT CONNECTS THEM?</b>{trailConnection}</div></aside>}</header><div className="journey-tabs" role="tablist">{curatedJourneys.map(journey=><button role="tab" aria-selected={activeJourney===journey.id} className={activeJourney===journey.id?'active':''} onClick={()=>setActiveJourney(journey.id)} key={journey.id}>{journey.title}</button>)}</div>{curatedJourneys.filter(journey=>journey.id===activeJourney).map(journey=><div className="journey-feature" key={journey.id}><div><span>{journey.eyebrow}</span><h3>{journey.title}</h3><p>{journey.description}</p><button onClick={()=>onOpen(songByTitle(journey.titles[0]))}>Begin with {journey.titles[0]} →</button></div><div className="journey-song-row">{journey.titles.map((title,index)=>{const item=songByTitle(title);return <button key={title} onClick={()=>onOpen(item)}><b>0{index+1}</b><span>{item.year}</span><strong>{item.title}</strong><small>{item.artist}</small></button>})}</div></div>)}</section>
    <section className="archive" id="songs">
      <div className="archive-toolbar"><label className="search"><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search 500 songs, artists or years"/></label><label><span>SORT</span><select value={sort} onChange={event=>setSort(event.target.value)}><option value="RANK">LIST RANK</option><option value="YEAR">YEAR</option><option value="ARTIST">ARTIST</option><option value="TITLE">TITLE</option></select></label></div>
      <div className="decade-row"><button className={decade==='ALL'?'active':''} onClick={()=>setDecade('ALL')}>All eras</button>{decades.map(value=><button className={decade===String(value)?'active':''} key={value} onClick={()=>setDecade(String(value))}>{value}s</button>)}</div>
      <div className="result-line"><strong>{filtered.length}</strong><span>songs</span><p>Tap any image to turn the record over.</p></div>
      <div className="record-grid">{filtered.slice(0,visible).map(song=><FlipSongCard key={song.rank} song={song} saved={saved.includes(String(song.rank))} onSave={()=>onSave(song.rank)} onOpen={()=>onOpen(song)}/>)}</div>
      {visible<filtered.length&&<button className="load-more" onClick={()=>setVisible(count=>count+40)}>Show 40 more <span>{filtered.length-visible} remain</span></button>}
    </section>
    {surprise&&<SurprisePanel song={surprise} onClose={()=>setSurprise(null)} onAgain={randomSong} onOpen={()=>onOpen(surprise)}/>} 
  </>
}

function CoverImage({song}:{song:RankedSong}){
  return <AlbumCover artist={song.artist} title={song.title} className="ranked-cover" fallbackUrl={song.artworkUrl||undefined}/>
}

function FlipSongCard({song,saved,onSave,onOpen}:{song:RankedSong;saved:boolean;onSave:()=>void;onOpen:()=>void}){
  const [flipped,setFlipped]=useState(false)
  const rich=richFor(song)
  return <article className={`flip-card ${flipped?'is-flipped':''}`}><div className="flip-inner"><button className="card-face card-front" onClick={()=>setFlipped(true)} aria-label={`Turn over ${song.title}`}><CoverImage song={song}/><span className="rank">#{song.rank}</span><span className="turn-hint">TURN OVER ↻</span></button><div className="card-face card-back"><button className="flip-back" onClick={()=>setFlipped(false)} aria-label="Show cover">↺ COVER</button><span className="back-rank">#{song.rank} · {song.year}</span><h3>{song.title}</h3><h4>{song.artist}</h4><p>{rich?.lyricsMeaning||songHook(song)}</p>{rich&&<div className="mini-themes">{rich.themes.slice(0,2).map(theme=><span key={theme}>{theme}</span>)}</div>}<div className="back-actions"><button onClick={onOpen}>{rich?'Open deep dive':'Enter the story'} →</button><a href={spotifySearch(song)} target="_blank" rel="noreferrer">▶ Listen</a></div></div></div><div className="record-caption"><div><strong>{song.title}</strong><span>{song.artist}</span></div><button onClick={onSave} aria-label={`${saved?'Remove':'Save'} ${song.title}`}>{saved?'♥':'♡'}</button></div></article>
}

function SurprisePanel({song,onClose,onAgain,onOpen}:{song:RankedSong;onClose:()=>void;onAgain:()=>void;onOpen:()=>void}){
  const rich=richFor(song)
  const [signal,setSignal]=useState<'meaning'|'world'|'then'|'now'>('meaning')
  const [turned,setTurned]=useState(false)
  useEffect(()=>{setSignal('meaning');setTurned(false)},[song.rank])
  const signals={
    meaning:{label:'HIDDEN MEANING',title:rich?.themes.slice(0,3).join(' · ')||'Read beneath the refrain',copy:rich?.lyricsMeaning||songHook(song),detail:rich?.culturalContext||'',listenFor:rich?.sound||''},
    world:{label:'THE WORLD AROUND IT',title:rich?`${rich.city}, ${song.year}`:`${song.year}`,copy:rich?.historicalContext||songHook(song),detail:rich?.politicalMoment||'',listenFor:rich?.sound||''},
    then:{label:'THEN',title:`How it landed in ${song.year}`,copy:rich?.then||songHook(song),detail:rich?`The artist at that moment: ${rich.artistContext}`:'',listenFor:rich?.sound||''},
    now:{label:'NOW',title:`The afterlife of “${song.title}”`,copy:rich?.now||songHook(song),detail:rich?.impact||'',listenFor:rich?.sound||''}
  }
  const active=signals[signal]
  return <div className="surprise-scrim cosmic-scrim" role="dialog" aria-modal="true" aria-label={`Discover ${song.title}`}><section className="cosmic-song"><div className="cosmic-stars" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><button className="cosmic-close" onClick={onClose}>RETURN TO THE 500 ×</button><p className="cosmic-kicker">TRANSMISSION #{song.rank} · {song.year}</p><header><h2>{song.title}</h2><h3>{song.artist}</h3></header><button className={`cosmic-record ${turned?'turned':''}`} onClick={()=>setTurned(value=>!value)} aria-label="Turn the record"><span className="cosmic-record-front"><CoverImage song={song}/></span><span className="cosmic-record-back"><b>WHY THIS ONE?</b><em>{rich?.summary||songHook(song)}</em></span></button><span className="record-instruction">CLICK THE RECORD TO TURN IT</span><div className="cosmic-orbits" aria-label="Explore this song"><button className={signal==='meaning'?'active':''} onClick={()=>setSignal('meaning')}>MEANING</button><button className={signal==='world'?'active':''} onClick={()=>setSignal('world')}>WORLD</button><button className={signal==='then'?'active':''} onClick={()=>setSignal('then')}>THEN</button><button className={signal==='now'?'active':''} onClick={()=>setSignal('now')}>NOW</button></div><article className="cosmic-signal" aria-live="polite"><span>{active.label}</span><h4>{active.title}</h4><p>{active.copy}</p>{active.detail&&<p className="cosmic-detail">{active.detail}</p>}<div className="cosmic-evidence"><b>LISTEN FOR</b><p>{active.listenFor}</p>{rich&&<small>SOURCE TRAIL · {rich.sources.slice(0,2).join(' · ')}</small>}</div></article><div className="cosmic-listen"><span>LISTEN WHILE YOU EXPLORE</span><AudioPreview artist={song.artist} title={song.title}/></div><div className="cosmic-actions"><button onClick={onAgain}>✦ NEXT TRANSMISSION</button><button onClick={onOpen}>OPEN THE COMPLETE STORY →</button><a href={spotifySearch(song)} target="_blank" rel="noreferrer">LISTEN IN FULL ↗</a></div></section></div>
}

function SongContinuum({song,navigate,track}:{song:RankedSong;navigate:(path:string)=>void;track:(event:string)=>void}){
  const [answer,setAnswer]=useState('')
  const songYear=song.year||0
  const researched=rollingStone500.filter(item=>item.rank!==song.rank&&Boolean(richFor(item)))
  const currentStory=richFor(song)
  const themeScore=(item:RankedSong)=>{
    const story=richFor(item)
    return story&&currentStory?story.themes.filter(theme=>currentStory.themes.includes(theme)).length:0
  }
  const unique=(items:RankedSong[])=>items.filter((item,index,list)=>list.findIndex(candidate=>candidate.rank===item.rank)===index)
  const rotate=(items:RankedSong[],offset:number)=>items.length?[...items.slice(offset%items.length),...items.slice(0,offset%items.length)]:[]
  const thematic=unique([...researched].sort((a,b)=>themeScore(b)-themeScore(a)||Math.abs((a.year||0)-songYear)-Math.abs((b.year||0)-songYear)))
  const sameMoment=unique([...researched].sort((a,b)=>Math.abs((a.year||0)-songYear)-Math.abs((b.year||0)-songYear)))
  const sameArtist=rollingStone500.filter(item=>item.rank!==song.rank&&normalize(item.artist)===normalize(song.artist))
  const farAway=unique([...researched].sort((a,b)=>Math.abs((b.year||0)-songYear)-Math.abs((a.year||0)-songYear)))
  const fallback=rotate(researched,song.rank%Math.max(researched.length,1))
  const hasSameArtist=sameArtist.length>0
  const meaningSongs=unique([...thematic,...fallback]).slice(0,3)
  const meaningRanks=new Set(meaningSongs.map(item=>item.rank))
  const momentSongs=unique([...sameMoment,...fallback]).filter(item=>!meaningRanks.has(item.rank)).slice(0,3)
  const usedRanks=new Set([...meaningSongs,...momentSongs].map(item=>item.rank))
  const resetSongs=unique([...sameArtist,...farAway,...fallback]).filter(item=>!usedRanks.has(item.rank)).slice(0,3)
  const paths:Record<string,Array<{label:string;song:RankedSong;reason:string}>>={
    'Yes — completely':meaningSongs.map((item,index)=>({label:['FOLLOW THE MEANING','FOLLOW THE STRUGGLE','FOLLOW THE AFTERLIFE'][index],song:item,reason:['A related question, asked from another life.','The same pressure finds a different voice.','Hear what another generation carried forward.'][index]})),
    'A little':momentSongs.map((item,index)=>({label:['STAY IN THE MOMENT','KEEP THE CONVERSATION','HEAR A COUNTERPOINT'][index],song:item,reason:[`Another record made close to ${song.year}.`,'A neighboring story with a different center.','Compare what changes when the voice changes.'][index]})),
    'I need another listen':resetSongs.map((item,index)=>({label:[hasSameArtist?'STAY WITH THE ARTIST':'CHANGE THE VOICE','TRY A CLEARER DOORWAY','TAKE A DETOUR'][index],song:item,reason:[hasSameArtist?'Keep the voice, change the record.':'Let a different voice reset your ears.','A new song may reveal what this one withheld.','Return later after a radical change of perspective.'][index]}))
  }
  const next=paths[answer]||[]
  const choose=(value:string)=>{setAnswer(value);track(`question_${value.toLowerCase().replace(/\s/g,'_')}`)}
  return <section className="song-continuum"><div className="reflection"><span>ONE QUESTION BEFORE YOU LEAVE</span><h2>Did this song change when you learned where it came from?</h2><div>{['Yes — completely','A little','I need another listen'].map(value=><button className={answer===value?'active':''} onClick={()=>choose(value)} key={value}>{value}</button>)}</div>{answer&&<p>{answer==='I need another listen'?'Good. Take a different route, then come back with new ears.':answer==='A little'?'Stay close to the moment and compare what shifts.':'Carry that change into a deeper connection.'}</p>}</div><div className={`next-discovery ${answer?'is-open':''}`}><span>{answer?'YOUR ANSWER OPENED THIS PATH':'CHOOSE AN ANSWER TO OPEN A PATH'}</span>{answer&&<div>{next.map(path=><button key={`${answer}-${path.song.rank}`} onClick={()=>navigate(`/song/${path.song.rank}`)}><small>{path.label}</small><strong>{path.song.title}</strong><em>{path.song.artist} · {path.song.year}</em><p>{path.reason}</p><i>→</i></button>)}</div>}</div></section>
}

function RankedSongPage({song,navigate,saved,onSave,track}:{song:RankedSong;navigate:(path:string)=>void;saved:string[];onSave:(rank:number)=>void;track:(event:string)=>void}){
  useEffect(()=>{document.title=`${song.title} — Hear the World`;return()=>{document.title='Hear the World'}},[song.title])
  if(song.rank===2) return <FightThePowerExperience song={song} navigate={navigate} saved={saved} onSave={onSave} track={track}/>
  const rich=richFor(song)
  return <article className="song-page"><button className="back" onClick={()=>navigate('/')}>← Back to all 500</button><header className="song-lead"><div className="lead-cover"><CoverImage song={song}/><span>ROLLING STONE · #{song.rank}</span></div><div><p className="eyebrow">{song.year} · NUMBER {song.rank} OF 500</p><h1>{song.title}</h1><h2>{song.artist}</h2><div className="mobile-listen"><span>LISTEN FIRST</span><AudioPreview artist={song.artist} title={song.title} onPlay={()=>track('audio_preview_started')}/></div><p className="lead-copy">{rich?.summary||songHook(song)}</p><div className="lead-actions"><a href={spotifySearch(song)} target="_blank" rel="noreferrer">▶ Listen in full</a><a href={youtubeSearch(song)} target="_blank" rel="noreferrer">Watch ↗</a><SaveButton active={saved.includes(String(song.rank))} onClick={()=>onSave(song.rank)} label="Save"/></div></div></header><section className="listen-first"><div><span>LISTEN FIRST</span><h3>Before the explanation,<br/>hear the record.</h3></div><AudioPreview artist={song.artist} title={song.title} onPlay={()=>track('audio_preview_started')}/></section>{rich?<><DeepDive song={rich} track={track}/><CulturalAfterlife song={rich} onExplore={stage=>track(`afterlife_${stage}`)}/></>:<section className="open-questions"><article><span>01 · FIRST LISTEN</span><h3>What catches your ear?</h3><p>Notice the voice, rhythm, texture and the moment the song announces what kind of world it wants to create.</p></article><article><span>02 · THE RANKING</span><h3>Does #{song.rank} change how you hear it?</h3><p>Lists create canons, but listening can resist them. Decide what the song means before accepting its assigned place.</p></article><article><span>03 · FOLLOW THE SOURCE</span><h3>Continue the investigation.</h3><p>This listening page intentionally avoids invented interpretation. Read the original ranking note, then return to the recording.</p><a href={song.sourceUrl} target="_blank" rel="noreferrer">Rolling Stone entry ↗</a></article></section>}<SongContinuum song={song} navigate={navigate} track={track}/></article>
}

type AfterlifeMoment={era:string;kind:string;title:string;copy:string;prompt:string;image?:string;imageAlt?:string;credit?:string}

function afterlifeMoments(song:CatalogSong):AfterlifeMoment[]{
  const special:Record<string,AfterlifeMoment[]>={
    'fightthepower':[
      {era:'1989',kind:'COMMISSION',title:'A director asks for an anthem.',copy:'Spike Lee commissions a song for Do the Right Thing. Public Enemy answer with a record built to work inside the film—and escape it.',prompt:'The song begins as cinema, but refuses to stay there.',image:fightVisuals.poster,imageAlt:'Original Do the Right Thing film poster',credit:'ART SIMS · DO THE RIGHT THING, 1989'},
      {era:'1989',kind:'RALLY',title:'Bed-Stuy completes the song.',copy:'The music video turns a neighborhood performance into a political march. The crowd is not decoration; it becomes another voice.',prompt:'A performance becomes a public gathering.',image:fightVisuals.hero,imageAlt:'Spike Lee with Public Enemy in 1989',credit:'SPIKE LEE + PUBLIC ENEMY · 1989'},
      {era:'2020',kind:'RETURN',title:'The refrain returns to the street.',copy:'During the racial-justice protests of 2020, the song circulates again as usable public language—not sealed 1980s history.',prompt:'A classic becomes present tense again.',image:fightVisuals.live,imageAlt:'Public Enemy performing live',credit:'PUBLIC ENEMY LIVE · THE SONG KEEPS MOVING'},
      {era:'NOW',kind:'LIVING QUESTION',title:'Who gets to control public memory?',copy:'Its central conflict survives each replay: who becomes a hero, whose anger is treated as legitimate, and whose history enters the canon.',prompt:'The afterlife is not nostalgia. It is an unresolved argument.'}
    ],
    'bornintheusa':[
      {era:'1984',kind:'ORIGIN · RELEASE',title:'A damaged veteran enters an arena.',copy:'Bleak verses about work, war and abandonment arrive inside an enormous, triumphant production.',prompt:'Hear the friction between the story and the sound.'},
      {era:'1984',kind:'MISREADING',title:'The chorus escapes the verses.',copy:'Political campaigns and mass audiences repeatedly hear celebration where the narrator describes promises that failed him.',prompt:'The misunderstanding becomes part of the work.'},
      {era:'AFTER',kind:'REINTERPRETATION',title:'The arrangement changes the argument.',copy:'Stripped-back performances make the veteran’s isolation harder to miss and reveal how production can redirect meaning.',prompt:'The same words can carry a different country.'},
      {era:'NOW',kind:'LIVING QUESTION',title:'What does patriotism require us to hear?',copy:'The song remains a test of selective listening: national pride in the refrain, national responsibility in the verses.',prompt:'Meaning lives in the gap between them.'}
    ],
    'strangefruit':[
      {era:'1939',kind:'ORIGIN · WITNESS',title:'A nightclub is asked to stop and look.',copy:'Billie Holiday’s performance turns Abel Meeropol’s text into a ritual of attention, with silence and staging refusing the role of background entertainment.',prompt:'The room becomes part of the testimony.'},
      {era:'1939',kind:'INDUSTRY',title:'A recording the mainstream resists.',copy:'Its subject and force make it difficult for the commercial music system to absorb, revealing the limits around what could be publicly named.',prompt:'Circulation becomes a political question.'},
      {era:'AFTER',kind:'LINEAGE',title:'Other voices inherit the witness.',copy:'Later performances do not neutralize the song; each new voice must decide how to carry an image tied to specific racial terror.',prompt:'A cover can become an act of responsibility.'},
      {era:'NOW',kind:'LIVING QUESTION',title:'Can a document of violence ever become historical?',copy:'The song survives because it does not allow racial terror to feel comfortably distant or safely resolved.',prompt:'Its afterlife is the refusal to look away.'}
    ]
  }
  return special[normalize(song.title)]||[
    {era:String(song.year),kind:'ORIGIN · RELEASE',title:'The record enters its first world.',copy:song.historicalContext,prompt:'Start with what the first listeners already knew.'},
    {era:'THEN',kind:'FIRST RECEPTION',title:`What audiences heard in ${song.year}.`,copy:song.then,prompt:'Notice which references were immediate — and which needed time.'},
    {era:'AFTER',kind:'CULTURAL LIFE',title:'The song becomes more than its release.',copy:song.impact,prompt:'A recording changes when people reuse, remember and argue with it.'},
    {era:'NOW',kind:'LIVING MEANING',title:'The present listens back.',copy:song.now,prompt:'What survives is not always what the artist could have predicted.'}
  ]
}

function CulturalAfterlife({song,dark=false,onExplore,onReplay,playing=false}:{song:CatalogSong;dark?:boolean;onExplore?:(stage:string)=>void;onReplay?:()=>void;playing?:boolean}){
  const moments=afterlifeMoments(song)
  const [active,setActive]=useState(0)
  useEffect(()=>setActive(0),[song.id])
  const select=(index:number)=>{setActive(index);onExplore?.(moments[index].kind.toLowerCase().replace(/[^a-z]+/g,'_'))}
  const moment=moments[active]
  return <section className={`cultural-afterlife ${dark?'afterlife-dark':''}`} id={dark?'ftp-afterlife':undefined}>
    <div className="afterlife-heading"><div><span>CULTURAL AFTERLIFE</span><h2>{dark?`The song did not stay in ${song.year}.`:'Four moments changed what the song meant.'}</h2></div><p>Move through the moments that changed how <em>{song.title}</em> was heard.</p></div>
    <div className="afterlife-stage">
      <div className="afterlife-map" role="tablist" aria-label={`The cultural afterlife of ${song.title}`}>
        <div className="afterlife-line" aria-hidden="true"><i style={{width:`${active/(moments.length-1)*100}%`}}/></div>
        {moments.map((item,index)=><button key={`${item.era}-${item.kind}`} role="tab" aria-selected={active===index} className={active===index?'active':''} onClick={()=>select(index)}><i/><span>{item.era}</span><small>{item.kind}</small></button>)}
      </div>
      <article className="afterlife-card" aria-live="polite">
        <figure className="afterlife-visual">{moment.image?<img src={moment.image} alt={moment.imageAlt||''}/>:<AlbumCover artist={song.artist} title={song.title}/>}<figcaption>{moment.credit||`${song.title} · ${song.artist}`}</figcaption>{onReplay&&<button onClick={onReplay}>{playing?'Ⅱ PAUSE':'▶ LISTEN AGAIN'}</button>}</figure>
        <div className="afterlife-story"><div className="afterlife-index"><span>0{active+1}</span><i>/</i><small>0{moments.length}</small></div><span>{moment.era} · {moment.kind}</span><h3>{moment.title}</h3><p>{moment.copy}</p><blockquote>{moment.prompt}</blockquote><button onClick={()=>select((active+1)%moments.length)}>{active===moments.length-1?'BEGIN AGAIN ↺':'NEXT MOMENT →'}</button></div>
      </article>
    </div>
  </section>
}

const fightFrames=[
  {time:0,label:'THE ALARM',title:'The record enters as an emergency.',copy:'Before melody settles in, noise and voice establish urgency. This is not background music; it is an interruption.'},
  {time:6,label:'THE ARCHIVE',title:'The past begins speaking at once.',copy:'The sample collage turns earlier Black music and public speech into a living archive rather than a museum display.'},
  {time:12,label:'THE QUESTION',title:'Who is allowed to become a hero?',copy:'The song challenges inherited cultural authority and asks who gets remembered, celebrated, and protected.'},
  {time:18,label:'THE CROWD',title:'A single voice becomes collective speech.',copy:'Call-and-response and layered vocals make the recording feel less like a monologue and more like a public gathering.'},
  {time:24,label:'THE DEMAND',title:'The track refuses a comfortable ending.',copy:'Its energy does not resolve the conflict. It leaves the listener with a decision: observe the world, or answer it.'}
]

const fightVisuals={
  hero:'https://i8.amplience.net/i/naras/SpikeLee_PublicEnemy_GettyImages-1052271946',
  poster:'/images/fight-the-power/do-the-right-thing-poster.jpg',
  live:'/images/fight-the-power/public-enemy-live.jpg'
}

function FightThePowerExperience({song,navigate,saved,onSave,track}:{song:RankedSong;navigate:(path:string)=>void;saved:string[];onSave:(rank:number)=>void;track:(event:string)=>void}){
  const rich=richFor(song)
  const audioRef=useRef<HTMLAudioElement>(null)
  const [preview,setPreview]=useState('')
  const [current,setCurrent]=useState(0)
  const [duration,setDuration]=useState(30)
  const [playing,setPlaying]=useState(false)
  const [revealed,setRevealed]=useState<number[]>([])
  const [reflection,setReflection]=useState('')
  const activeFrame=fightFrames.reduce((active,frame,index)=>current>=frame.time?index:active,0)
  useEffect(()=>{
    document.title='Fight the Power — An immersive song story'
    let active=true
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(`${song.artist} ${song.title}`)}&entity=song&limit=1`)
      .then(response=>response.ok?response.json():Promise.reject())
      .then(data=>{if(active)setPreview(data.results?.[0]?.previewUrl||'')})
      .catch(()=>{})
    return()=>{active=false;document.title='Hear the World'}
  },[song.artist,song.title])
  const togglePlayback=()=>{
    const audio=audioRef.current
    if(!audio||!preview)return
    if(audio.paused){void audio.play().then(()=>track('immersive_preview_started')).catch(()=>{})}
    else audio.pause()
  }
  const seek=(time:number)=>{if(audioRef.current){audioRef.current.currentTime=time;setCurrent(time)}}
  const progress=Math.min(100,(current/(duration||30))*100)
  return <article className={`ftp-experience ${playing?'is-playing':''}`}>
    <section className="ftp-hero">
      <div className="ftp-hero-photo"><img src={fightVisuals.hero} alt="Spike Lee with Public Enemy at a 1989 rally"/></div>
      <div className="ftp-noise" aria-hidden="true"/><div className="ftp-siren" aria-hidden="true"/>
      <div className="ftp-broadcast" aria-hidden="true"><span>PUBLIC ENEMY</span><span>BED-STUY · 1989</span><span>THIS IS NOT BACKGROUND MUSIC</span></div>
      <button className="ftp-back" onClick={()=>navigate('/')}>← THE 500</button>
      <div className="ftp-hero-copy"><p>AN IMMERSIVE SONG STORY · 01</p><h1><span>FIGHT</span><span>THE POWER</span></h1><div className="ftp-hero-meta"><strong>PUBLIC ENEMY</strong><span>NEW YORK · 1989</span><span>ROLLING STONE #2</span></div></div>
      <div className="ftp-launch"><button onClick={togglePlayback} disabled={!preview} aria-label={playing?'Pause preview':'Play preview'}><i>{playing?'Ⅱ':'▶'}</i><span>{preview?(playing?'PAUSE THE RECORD':'ENTER THE RECORD'):'FINDING THE RECORD…'}</span></button><small>30-SECOND LISTENING EXPERIENCE</small></div>
      <button className="ftp-scroll" onClick={()=>document.getElementById('ftp-story')?.scrollIntoView({behavior:'smooth'})}>SCROLL TO DECODE ↓</button>
      <a className="ftp-photo-credit" href="https://www.grammy.com/news/essential-black-film-soundtracks-shaft-waiting-to-exhale-purple-rain-do-the-right-thing-above-the-rim" target="_blank" rel="noreferrer">SPIKE LEE + PUBLIC ENEMY, 1989 · GETTY / GRAMMY ↗</a>
      <audio ref={audioRef} src={preview||undefined} onLoadedMetadata={event=>setDuration(event.currentTarget.duration||30)} onTimeUpdate={event=>setCurrent(event.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);track('immersive_preview_completed')}}/>
    </section>

    <nav className="ftp-story-nav" aria-label="Song story chapters">{[['01','LISTEN','ftp-story'],['02','DECODE','ftp-hidden'],['03','TIMELINE','ftp-afterlife'],['04','CONTINUE','ftp-next']].map(([number,label,id])=><button key={id} onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}><span>{number}</span>{label}</button>)}</nav>
    {preview&&<div className="ftp-mini-player"><button onClick={togglePlayback} aria-label={playing?'Pause preview':'Play preview'}>{playing?'Ⅱ':'▶'}</button><div><span>FIGHT THE POWER · PUBLIC ENEMY</span><i><b style={{width:`${progress}%`}}/></i></div><time>{Math.floor(current).toString().padStart(2,'0')} / {Math.round(duration||30).toString().padStart(2,'0')}</time></div>}

    <section className="ftp-listening" id="ftp-story">
      <header><p>LISTENING MAP</p><h2>Thirty seconds.<br/>Five ways into the record.</h2></header>
      <div className="ftp-player"><button onClick={togglePlayback} disabled={!preview}>{playing?'PAUSE':'PLAY'}</button><div className="ftp-track"><span style={{width:`${progress}%`}}/></div><time>{Math.floor(current).toString().padStart(2,'0')} / {Math.round(duration||30).toString().padStart(2,'0')}</time></div>
      <div className="ftp-timeline">{fightFrames.map((frame,index)=><button key={frame.label} className={activeFrame===index?'active':''} onClick={()=>seek(frame.time)}><time>00:{frame.time.toString().padStart(2,'0')}</time><span>{frame.label}</span></button>)}</div>
      <div className="ftp-frame" aria-live="polite"><span>{fightFrames[activeFrame].label}</span><h3>{fightFrames[activeFrame].title}</h3><p>{fightFrames[activeFrame].copy}</p></div>
    </section>

    <section className="ftp-sound" id="ftp-sound">
      <div className="ftp-section-title"><p>SONIC DNA</p><h2>Organized overload.</h2><p>The Bomb Squad built meaning through density. Each layer competes for space, mirroring a public argument in which history, warning, rhythm, and resistance arrive at the same time.</p></div>
      <div className="ftp-layers">{[
        ['01','SIREN ENERGY','Urgency arrives before explanation.'],['02','BREAKBEAT','The rhythm moves like a march that refuses military order.'],['03','SAMPLE COLLAGE','Earlier records become evidence, memory, and counter-history.'],['04','GROUP VOICE','The chorus turns private conviction into public language.']
      ].map(([number,title,copy],index)=><article className={playing&&activeFrame>=index?'active':''} key={title}><span>{number}</span><div className="ftp-wave" aria-hidden="true">{Array.from({length:18},(_,bar)=><i key={bar}/>)}</div><h3>{title}</h3><p>{copy}</p></article>)}</div>
    </section>

    <section className="ftp-hidden" id="ftp-hidden"><div className="ftp-section-title"><p>HIDDEN SIGNAL</p><h2>Three layers beneath the hook.</h2><p>Open them in any order. The record grows more specific each time.</p></div><div className="signal-grid">{[
      ['THE LINE','The lyric does more than reject authority. It questions the cultural figures listeners were taught to admire without argument.'],
      ['THE REFERENCE','The song’s archive of voices and samples makes history audible as interruption — the past does not wait politely for its turn.'],
      ['THE REAL TARGET','The deeper conflict is control over public memory: who becomes a hero, whose anger sounds legitimate, and whose experience enters the canon.']
    ].map(([label,copy],index)=>{const open=revealed.includes(index);return <button className={open?'revealed':''} onClick={()=>setRevealed(items=>items.includes(index)?items.filter(item=>item!==index):[...items,index])} aria-expanded={open} key={label}><span>0{index+1} · {label}</span><strong>{open?copy:'Reveal the signal'}</strong><i>{open?'×':'+'}</i></button>})}</div><p className="signal-progress">{revealed.length} OF 3 SIGNALS FOUND</p></section>

    {rich&&<CulturalAfterlife song={rich} dark playing={playing} onReplay={()=>{seek(0);togglePlayback()}} onExplore={stage=>track(`fight_afterlife_${stage}`)}/>}

    <section className="ftp-exit" id="ftp-next"><p>THE RECORD ENDS. THE QUESTION DOESN’T.</p><h2>Can a protest song remain radical after it becomes a classic?</h2><div className="ftp-answer-row">{['Yes — the need remains','Only if we keep listening','The canon changes it'].map(answer=><button className={reflection===answer?'selected':''} onClick={()=>{setReflection(answer);track(`fight_reflection_${answer.slice(0,3).toLowerCase()}`)}} key={answer}>{answer}</button>)}</div>{reflection&&<p className="ftp-answer-note">Your answer opens three different ways forward.</p>}<div className="ftp-paths">{[
      ['FOLLOW THE PROTEST','Alright','The crowd answers a generation later.'],['FOLLOW THE LINEAGE','Say It Loud (I’m Black and I’m Proud)','Trace the declaration inside the sample memory.'],['FOLLOW THE QUESTION','A Change Is Gonna Come','Move from confrontation toward hard-won hope.']
    ].map(([label,title,copy])=>{const next=songByTitle(title);return <button key={title} onClick={()=>navigate(`/song/${next.rank}`)}><span>{label}</span><strong>{next.title}</strong><small>{next.artist} · {next.year}</small><em>{copy}</em><i>→</i></button>})}</div><div className="ftp-final-actions"><button onClick={()=>onSave(song.rank)}>{saved.includes(String(song.rank))?'♥ SAVED':'♡ SAVE THIS STORY'}</button><a href={spotifySearch(song)} target="_blank" rel="noreferrer">LISTEN IN FULL ↗</a><a href={youtubeSearch(song)} target="_blank" rel="noreferrer">WATCH THE VIDEO ↗</a></div><button className="ftp-return" onClick={()=>navigate('/')}>RETURN TO DISCOVERY</button></section>
  </article>
}

function DeepDive({song,track}:{song:CatalogSong;track:(event:string)=>void}){
  const cards=[['LYRIC LENS','What the words are doing',song.lyricsMeaning],['HIDDEN LAYER','What is easy to miss',song.culturalContext],['THE WORLD AROUND IT',song.historicalContext,song.politicalMoment],['SONIC DNA','How the sound carries meaning',song.sound],['THEN',`How it landed in ${song.year}`,song.then],['NOW','How it lives today',song.now],['ARTIST LENS',song.artist,song.artistContext],['AFTERLIFE','What changed after this record',song.impact]]
  return <div className="deep-layout"><main className="insight-grid">{cards.map(([label,title,text],index)=><section className={`insight ${index===0||index===7?'wide':''}`} key={label}><span>{label}</span><h3>{title}</h3><p>{text}</p></section>)}</main><aside><div className="media-card"><span>WATCH</span><YouTubeVideoPlayer videoId={song.youtubeVideoId} title={song.videoTitle||song.title} artist={song.artist} youtubeUrl={song.youtubeUrl} videoType={song.videoType} onPlay={()=>track('youtube_video_started')}/></div><div className="source-card"><span>SOURCES</span>{song.sources.map(source=><p key={source}>{source}</p>)}</div></aside></div>
}

function SavedPage({navigate,saved,onSave,onOpen}:{navigate:(path:string)=>void;saved:string[];onSave:(rank:number)=>void;onOpen:(song:RankedSong)=>void}){
  const songs=rollingStone500.filter(song=>saved.includes(String(song.rank)))
  return <section className="saved-page"><button className="back" onClick={()=>navigate('/')}>← Back to all 500</button><span className="issue-label">YOUR COLLECTION</span><h1>Saved songs</h1>{songs.length?<div className="record-grid">{songs.map(song=><FlipSongCard key={song.rank} song={song} saved onSave={()=>onSave(song.rank)} onOpen={()=>onOpen(song)}/>)}</div>:<div className="empty"><h2>Nothing saved yet.</h2><p>Turn over a record and use the heart to keep it here.</p><button onClick={()=>navigate('/')}>Explore the 500</button></div>}</section>
}

function Footer(){return <footer><div className="footer-mark"><span>HEAR</span><b>THE WORLD</b></div><p>500 songs. Infinite ways to listen.</p><a href={listUrl} target="_blank" rel="noreferrer">Source list: Rolling Stone, 2021 ↗</a></footer>}
