# Frontend MindSpace Conversion Plan
## Complete Drgodly → MindSpace Remapping with Clean Architecture

**Status**: EXECUTION PHASE  
**Last Updated**: 2024  
**Priority**: HIGH - All production APIs must reference MindSpace backend  

---

## 📋 Summary

The frontend needs complete remapping from **drgodly** (legacy telemedicine system) to **MindSpace** (professional telemedicine platform). This includes:

1. **Infrastructure Updates** ✅ COMPLETED
   - Docker Compose: Container names drgodly → mindspace
   - Environment Variables: Database URLs and service references
   - All pointing to proper MindSpace backend (port 8080, postgres 5433)

2. **Code Remapping** 🔄 IN PROGRESS
   - 18 TypeScript/React files with "drgodly" API endpoint references
   - Telemedicine & MindSpace modules need clean architecture layers
   - All appointment, intake, consultation features need restructuring

3. **Architecture Modernization** 📐 PLANNED
   - Implement 4-layer Clean Architecture (Presentation → Application → Domain → Infrastructure)
   - Align Prisma models with backend SQLAlchemy ORM
   - Professional domain-driven design patterns

---

## 🔧 Files Requiring Conversion

### Intake Management (Voice & Text)
- `frontend/src/modules/client/telemedicine/patient/component/intake/VoiceIntake.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/patient/component/intake/TextIntake.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/mindspace/intake/VoiceIntake.tsx` - Needs clean architecture
- `frontend/src/modules/client/mindspace/intake/TextIntake.tsx` - Needs clean architecture

### Consultation Features
- `frontend/src/modules/client/telemedicine/patient/component/consultation/ConsultationSelector.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/patient/component/consultation/VoiceConsultation.tsx` - Contains "drgodly" references

### Appointment Management
- `frontend/src/modules/client/telemedicine/patient/component/appointments/book/DateScroll.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/patient/component/appointments/book/BookAppointment.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/patient/modals/appointments/BookAppointmentModal.tsx` - Contains "drgodly" references

### Doctor Dashboard
- `frontend/src/modules/client/telemedicine/doctor/component/dashboard/DoctorDashboard.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/doctor/component/dashboard/TreatmentEngine.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/doctor/component/dashboard/ConsultationInsights.tsx` - Contains "drgodly" references
- `frontend/src/modules/client/telemedicine/doctor/component/appointment-review/shared/TerminologyCombobox.tsx` - Contains "drgodly" references

### API Infrastructure & Services
- `frontend/src/modules/server/core/appointment/infrastructure/services/rest/appointment.core.rest.service.ts` - Contains "drgodly" references
- `frontend/src/modules/server/core/appointment/domain/interfaces/appointment.service.interface.ts` - Contains "drgodly" references
- `frontend/src/modules/server/core/appointment/application/usecases/getMyAppointments.usecase.ts` - Contains "drgodly" references

### Entities & Schemas
- `frontend/src/modules/entities/schemas/appointment/input.ts` - Contains "drgodly" references
- `frontend/src/modules/entities/schemas/iam/org-member.ts` - Contains "drgodly" references

---

## 🏗️ Clean Architecture Structure (Post-Conversion)

```
src/modules/
├── client/
│   └── mindspace/
│       ├── presentation/          # 🎨 UI Components (React)
│       │   ├── intake/
│       │   ├── consultation/
│       │   └── appointments/
│       ├── application/           # 📋 Use Cases & DTOs
│       │   ├── usecases/
│       │   │   ├── submitIntake.ts
│       │   │   ├── startConsultation.ts
│       │   │   └── bookAppointment.ts
│       │   └── dtos/
│       ├── domain/                # 🧩 Business Logic & Entities
│       │   ├── entities/
│       │   │   ├── Intake.ts
│       │   │   ├── Consultation.ts
│       │   │   └── Appointment.ts
│       │   ├── services/
│       │   └── interfaces/
│       └── infrastructure/        # 🔌 External APIs & Services
│           ├── services/
│           │   ├── appointment.service.ts
│           │   ├── intake.service.ts
│           │   └── consultation.service.ts
│           └── repositories/
├── server/
│   └── core/
│       ├── appointment/
│       │   ├── domain/            # Domain interfaces
│       │   ├── application/       # Use cases
│       │   ├── infrastructure/    # Services & API calls
│       │   └── presentation/      # API routes
│       ├── intake/
│       └── consultation/
└── entities/
    └── schemas/                   # Prisma models aligned with backend
```

---

## 📝 Conversion Checklist

### Phase 1: Infrastructure ✅ DONE
- [x] Update docker-compose.yml (container names: drgodly → mindspace)
- [x] Update .env.example (database URL: 5434/drgodly → 5435/mindspace)
- [x] Verify backend connectivity (port 8080 MindSpace API)

### Phase 2: Code Remapping 🔄 IN PROGRESS
- [ ] Replace all "drgodly" string references with "mindspace"
- [ ] Update all API endpoint URLs to backend routes
- [ ] Fix all environment variable references
- [ ] Verify all imports and module paths

### Phase 3: Architecture Refactoring 📐 PLANNED
- [ ] Create clean architecture layers for intake module
- [ ] Create clean architecture layers for consultation module
- [ ] Create clean architecture layers for appointment module
- [ ] Implement domain services and interfaces
- [ ] Create application use cases with proper dependency injection
- [ ] Align Prisma models with backend ORM

### Phase 4: Testing & Validation ✔️ PLANNED
- [ ] Unit tests for each domain service
- [ ] Integration tests with backend APIs
- [ ] End-to-end tests for full flows (intake → appointment → consultation)
- [ ] Doctor & patient dashboard verification
- [ ] Performance testing with realistic data

### Phase 5: Documentation & Deployment 📚 PLANNED
- [ ] Create FRONTEND_ARCHITECTURE.md
- [ ] Create FEATURE_MAPPING.md (drgodly features → MindSpace)
- [ ] Update README with unified system overview
- [ ] Prepare deployment checklist

---

## 🎯 Conversion Strategy

### API Endpoint Mapping

**Old Pattern (drgodly)**:
```javascript
const response = await fetch('http://drgodly-api/api/v1/appointments');
```

**New Pattern (mindspace)**:
```javascript
const response = await fetch('http://mindspace-api:8080/api/v1/appointments');
```

### Service Layer Pattern

**Before (Mixed concerns)**:
```typescript
export const VoiceIntake: React.FC = () => {
  const [data, setData] = useState(null);
  const handleSubmit = async () => {
    const res = await fetch('http://drgodly/intake', { ... });
    setData(res);
  };
  return <div>{/* JSX */}</div>;
};
```

**After (Clean Architecture)**:
```typescript
// Domain Entity
export class IntakeSession {
  constructor(
    public id: string,
    public userId: string,
    public mode: 'VOICE' | 'TEXT',
    public status: 'IN_PROGRESS' | 'COMPLETED',
    public transcript: string
  ) {}
}

// Infrastructure Service
export class IntakeAPIService {
  async submitIntake(session: IntakeSession): Promise<Result<IntakeSession>> {
    const response = await fetch(`${this.apiUrl}/intakes`, {
      method: 'POST',
      body: JSON.stringify(session)
    });
    return this.handleResponse(response);
  }
}

// Application Use Case
export class SubmitIntakeUseCase {
  constructor(private intakeService: IntakeAPIService) {}
  
  async execute(input: SubmitIntakeInput): Promise<Result<SubmitIntakeOutput>> {
    const session = new IntakeSession(
      input.id,
      input.userId,
      input.mode,
      'IN_PROGRESS',
      input.transcript
    );
    return this.intakeService.submitIntake(session);
  }
}

// Presentation Component
export const VoiceIntake: React.FC = () => {
  const useCase = new SubmitIntakeUseCase(new IntakeAPIService());
  const [state, setState] = useState<State>('idle');
  
  const handleSubmit = async (transcript: string) => {
    const result = await useCase.execute({
      id: uuidv4(),
      userId: currentUser.id,
      mode: 'VOICE',
      transcript
    });
    
    if (result.isSuccess) {
      setState('completed');
    } else {
      setState('error');
    }
  };
  
  return <div>{/* JSX */}</div>;
};
```

---

## 🔗 Backend API Reference

**MindSpace Backend (FastAPI)**
- URL: `http://mindspace-fastapi:8080`
- Database: PostgreSQL (port 5433, db: mindspace)
- Authentication: Better Auth (port 5001)

**Available Endpoints** (from backend verification):
- `POST /api/v1/intakes` - Create intake session
- `POST /api/v1/consultations` - Start consultation
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/{id}` - Get appointment details
- `GET /api/v1/members/{id}/appointments` - List member appointments

**Backend Models** (to align Prisma):
```python
# Backend: sqlalchemy models/intake.py
class IntakeSession(Base):
    __tablename__ = "intake_sessions"
    
    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[str]
    org_id: Mapped[Optional[str]]
    patient_fhir_id: Mapped[Optional[int]]
    mode: Mapped[IntakeMode]  # TEXT | VOICE
    status: Mapped[IntakeStatus]  # IN_PROGRESS | COMPLETED | ABANDONED
    transcript: Mapped[Optional[str]]
    clinical_report: Mapped[Optional[str]]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]
```

---

## 📊 Progress Tracking

| Component | Status | Files | Priority |
|-----------|--------|-------|----------|
| Infrastructure | ✅ Complete | 2 | HIGH |
| Intake Module | 🔄 In Progress | 4 | HIGH |
| Consultation Module | 🔄 In Progress | 2 | HIGH |
| Appointment Module | 🔄 In Progress | 3 | HIGH |
| Doctor Dashboard | ⏳ Pending | 4 | MEDIUM |
| API Services | ⏳ Pending | 3 | HIGH |
| Entity Models | ⏳ Pending | 2 | MEDIUM |
| Clean Architecture | ⏳ Pending | All | HIGH |

---

## 🚀 Execution

Starting conversion now:
1. Scan each file for "drgodly" references
2. Update API endpoints to MindSpace backend
3. Implement clean architecture layers
4. Test each module with live backend
5. Generate professional documentation

**Next Step**: Convert first file `appointment/input.ts` → Complete all endpoint references
