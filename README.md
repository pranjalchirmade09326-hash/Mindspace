# MindSpace – Peer Support & Emotional Wellbeing Platform

### Standalone Peer Support & Personal Emotional Wellbeing Application

A full-stack web application designed to provide a safe and supportive environment where members can connect with trained volunteer listeners, share their feelings, and access AI-assisted or self-guided emotional wellbeing tools.

## 🚀 Key Features

### 👤 1. Member Management & Authentication

- User Registration: Members can create accounts and access the platform through Sign Up and Sign In.
- Member Profiles: Manage personal information and account details.
- Role-Based Access: Separate experiences for Members and Listeners.
- Secure Authentication: Backend authentication and protected API access.

### 💬 2. Peer Support & Listener Connection

- Listener Discovery: Members can explore available volunteer listeners.
- Listener Profiles: View listener information and areas of support.
- Support Sessions: Connect members with listeners for peer-support conversations.
- Listener Dashboard: Dedicated dashboard for listeners to manage their support activities.

### 🤖 3. AI Voice & Chat Agents

- Chat-Based Support: AI-assisted conversational support.
- Voice-Based Support: Voice interaction for users who prefer speaking instead of typing.
- Agent Service: Separate agent service for handling AI voice and chat interactions.
- Wellbeing Assistance: Provides supportive conversations and self-guided emotional wellbeing experiences.

### 📊 4. Member & Listener Dashboards

- Member Dashboard: Access personal activities, listener connections, and wellbeing features.
- Listener Dashboard: View assigned support activities and relevant member interactions.
- Mock Data Integration: Dashboard currently uses mock data for demonstrating the interface and workflows.

## 🛠️ Technology Stack

- Frontend: React.js
- Backend: Node.js / TypeScript
- Database: PostgreSQL
- ORM / Database Tools: Prisma
- AI Agents: Python-based Agent Service
- Voice & Chat: Voice and chat agent integration
- Containerization: Docker & Docker Compose
- Package Management: pnpm

## ⚙️ Installation & Configuration

### Prerequisites

1. Install Node.js and pnpm.
2. Install Python.
3. Install Docker Desktop.
4. Configure the required environment variables.

### Step 1: Start Backend API

```
cd D:\Mindspace-new\mindspace-new-\backend\mindspace-api

copy .env.example .env

docker compose up -d mindspace-postgres

pnpm install
pnpm db:migrate
pnpm db:generate
pnpm dev
```

Backend API runs on port 8080.

### Step 2: Start AI Agents Service

```
cd D:\Mindspace-new\mindspace-new-\agents

docker compose up -d
```

AI Agent service runs on port 8018.

### Step 3: Start Frontend

```
cd D:\Mindspace-new\mindspace-new-\frontend

pnpm install
pnpm dev
```

### Step 4: Test & Verify

Backend Testing

```
cd backend/mindspace-api
pnpm test
```

Frontend Testing

```
cd frontend
pnpm lint
pnpm build
```

## 🔒 Important Notes

- MindSpace is a standalone peer-support and emotional-wellbeing platform.
- It is not a clinical healthcare or medical diagnosis platform.
- It does not include EMR, prescriptions, doctor appointments, or FHIR integration.
- Listener support depends on trained volunteers and operational availability.
- AI-assisted support is intended for wellbeing conversations, not clinical treatment.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details