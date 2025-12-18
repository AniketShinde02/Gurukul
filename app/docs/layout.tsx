import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import themeConfig from '../../theme.config'
import 'nextra-theme-docs/style.css'
import React from 'react'

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
    const pageMap = await getPageMap('/docs')

    return (
        <Layout
            {...themeConfig}
            pageMap={pageMap}
        >
            {children}
        </Layout>
    )
}
