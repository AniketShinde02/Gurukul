'use client'

import { BookOpen, Search, Filter, Bookmark, Share2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const resources = [
    {
        id: 1,
        title: "Advanced Calculus Notes",
        type: "PDF",
        author: "Prof. Sharma",
        downloads: 1240,
        tags: ["Math", "Calculus"],
        description: "Comprehensive notes covering limits, derivatives, and integrals with solved examples."
    },
    {
        id: 2,
        title: "Quantum Physics Fundamentals",
        type: "Video",
        author: "Dr. A. P. J. Abdul Kalam Institute",
        downloads: 850,
        tags: ["Physics", "Quantum"],
        description: "A series of lectures explaining the core concepts of quantum mechanics."
    },
    {
        id: 3,
        title: "Data Structures & Algorithms Cheat Sheet",
        type: "Image",
        author: "CodeWithHarry",
        downloads: 3400,
        tags: ["CS", "Programming"],
        description: "Quick reference guide for common data structures and sorting algorithms."
    },
    {
        id: 4,
        title: "Organic Chemistry Reactions",
        type: "PDF",
        author: "Chemistry Hub",
        downloads: 560,
        tags: ["Chemistry", "Organic"],
        description: "Detailed reaction mechanisms and named reactions for organic chemistry."
    }
]

export default function ResourcesPage() {
    const [searchTerm, setSearchTerm] = useState('')

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-1">Study Resources</h1>
                    <p className="text-stone-400">Access and share knowledge with the community.</p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 shadow-lg shadow-orange-900/20">
                    Upload Resource
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-stone-200 focus:outline-none focus:border-orange-500/50 focus:bg-black/60 transition-all placeholder:text-stone-600"
                    />
                </div>
                <Button variant="outline" className="border-white/10 text-stone-400 hover:text-white hover:bg-white/5">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                    <div key={resource.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md hover:border-orange-500/30 transition-all group flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-xl bg-white/5 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <Button variant="ghost" size="icon" className="text-stone-500 hover:text-orange-500">
                                <Bookmark className="w-4 h-4" />
                            </Button>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">{resource.title}</h3>
                        <p className="text-sm text-stone-400 mb-4 flex-1">{resource.description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {resource.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-white/5 text-xs text-stone-300 border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                <span>{resource.type}</span>
                                <span>•</span>
                                <span>{resource.downloads} downloads</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
