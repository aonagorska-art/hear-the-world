import { writeFile } from 'node:fs/promises'

const listBase='https://au.rollingstone.com/music/music-lists/best-songs-of-all-time-30065/'
const yearSource='https://stuarte.co/2021/2021-full-list-rolling-stones-top-500-songs-of-all-time-updated/'
const decode=value=>value
  .replace(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code)))
  .replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;/g,"'")

const [pages,yearHtml]=await Promise.all([
  Promise.all(Array.from({length:10},(_,index)=>
  fetch(`${listBase}?list_page=${index+1}`).then(response=>{
    if(!response.ok) throw new Error(`Rolling Stone page ${index+1}: ${response.status}`)
    return response.text()
  })
  )),
  fetch(yearSource).then(response=>response.text())
])

const yearsByRank=new Map()
const yearPattern=/<tr><td>\s*(\d+)\s*<\/td>\s*<td>[\s\S]*?<\/td>\s*<td>[\s\S]*?<\/td>\s*<td>\s*(\d{4})/g
for(const match of yearHtml.matchAll(yearPattern)){
  const parsed=Number(match[2])
  yearsByRank.set(Number(match[1]),parsed<1900?parsed+100:parsed)
}

const entries=[]
for(const html of pages){
  const chunks=html.split('<article class="c-list__item"').slice(1)
  for(const chunk of chunks){
    const match=chunk.match(/[\s\S]*?data-list-item="(\d+)"[\s\S]*?data-list-title="([^"]+)"[\s\S]*?data-list-permalink="([^"]+)"/)
    if(!match) continue
    const credit=decode(match[2]).trim()
    const divider=credit.search(/, [‘’]/)
    if(divider<0) throw new Error(`Could not split credit: ${credit}`)
    const artist=credit.slice(0,divider)
    const title=credit.slice(divider+3).replace(/[‘’]\s*$/,'').trim()
    const rank=Number(match[1])
    const image=chunk.match(/data-src="([^"]+)"/)
    entries.push({rank,artist,title,year:yearsByRank.get(rank)||null,sourceUrl:decode(match[3]),artworkUrl:image?decode(image[1]):null})
  }
}

entries.sort((a,b)=>a.rank-b.rank)
if(entries.length!==500) throw new Error(`Expected 500 entries, found ${entries.length}`)

const output=`export interface RankedSong {\n  rank:number\n  title:string\n  artist:string\n  year:number|null\n  sourceUrl:string\n  artworkUrl?:string|null\n  previewUrl?:string|null\n  appleUrl?:string|null\n}\n\nexport const rollingStone500:RankedSong[] = ${JSON.stringify(entries,null,2)}\n`
await writeFile(new URL('../src/rollingStone500.ts',import.meta.url),output)
console.log(`Wrote ${entries.length} songs to src/rollingStone500.ts`)
