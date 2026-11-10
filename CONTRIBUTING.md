# Contributing to MindSpace

Thank you for your interest in contributing to **MindSpace**! We welcome contributions that help us build a safe, resilient, and empathetic emotional wellbeing and peer-support platform.

Please review this guide before submitting issues or pull requests.

---

## 🏛️ Architecture & Code Standards

MindSpace strictly follows **Clean Architecture**:

1. **Domain Isolation**: Business rules and entities must remain independent of frameworks, databases, and UI libraries.
2. **Interface Adapters**: Controllers, presenters, and gateways handle translation between the use cases and external systems (Fastify routes, React components, MCP tools).
3. **Security by Design**:
   - Never write raw sensitive data to persistent stores without AES-256-GCM encryption.
   - Never provide LLM agents direct database credentials. Use typed Model Context Protocol (MCP) tool endpoints.
4. **Type Safety**: All TypeScript code must compile without errors using strict type checking (`pnpm build`).

---

## 🛠️ Development Setup

1. **Fork and clone** the repository:
   ```bash
   git clone https://github.com/<your-username>/mindspace.git
   cd mindspace
   ```

2. **Backend API Setup**:
   ```bash
   cd backend/mindspace-api
   cp .env.example .env
   docker compose up -d mindspace-postgres
   pnpm install
   pnpm db:migrate
   pnpm db:generate
   pnpm dev
   ```

3. **Frontend Client Setup**:
   ```bash
   cd frontend
   cp .env.example .env
   pnpm install
   pnpm db:generate
   pnpm dev
   ```

4. **Verify tests pass**:
   ```bash
   # In backend/mindspace-api:
   pnpm test

   # In frontend:
   pnpm lint
   pnpm build
   ```

---

## 🔀 Branching & Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. Commit your changes following conventional commits:
   - `feat(peer-support): add capacity check for listeners`
   - `fix(encryption): handle key rotation edge case`
   - `docs(readme): clarify clean architecture layers`

3. Push your branch and open a Pull Request against `main`.
4. Ensure all CI checks and tests pass before requesting review.

---

## 🔒 Code of Conduct & Safety Boundaries

MindSpace handles personal wellbeing disclosures and non-clinical emotional support:
- Maintain empathetic, respectful language in all code comments, documentation, and discussions.
- Adhere strictly to the non-clinical boundary: do not implement features that attempt medical diagnoses, drug prescriptions, or clinical triage without authorized human supervision.

