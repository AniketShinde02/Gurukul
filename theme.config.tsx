import React from 'react'
import { Flame, ExternalLink, Github } from 'lucide-react'

const themeConfig = {
    logo: (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Gurukul <span className="text-orange-500 font-medium text-lg ml-0.5">DOCS</span></span>
        </div>
    ),
    project: {
        link: 'https://github.com/AniketShinde02/Gurukul',
        icon: <Github className="w-5 h-5" />
    },
    docsRepositoryBase: 'https://github.com/AniketShinde02/Gurukul/tree/main',
    footer: {
        text: (
            <div className="flex flex-col gap-2">
                <p className="text-sm">© {new Date().getFullYear()} Gurukul. Built for scholars, by scholars.</p>
                <p className="text-xs text-stone-500 italic">Honest & Student-Only</p>
            </div>
        )
    },
    head: (
        <>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta property="og:title" content="Gurukul Documentation" />
            <meta property="og:description" content="Technical and user guides for the Gurukul platform." />
            <link rel="icon" href="/favicon.ico" />
        </>
    ),
    useNextSeoProps() {
        return {
            titleTemplate: '%s – Gurukul Docs'
        }
    },
    primaryHue: {
        dark: 24,
        light: 22
    },
    darkMode: true,
    nextThemes: {
        defaultTheme: 'dark'
    },
    banner: {
        key: 'beta-launch',
        text: '🚀 Gurukul is currently in Beta. Join our Sangha to help us grow!'
    },
    sidebar: {
        defaultMenuCollapseLevel: 1,
        toggleButton: true
    },
    feedback: {
        content: 'Question? Give us feedback →',
        useLink: () => 'https://github.com/AniketShinde02/Gurukul/issues/new'
    },
    editLink: {
        text: 'Edit this page on GitHub →'
    },
    search: {
        placeholder: 'Search documentation...'
    }
}

export default themeConfig
