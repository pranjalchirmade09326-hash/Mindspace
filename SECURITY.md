# Security Policy
MindSpace treats member data privacy and security with the highest level of care. Because our platform manages sensitive emotional wellbeing disclosures and peer-support conversations, we enforce strict architectural and operational safeguards.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## 🔒 Security Architecture Highlights

1. **Application-Level AES-256-GCM Encryption**: All personal wellbeing entries, journals, and intake responses are encrypted prior to database persistence.
2. **Zero Direct DB Access for AI**: AI models and agent runtimes are decoupled from the database and interact strictly through typed, authenticated API/MCP gateways.
3. **Owner-Bound JWT Claims**: Authorization enforces principal ownership against remote JWKS; tokens cannot act outside their cryptographic subject (`sub`).
4. **Deterministic Crisis Sentinel**: Safety risk detection runs via deterministic pattern matchers in the gateway prior to any LLM processing.

---

## Reporting a Vulnerability

If you discover a security vulnerability in MindSpace, please do **not** open a public issue.

Instead, please report it privately:

1. **Email**: Send vulnerability reports to `security@mindspace.org` (or contact the repository maintainers directly).
2. **Details to include**:
   - Type of issue (e.g., encryption bypass, IDOR, token verification flaw, injection)
   - Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue
   - Affected components (`mindspace-api`, `frontend`, `agents`)
   - Potential impact on member privacy or platform safety

### Response Timeline
- **Initial Response**: Within 48 hours of receipt.
- **Triage & Status Update**: Within 5 business days.
- **Fix & Public Disclosure**: Coordinated disclosure after remediation is deployed.

