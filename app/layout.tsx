import type { Metadata } from 'next'
import { Outfit, Playfair_Display, Tiro_Devanagari_Sanskrit } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'
import { QueryProvider } from '@/components/providers/QueryProvider'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const tiro = Tiro_Devanagari_Sanskrit({
  weight: ['400'],
  subsets: ['devanagari'],
  variable: '--font-tiro'
})

export const metadata: Metadata = {
  title: 'Gurukul - Connect & Learn',
  description: 'Connect with fellow students through video and text chat in a modern spiritual environment',
  keywords: 'college, students, chat, video, omegle, anonymous, social, gurukul',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${playfair.variable} ${tiro.variable} font-sans bg-[#0a0a0a] text-stone-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

