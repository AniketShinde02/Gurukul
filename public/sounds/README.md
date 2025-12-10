# Sound Effects for Notifications

This directory should contain the following audio files:

| File | Description | Duration | Format |
|------|-------------|----------|--------|
| `message-received.mp3` | Played when a new message arrives | 0.5-1s | MP3 |
| `message-sent.mp3` | Played when user sends a message | 0.2-0.5s | MP3 |
| `notification.mp3` | General notification sound | 0.5-1s | MP3 |
| `incoming-call.mp3` | Ringtone for incoming calls | 2-3s (loops) | MP3 |
| `call-connected.mp3` | Played when call connects | 0.5s | MP3 |
| `call-ended.mp3` | Played when call ends | 0.5s | MP3 |

## Free Sound Resources

You can download free sounds from:
- [Freesound.org](https://freesound.org/)
- [Mixkit](https://mixkit.co/free-sound-effects/)
- [Zapsplat](https://www.zapsplat.com/)

## Recommended Settings

- **File size**: Keep each file under 50KB for fast loading
- **Format**: MP3 (best browser support)
- **Quality**: 128kbps is sufficient for UI sounds
- **Volume**: Normalize all files to similar levels

## Implementation

The sounds are preloaded by `hooks/useNotifications.tsx` and cached for instant playback.

To use sounds in your components:
```tsx
import { playSound } from '@/hooks/useNotifications'

// Play a specific sound
playSound('messageReceived')
playSound('callConnected')
```
