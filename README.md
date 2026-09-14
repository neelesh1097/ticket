# TicketPulse 🚀

> **Next-Generation Enterprise Support, Feature Request & Operations Management Portal**

TicketPulse is a modern, high-performance support portal built with **Next.js 16 (App Router & Turbopack)**, **TypeScript**, and **Tailwind CSS v4**. It bridges client issue tracking, subcontractor engineering teams, QA testing workflows, and community feature requests into a single unified platform.

---

## 🌟 Key Features & Recent Upgrades

### 1. ⚡ Direct Support Dispatch (Open Ticket Creation)
* **Instant Ticket Generation**: Anyone can raise support tickets immediately without waiting for Manager or Super Admin approval gates.
* **Direct Pipeline Routing**: Tickets default to operational status and are immediately visible to IT technical specialists and engineering units.
* **Rich Attachments**: Upload screenshots and files with image previews and instant full-size viewing.

### 2. 🎨 Next-Gen Theme & Dual Light/Dark Mode
* **Modern Cyber Palette**: Upgraded with Electric Indigo (`#6366F1`) and Cyber Cyan (`#06B6D4`) gradient accents.
* **Persistent Dark/Light Mode**: Smooth one-click toggle in the navigation bar with animated Sun/Moon icons and persistent user preference storage (`localStorage` & system preference fallback).
* **Next-Level Animation Suite**:
  * `pulse-radar`: Expanding radar ripple on active tickets and urgent status badges.
  * `float-slow`: Ambient hover elevations for cards and containers.
  * `glow-shift`: Shifting linear gradients for hero banners.
  * `glass-panel` & `glass-card`: Translucent glassmorphism with backdrop blurring.

### 3. 📝 Movable & Private Sticky Notes Widget
* **Drag-and-Drop Anywhere**: Smoothly drag notes across the entire screen on both desktop (mouse) and mobile devices (touch screen) with Pointer Events and boundary clamping.
* **Strict User Privacy**: Notes are isolated per user (`ticketpulse_notes_${userId}`) and stored locally. No other user can see your private notes or activity reminders.
* **Customization**:
  * 6 vibrant color themes (Cyber Amber, Electric Indigo, Emerald Mint, Rose Quartz, Cyber Cyan, Dark Slate).
  * Pin/unpin position on screen.
  * Minimize/expand note body.
  * Floating bottom-right launcher pill with live note counter.

### 4. 💡 Feature Suggestion & Upvoting Portal
* **Community Suggestions**: Submit improvement ideas with attached mockup screenshots.
* **Live Upvoting**: Real-time optimistic voting system.
* **One-Click Ticket Conversion**: Managers and Admins can assign suggestions to engineering teams or convert them directly into active support tickets.

### 5. 🛠️ IT Work Desk & Testing Audit Loop
* **Assigned Technical Work Desk**: Filter between active development tickets and items pending QA testing.
* **Environment Tagging**: Tag tickets by target environment (`DEV`, `UAT`, `PROD`) and Git branch/commit refs.
* **Work Logs & Timesheet**: Record hours spent, descriptions, and audit logs.

### 6. 👥 Role Governance & Team Rosters
* **Multi-Tier Role Access**:
  * Level 1: `GUEST_USER`
  * Level 2: `IT_SOFTWARE` (Specialist)
  * Level 3: `MANAGER`
  * Level 4: `SUPER_ADMIN`
* **Team Management**: Create subcontractor units, assign engineering members, and manage rosters.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **Next.js 16** | React Framework with App Router & Turbopack |
| **React 19** | Modern UI library |
| **TypeScript** | Type-safe application development |
| **Tailwind CSS v4** | Modern utility-first CSS with CSS variables & dark variant |
| **Lucide React** | Clean, modern iconography |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.18 or later
* **npm**, **yarn**, or **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/neelesh1097/ticket.git
   cd ticket
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/             # Super Admin control panel & timesheet audit
│   ├── login/             # Authentication & user sign-in
│   ├── profile/           # User profile & credentials management
│   ├── recommendations/   # Feature suggestion & upvoting portal
│   ├── team/              # Subcontractor teams & IT Work Desk
│   ├── tickets/           # Ticket listing & details
│   │   ├── [id]/          # Ticket thread, properties & work logs
│   │   └── new/           # Direct support ticket dispatch form
│   ├── globals.css        # Tailwind v4 setup, dark variant & keyframe animations
│   ├── layout.tsx         # Root layout with ThemeProvider & StickyNotes
│   └── page.tsx           # Dashboard overview & analytics
├── components/
│   ├── Navbar.tsx         # Top navigation bar with theme switcher
│   ├── RoleSwitcher.tsx   # Role switching toolbar for quick testing
│   └── StickyNotes.tsx    # Draggable, responsive private notes widget
├── context/
│   ├── AuthContext.tsx    # User session & permissions context
│   └── ThemeContext.tsx   # Light/Dark mode state with persistence
├── services/
│   ├── api/               # API client layer for tickets, teams, and suggestions
│   └── ticket.service.ts  # Ticket operational logic & permission rules
└── types/                 # Shared TypeScript models and interfaces
```

---

## 📄 License

This project is licensed under the MIT License.
