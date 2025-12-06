import { supabase } from '@/lib/supabase/client'

export const XP_RATES = {
    MESSAGE: 5,
    VOICE_MINUTE: 10,
    DAILY_LOGIN: 50,
    TASK_COMPLETE: 20
}

export async function awardXP(userId: string, amount: number, reason: string) {
    if (!userId) return

    try {
        // 1. Log the XP gain
        const { error: logError } = await supabase
            .from('xp_logs')
            .insert({
                user_id: userId,
                amount,
                reason
            })

        if (logError) throw logError

        // 2. Get current XP and Level
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('xp, level')
            .eq('id', userId)
            .single()

        if (profileError) throw profileError

        let newXP = (profile.xp || 0) + amount
        let newLevel = profile.level || 1
        const xpForNextLevel = newLevel * 1000

        // 3. Check for level up
        if (newXP >= xpForNextLevel) {
            newLevel++
            newXP = newXP - xpForNextLevel // Optional: Reset XP or keep accumulating? 
            // Let's keep accumulating total XP for now, but level calc might need adjustment.
            // Actually, standard RPG: Total XP increases, Level is derived or threshold based.
            // Let's stick to: Level N requires N * 1000 XP.
            // If Total XP > Threshold, Level Up.

            // Simpler: Just update XP. If XP crosses threshold, increment level.
            // Let's say Level 1 -> 2 needs 1000 XP.
            // Level 2 -> 3 needs 2000 XP.
            // Total XP for Level L = 500 * L * (L-1).

            // Let's use the simple model from the UI: Level * 1000 is the cap for that level.
            // So if I am Level 1, I need 1000 XP to reach Level 2.
            // If I have 1050 XP, I am Level 2 with 50 XP.
        }

        // Let's just update the row. The UI handles the progress bar based on current level.
        // If newXP >= currentLevel * 1000:
        //   Level++
        //   XP = newXP - (currentLevel * 1000)

        // Wait, if I store "Total XP", I don't reset it.
        // If I store "Current Level XP", I reset it.
        // The UI code I wrote: `(userData.xp / (userData.level * 1000)) * 100`
        // This implies `xp` is the progress within the current level.

        if (newXP >= xpForNextLevel) {
            newLevel++
            newXP = newXP - xpForNextLevel
            // TODO: Send Level Up Notification
        }

        // 4. Update Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                xp: newXP,
                level: newLevel
            })
            .eq('id', userId)

        if (updateError) throw updateError

    } catch (error: any) {
        console.error('Error awarding XP:', {
            message: error?.message || 'Unknown error',
            details: error?.details || error?.hint || 'No details',
            code: error?.code,
            error: error
        })
    }
}
