import { AppShell } from '@/components/layout/AppShell'
import OnboardingProvider from '@/components/onboarding/OnboardingProvider'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppShell>
            <OnboardingProvider>
                {children}
            </OnboardingProvider>
        </AppShell>
    )
}
