# MindSpace

MindSpace is a standalone peer-support and emotional-wellbeing platform. Members can connect with trained volunteer listeners and use AI-assisted or self-guided wellbeing tools. The high-level listener experience is inspired by services such as 7 Cups, but MindSpace has its own identity, requirements, implementation, content, and product design.

MindSpace does **not** include licensed clinical care, an EMR, diagnosis, prescriptions, appointments, or FHIR integration. Safety resources and any human escalation are available only when explicitly staffed and operational.

The architecture and schemas in this repository are planning artifacts, not evidence that the described controls or services have already been implemented or approved.

## Product and system design documents

- [Business Requirements Document](docs/business%20requirement%20design.md)
- [Feature list](docs/feature-list.md)
- [User stories](docs/user-stories.md)
- [Technical architecture](docs/System%20Requirement%20Design.md)
- [Database schema blueprint](docs/database-schema.md)
- [ER diagram source (Mermaid)](docs/er-diagram.mmd)
- [Intake API implementation and setup](backend/mindspace-api/README.md)

## Core architecture principles

- Use a process-oriented modular monolith for the product API, with clear Peer Support, Wellbeing, Safety, Identity/Access, Workflow, and Audit boundaries.
- Treat peer conversations, private wellbeing records, and safety cases as distinct data domains. Do not copy data between them without a valid purpose, authorization, and auditable workflow.
- Make safety operations independent of AI availability. Do not promise monitoring, emergency dispatch, or response times unless people and procedures are actually staffed.
- Give AI agents no direct database credentials. Agents use typed, authorized application tools; their outputs are untrusted until validated and clearly presented as AI-generated.
- Use durable, versioned workflows for long-running processes, with human approvals, idempotent event handling, and a transactional outbox.
- Keep peer-support, wellbeing, safety, and operational data boundaries explicit; no clinical interoperability is part of this project.

## Standalone project status

The linked design documents describe MindSpace’s proposed architecture and conceptual data model; they are not evidence that every feature exists or is approved. A first standalone intake API implementation is in [`backend/mindspace-api`](backend/mindspace-api/README.md); it is not the complete MindSpace platform. The API uses MindSpace-owned identity configuration and a separate PostgreSQL database. Approve the safety, privacy, and security operating model before handling real member data, then introduce reviewed migrations incrementally.

## Local development

For the intake API, follow [`backend/mindspace-api/README.md`](backend/mindspace-api/README.md). Other product areas are not yet implemented. Use synthetic data for local development; do not use production member, peer-support, or wellbeing data.
