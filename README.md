# Hear the World

Hear the World is an evolving music discovery experience built around Rolling Stone's 2021 list of the 500 Greatest Songs of All Time. The project puts the music first: visitors can browse the complete ranking, filter it by era, search by artist or title, turn over record covers for context, save favorites, or let the site choose a random song.

[Hear the World](https://hear-the-world.netlify.app/)

## A personal note

This is only the first version of Hear the World. I already have many ideas for expanding it: deeper interpretations, richer historical and political context, more connections between artists, and new ways to move through music. I did not want those future plans to stop me from preserving what already exists, so I am saving this early version now and will continue building from here.

## What is included

- The complete 500-song ranking
- Search, sorting, and decade filters
- A central **Surprise me** discovery feature
- Interactive cards with album artwork and listening links
- Selected deep dives into lyrics, cultural context, sound, and legacy
- Saved songs stored locally in the browser
- Responsive layouts for desktop and mobile

## Technology

- React
- TypeScript
- Vite
- Netlify
- Apple Music/iTunes artwork and audio-preview lookup

## Run locally

```bash
pnpm install
pnpm dev
```

Create a production build with:

```bash
pnpm build
```

## Source and attribution

The ranking is based on Rolling Stone's 2021 edition of *The 500 Greatest Songs of All Time*. Album artwork, previews, and external listening links remain the property of their respective owners.

This is an independent exploratory project and is not affiliated with Rolling Stone, Apple Music, Spotify, or YouTube.
