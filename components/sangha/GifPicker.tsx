'use client'

import { useState } from 'react'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'
import { Search } from 'lucide-react'

// Initialize the GiphyFetch object
// We use a lazy initialization or check for the key to avoid crashes if env is missing
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'foo')

export function GifPicker({ onSelect }: { onSelect: (url: string) => void }) {
    const [search, setSearch] = useState('')

    // The fetch function for the Grid
    const fetchGifs = (offset: number) => {
        if (!search) {
            return gf.trending({ offset, limit: 10 })
        }
        return gf.search(search, { offset, limit: 10 })
    }

    return (
        <div className="w-[350px] h-[450px] bg-stone-950 border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl">
            {/* Search Bar */}
            <div className="p-3 border-b border-white/5 z-10 bg-stone-950">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search GIFs..."
                        className="w-full bg-stone-900/50 border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Giphy Grid */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent custom-giphy-grid">
                {process.env.NEXT_PUBLIC_GIPHY_API_KEY ? (
                    <Grid
                        width={330}
                        columns={2}
                        fetchGifs={fetchGifs}
                        key={search} // Force re-render on search change to reset grid
                        onGifClick={(gif, e) => {
                            e.preventDefault()
                            onSelect(gif.images.fixed_height.url)
                        }}
                        noLink
                        className="mx-auto"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-500 text-sm p-4 text-center">
                        <p>GIPHY API Key missing.</p>
                        <p className="text-xs mt-2 opacity-50">Please add NEXT_PUBLIC_GIPHY_API_KEY to .env.local</p>
                    </div>
                )}
            </div>

            <div className="p-2 bg-stone-900/50 text-[10px] text-center text-stone-500 border-t border-white/5">
                Powered by GIPHY
            </div>
        </div>
    )
}
