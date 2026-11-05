Build completely separate, dedicated role-based dashboards for Member and Listener in the MindSpace frontend, keeping their workspaces strictly distinct with dedicated sub-pages and rich client-side mock data.

Working directory: d:\Mindspace
Integrity mode: development

## Requirements

### R1. Role-Separated Workspaces & Routing
Implement completely separate dashboard layouts and navigation for `member` and `listener` roles in `frontend/src/app/[locale]/(apps)/mindspace/` (analogous to patient vs doctor portals in healthcare applications). Provide dedicated routes (such as `/mindspace/member` and `/mindspace/listener`) and a role-switcher control in the layout to switch views during testing. Under no circumstances should member and listener features or navigation be combined into a single view.

### R2. Member Dashboard & Sub-pages
Implement the Member workspace with dedicated sub-pages and interactive client mock state for:
- My Support (overview of peer support connections and upcoming sessions)
- Wellbeing (self-care metrics, wellness check-in summaries)
- Mood tracking (daily mood logging, history charts, emotion tags)
- Journal (entry list, creation/viewing modal or page, tags)
- Goals (goal progress tracking, completion status)
- Privacy & Consent (data sharing settings, anonymity preferences)

### R3. Listener Dashboard & Sub-pages
Implement the Listener workspace completely separate from the Member workspace, with dedicated sub-pages and interactive client mock state for:
- Peer Support Queue (incoming member help requests with status and triage details)
- Active Conversations (ongoing peer chats and conversation history)
- Training Modules (learning modules, completion tracking, guidelines)
- Availability Toggles (status control for active listening hours and intake status)

### R4. Mock Data & Frontend State
Populate all Member and Listener pages with realistic, rich mock data and client-side state interactions (e.g., toggles, filters, and mock actions). No live backend API changes or external services are required.

## Acceptance Criteria

### Role Separation & Routing
- [ ] Navigating to `/mindspace/member` displays exclusively Member features, layout, and sub-navigation with zero Listener elements.
- [ ] Navigating to `/mindspace/listener` displays exclusively Listener features, layout, and sub-navigation with zero Member elements.
- [ ] The layout includes an accessible role switcher or toggle control that reliably transitions between Member and Listener workspaces.

### Member Workspace Completeness
- [ ] Member sub-pages render without runtime errors: My Support, Wellbeing, Mood tracking, Journal, Goals, and Privacy & Consent.
- [ ] Each Member sub-page displays complete, context-appropriate mock data and interactive UI elements.

### Listener Workspace Completeness
- [ ] Listener sub-pages render without runtime errors: Peer Support Queue, Active Conversations, Training Modules, and Availability Toggles.
- [ ] The availability toggle can be toggled interactively and reflects state in the UI.
- [ ] Each Listener sub-page displays complete, context-appropriate mock data.

### Verification
- [ ] Automated tests (component tests or automated routing/rendering test scripts) pass and verify that all Member and Listener routes render successfully and maintain role separation.
