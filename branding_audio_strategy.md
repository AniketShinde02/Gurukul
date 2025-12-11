# Audio Assets & Branding Strategy

## 🎵 Sound Effects Master List

To create a premium, "Standard" user experience, we need to add physical `.mp3` files for the following physical interactions.

**Action Item:** Find/Generate these files and place them in `public/sounds/`.

### 💬 Messaging
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Send Message** | User hits "Send" | `message_send.mp3` | A crisp, satisfying "pop" or "swoosh". Short & non-intrusive. | ✅ Wired |
| **Receive (DM)** | Message Arrives (DM) | `message_receive.mp3` | A distinct high-pitch "ting", "droplet", or glass tap. | ✅ Wired |
| **Receive (Room)** | Message Arrives (Room) | `message_room.mp3` | Softer, lower volume "tick" or "thock" (less intrusive than DM). | ✅ Wired |

### 📞 Calls & Video
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Incoming Call** | Incoming Call Screen | `call_in_ring.mp3` | **Looping.** Ethereal, melodic. Like a flute or soft synth. Distinct from standard phones. | ⏳ Pending |
| **Call Connected** | Call Connected | `call_connect.mp3` | Major key chord or ascending "active" tone. Positive & uplifting. | ⏳ Pending |
| **Call Ended** | Call Ended | `call_disconnect.mp3` | Descending tones. Gentle "power down" or soft click. | ✅ Wired |
| **Join Voice** | User Joins Voice | `user_join.mp3` | A polite "door open" click or bubble sound. | ⏳ Pending |
| **Leave Voice** | User Leaves Voice | `user_leave.mp3` | A polite "door close" or reverse bubble sound. | ⏳ Pending |

### 🤝 Matching
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Searching** | "Finding Guru..." | `radar_ping.mp3` | **Looping.** A sonar ping or heartbeat. Mysterious. | ⏳ Pending |
| **Match Found** | Match Found! | `match_found.mp3` | A "Gong" or magical chime. Big impact, high quality resonance. | ✅ Wired |

### 🍅 Timer & Focus
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Timer Start** | Timer Start | `timer_start.mp3` | Wind-up ticking sound or mechanical click. | ⏳ Pending |
| **Timer End** | Timer Ends (Alarm) | `singing_bowl.mp3` | A resonating Tibetan singing bowl (very spiritual). Pure tone. | ⏳ Pending |

### ✨ Gamification (XP)
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **XP Gained** | XP Gained / Level Up | `xp_gain_chime.mp3` | Video game style "coin collect" but with a zen twist (e.g. bamboo hit). | ⏳ Pending |

### ⚠️ System
| Event | Action / Trigger | Filename | Vibe / Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Error** | Error / Ban | `error_thud.mp3` | Low frequency "thud", "buzz" or low wood block. | ⏳ Pending |
| **Success** | Success / Saved | `success_chime.mp3` | Light, airy harmonic series. | ⏳ Pending |

---

## 🎧 Implementation Status

### ✅ Completed (Wired & Ready)
The following sound triggers are **fully implemented** and will play as soon as you add the `.mp3` files:

1.  **Message Send** - Plays when user sends a message (DM or Room)
2.  **Message Receive (DM)** - Plays when receiving a DM
3.  **Message Receive (Room)** - Plays when receiving a room message
4.  **Match Found** - Plays when a study partner is matched
5.  **Call Disconnect** - Plays when ending a call

### ⏳ Pending Implementation
These sounds are defined but not yet wired to UI events:
- Call Incoming (ringtone loop)
- Call Connect
- User Join/Leave Voice
- Timer Start/End
- XP Gain
- Error/Success system sounds

---

## 🏷️ Brand Name Suggesions

Target: Blending **Ancient Indian Wisdom** with **Gen Z / Tech Culture**.
*Previous Project Ref: Capgen (Caption + Generator)*

### Hybrid Portmanteaus (Strongest Contenders)
1.  **ZenGen**
    *   *Zen + GenZ/Generation*
    *   *Slogan: "The Zen Generation."*
    *   *Why:* Extremely catchy, short, and perfectly describes the target audience.

2.  **Zashram**
    *   *Z (Gen Z) + Ashram*
    *   *Slogan: "Your Digital Sanctuary."*
    *   *Why:* Unique, owns the "Ashram" concept but modernizes it instantly with the "Z".

3.  **VedaSync**
    *   *Veda (Wisdom) + Sync (Tech)*
    *   *Slogan: "Ancient Wisdom, Synced."*
    *   *Why:* Sounds professional, premium, and trustworthy.

4.  **Tapasya.io**
    *   *Tapasya (Deep Focus)*
    *   *Why:* A bit traditional, but "Tapas" is a cool word for "Deep Work" or "Grind".

### Spiritual + Tech "Vibes"
5.  **InnerNet**
    *   *Play on Internet*
    *   *Slogan: "Connect to your InnerNet."*
    *   *Why:* Clever wordplay, spiritual meaning.

6.  **AuraFlow**
    *   *Slogan: "Find your flow."*
    *   *Why:* "Aura" and "Flow" are both very popular Gen Z aesthetic terms.

7.  **KarmaCode**
    *   *Why:* A bit edgy, good for gamification/XP focus.

### The "One Word" Brands
8.  **Sangha** (Community) - *Hard to get domain.*
9.  **Vidya** (Knowledge)
10. **Dharma** (Duty/Path)

### Recommendation matches
**ZenGen** or **Zashram** seem to fit the "Capgen" (Short, 2-syllable, Descriptive) heuristic best.
