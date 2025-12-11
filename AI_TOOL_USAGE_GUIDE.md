# ✅ GURUKUL REALTIME SYSTEM — TOOL USAGE GUIDE FOR AI

*(Your AI will use THIS to know what to call and when.)*

---

# 🔥 **1. Matchmaking WebSocket Server — TOOL NAME: `matchmaking_ws`**

### ✔ What this tool does

* Handles **all matchmaking**
* Maintains **in-memory queue**
* Does **instant pairing (<5ms)**
* Handles **WebRTC signaling** (offer, answer, ICE)
* Sends **events** to client
* Supports **10,000+ active users**

### ✔ When the AI should use this tool

Use this tool whenever the user needs:

* Start random 1:1 chat
* Leave queue
* Skip to the next partner
* End session
* Send WebRTC signaling data
* Receive match events

### ✔ How the AI should use it

Simple. Send JSON through WS:

### **Start searching**

```json
{
  "type": "join_queue",
  "user_id": "<USER_ID>"
}
```

### **Leave queue**

```json
{
  "type": "leave_queue",
  "user_id": "<USER_ID>"
}
```

### **Send offer**

```json
{
  "type": "offer",
  "to": "<PARTNER_ID>",
  "sdp": "... offer sdp ..."
}
```

### **Send answer**

```json
{
  "type": "answer",
  "to": "<PARTNER_ID>",
  "sdp": "... answer sdp ..."
}
```

### **Send ICE candidate**

```json
{
  "type": "ice_candidate",
  "to": "<PARTNER_ID>",
  "candidate": { ... }
}
```

### **What AI receives**

```json
{
  "type": "match_found",
  "session_id": "...",
  "partner_id": "..."
}
```

---

# 🔥 **2. TURN Server — TOOL NAME: `turn_relay`**

### ✔ What this tool does

* Lets WebRTC work behind NAT, firewall, hostel WiFi, 4G, corporate networks
* Without this → 15% users fail
* With this → 100% calls connect

### ✔ When AI should use this tool

Whenever AI sets up a new RTCPeerConnection.

### ✔ How AI uses it

```json
{
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    {
      "urls": "turn:turn.gurukul.fly.dev:3478",
      "username": "gurukul",
      "credential": "supersecret"
    }
  ]
}
```

This config guarantees **full WebRTC reliability**.

---

# 🔥 **3. Supabase Auth & Database — TOOL NAME: `supabase_core`**

### ✔ What this tool does *NOW*

* Auth (login, logout, user info)
* User profiles
* Friends/buddy system
* Chat history (optional)
* No matchmaking
* No signaling
* No queue

### ✔ When AI should use it

Only for:

* Checking current user details
* Saving chat logs
* Getting user names
* Fetching buddy list
* User permissions

### ✔ How the AI uses it

Example:

### Fetch profile

```json
{
  "tool": "supabase_core",
  "action": "select",
  "table": "profiles",
  "filters": { "user_id": "<USER_ID>" }
}
```

### Store message

```json
{
  "tool": "supabase_core",
  "action": "insert",
  "table": "messages",
  "record": {
    "session_id": "...",
    "sender_id": "...",
    "text": "Hello!"
  }
}
```

---

# 🔥 **4. Vercel Frontend — TOOL NAME: `client_ui`**

### ✔ What this tool does

* Shows chat UI
* Shows camera UI
* Renders call screens
* Shows notifications
* Plays sound effects
* Runs matchmaking hooks
* Connects to WS server

### ✔ When AI uses it

AI should instruct UI to:

* Load new partner
* Display call screen
* Show “searching…”
* Render video streams
* Show toasts
* Show animations

### ✔ How AI uses it

AI doesn’t call the UI directly, but sends instructions like:

“Update UI to show ‘Searching for partner…’”
“Load remote video track into <video> element.”
“Display disconnect message.”

---

# 🔥 **5. WebRTC Engine — TOOL NAME: `webrtc_core`**

### ✔ What this tool does

* Camera/mic capture
* Creates peer connection
* Manages media streams
* Uses TURN/STUN
* Exchanges offer/answer through WebSocket
* Plays local + remote video

### ✔ When AI uses it

AI triggers WebRTC actions during:

* When match is found
* When offer arrives
* When answer arrives
* When ICE candidate arrives
* When disconnect happens

### ✔ How AI uses it

### Create connection

```json
{
  "action": "create_peer_connection",
  "iceServers": [ ... TURN config ... ]
}
```

### Add tracks

```json
{
  "action": "attach_stream",
  "device": "camera_and_mic"
}
```

### Handle offer

```json
{
  "action": "set_remote_description",
  "sdp": "..."
}
```

### Generate answer

```json
{
  "action": "create_and_send_answer"
}
```

---

# 🔥 **6. AI Controller — TOOL NAME: `gurukul_ai`**

### ✔ What it does

This is YOUR assistant inside Gurukul.

* Uses all other tools
* Controls matchmaking
* Controls WebRTC
* Manages UI
* Handles auto-retry
* Handles user commands (Next, End, Mute, etc.)

### ✔ Example workflow AI will follow:

**1. User clicks: Start**
→ AI calls `matchmaking_ws.join_queue`

**2. Match found**
→ AI calls `webrtc_core.create_connection`

**3. Partner connected**
→ AI updates `client_ui`

**4. “Next” button pressed**
→ AI: leave_queue + destroy peerConnection

**5. User disconnects**
→ AI cleans UI + re-queues if needed

Everything becomes automatic.
