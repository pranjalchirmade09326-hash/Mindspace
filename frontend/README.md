# MindSpace — Frontend Application

[![Stack: Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015%20(App%20Router)-black)](https://nextjs.org/)
[![UI: React 19](https://img.shields.io/badge/UI-React%2019%20%7C%20Tailwind%20CSS-blue)](https://react.dev/)
[![Auth: Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-purple)](https://better-auth.com/)
[![Realtime: LiveKit & Vapi](https://img.shields.io/badge/Voice-LiveKit%20%26%20Vapi-red)](https://livekit.io/)

The modern, responsive web frontend for the **MindSpace** peer-support and emotional wellbeing platform. Built on **Next.js 15 App Router** and **React 19**, it provides accessible workspaces for members, listeners, supervisors, and platform administrators.

---

## 🏛️ Clean Module Architecture

The frontend follows a domain-driven Clean Architecture structure inside `src/`:

```
frontend/src/
├── app/                        # Delivery Layer: Next.js 15 App Router pages & API routes
│   ├── (auth)/                 # Authentication flows (Sign in, Sign up, Onboarding)
│   ├── (client)/               # Member workspace & wellbeing tools
│   ├── (listener)/             # Volunteer listener hub & active chats
│   └── (admin)/                # Operations, safety sentinel & supervisor console
├── components/                 # Presentation Layer: Reusable atomic design components
│   ├── ui/                     # Base design system widgets (buttons, modals, forms)
│   └── common/                 # Layouts, navigation headers, and footers
├── modules/                    # Application / Use Case Layer: Feature-driven domain modules
│   ├── client/                 # Member workflows: mood trackers, private journal, intake
│   ├── listener/               # Listener tools: offer acceptance, active peer chat
│   └── admin/                  # Administrative tools: safety cases, listener roster review
├── hooks/                      # Interface Adapters: TanStack React Query & custom state hooks
├── lib/                        # Infrastructure Layer: API client, Better Auth client, helpers
├── providers/                  # Application Contexts: Theme, Auth, QueryClient, Toast
└── types/                      # Domain interfaces, API schemas, and DTOs
```

---

## 🚀 Key User Experiences

1. **Member Workspace**:
   - **AI Companion & Grounding**: Interactive voice & chat wellbeing companion.
   - **Private Mood Journal**: Mood check-ins, personal reflection prompts, and emotional trajectory graphs.
   - **Peer Support Requests**: Connect with trained listeners based on shared topics and availability.
2. **Listener Hub**:
   - **Match Offers**: View, accept, or decline pending member match requests.
   - **Secure Peer Chat**: Real-time supportive conversations with members.
   - **Availability Management**: Schedule active listening hours and manage conversation capacity.
3. **Supervisor & Safety Desks**:
   - **Review Console**: Listener onboarding status, training records, and conduct reports.
   - **Safety Sentinel**: Immediate intervention desk for high-risk member crisis escalations.

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** `>= 22`
- **pnpm** `>= 9`
- Running Backend API (`http://localhost:8080`)

### Installation & Run

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *Ensure `NEXT_PUBLIC_API_URL` points to your running `mindspace-api` (`http://localhost:8080`).*

3. **Generate Prisma client:**
   ```bash
   pnpm db:generate
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:4000](http://localhost:4000) in your browser.

---

## 🧪 Testing & Linting

```bash
# Run ESLint validation
pnpm lint

# Production build check
pnpm build
```

---

## 🔒 Security & Data Boundaries

- All sensitive member interactions are protected by JWT tokens validated against the MindSpace identity provider.
- Audio streams are ephemeral via LiveKit / Vapi; no raw audio is retained on the client or sent to persistent browser storage.
