'use client'

import { useEffect } from 'react'
import Joyride, { CallBackProps, STATUS } from 'react-joyride'
import { tourSteps, tourStyles } from './tourSteps'
import Confetti from 'react-confetti'
import { useState } from 'react'

interface OnboardingTourProps {
    run: boolean
    onComplete: () => void
    onSkip: () => void
}

export default function OnboardingTour({ run, onComplete, onSkip }: OnboardingTourProps) {
    const [showConfetti, setShowConfetti] = useState(false)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

    useEffect(() => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        })

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action } = data

        if (status === STATUS.FINISHED) {
            // Tour completed!
            setShowConfetti(true)
            setTimeout(() => {
                setShowConfetti(false)
                onComplete()
            }, 5000)
        } else if (status === STATUS.SKIPPED || action === 'close') {
            // Tour skipped
            onSkip()
        }
    }

    return (
        <>
            <Joyride
                steps={tourSteps}
                run={run}
                continuous
                showProgress
                showSkipButton
                disableScrolling={false}
                callback={handleJoyrideCallback}
                styles={tourStyles}
                locale={{
                    back: 'Back',
                    close: 'Close',
                    last: 'Finish',
                    next: 'Next',
                    skip: 'Skip Tour',
                }}
            />

            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}
        </>
    )
}
