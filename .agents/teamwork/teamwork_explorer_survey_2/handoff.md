# Handoff Report: Profile Backend & Live User Integration Survey

**Agent**: Explorer 2 (Profile Backend Explorer)  
**Parent Orchestrator ID**: `f259537a-753b-4eb0-a461-a95fe0e79c51`  
**Working Directory**: `d:\Mindspace\.agents\teamwork\teamwork_explorer_survey_2\`  
**Timestamp**: 2026-11-02T14:10:00Z  

---

## 1. Observation

Direct code and architectural observations gathered through read-only inspection:

1. **Auth Route Handler and Cookie Creation**:
   In `frontend/src/app/api/auth/dev-login/route.ts`:
   - Lines 24–29:
     ```typescript
     const defaultRedirect =
       role === "doctor"
         ? `/bezs/telemedicine/doctor`
         : role === "admin"
         ? `/bezs/telemedicine/admin`
         : `/bezs/telemedicine/patient`;
     ```
   - Lines 37–81:
     `sessionData` is assembled in memory with `user` and `session` objects.
   - Lines 91–98:
     ```typescript
     const cookieStore = await cookies();
     cookieStore.set("drgodly_session", JSON.stringify(sessionData), cookieOptions);
     cookieStore.set("dev_token", "dev-jwt-token", cookieOptions);
     const response = NextResponse.json({ success: true, redirectUrl: fullRedirectUrl });
     response.cookies.set("drgodly_session", JSON.stringify(sessionData), cookieOptions);
     response.cookies.set("dev_token", "dev-jwt-token", cookieOptions);
     return response;
     ```
   - There are zero database calls (neither to PostgreSQL via Prisma nor via HTTP calls to `fhir-server` port 8000) inside `POST /api/auth/dev-login`.

2. **Session Retrieval**:
   In `frontend/src/modules/server/auth/get-session.ts`:
   - Lines 70–80:
     `getServerSession()` parses `cookieStore.get("drgodly_session")`.
   - Lines 85–105:
     Falls back to `fetch("${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/get-session")` with an AbortController timeout of 1200ms.

3. **Layout Prop Construction**:
   In `frontend/src/app/[locale]/(apps)/layout.tsx`:
   - Lines 24–30:
     ```typescript
     const user = {
       name: session.user.name,
       email: session.user.email,
       image: session.user.image,
       username: session.user.username,
       activeOrganizationId: session.session.activeOrganizationId,
     };
     ```
   - Lines 35–42:
     `<MenuBar {...user} />` and `<AppNavbar user={user} apps={apps} />` are rendered.
   - The field `role` is not extracted from `session.user.role` or `session.session.activeRole` and is omitted from `user`.

4. **Navbar & User Menu Components**:
   In `frontend/src/modules/client/shared/components/NavUser.tsx`:
   - Lines 16–21:
     ```typescript
     type TUser = {
       name: string;
       email: string;
       image?: string | null;
       username?: string | null;
     };
     ```
   - Lines 62–72:
     Displays `{name}`, `@{username}`, and `{email}` inside the dropdown. Role is neither accepted as a prop nor rendered.
   In `frontend/src/modules/client/shared/components/navbar/AppNavbar.tsx`:
   - Lines 15–21:
     `TUser` definition omits `role`.

5. **Sidebar User Component**:
   In `frontend/src/modules/client/shared/components/SidebarNavUser.tsx`:
   - Lines 18–23:
     ```typescript
     type TUser = {
       name: string;
       email: string;
       image?: string | null;
       username?: string | null;
     };
     ```
   - Lines 65–70:
     ```typescript
     <div className="grid flex-1 text-start text-sm leading-tight">
       <span className="truncate font-semibold">{name}</span>
       <span className="truncate text-xs text-muted-foreground">
         {email}
       </span>
     </div>
     ```
   - No user role is rendered anywhere in the component.

6. **Profile Guard Fallbacks**:
   In `frontend/src/modules/server/auth/require-profile.ts`:
   - Lines 40–78:
     `requirePatientProfile` races `getPatientMeAction()` against a 150ms timeout. When it times out or errors, it returns:
     ```typescript
     return {
       id: 1,
       user_id: "usr-patient-01",
       ...
       name: [{ use: "official", text: "Sarah Jenkins", family: "Jenkins", given: ["Sarah"] }],
       telecom: [{ system: "email", value: "patient@drgodly.com" }],
       ...
     };
     ```
   - Lines 87–133:
     `requirePractitionerProfile` races `getMyPractitionerAction()` against a 150ms timeout. When it times out or errors, it returns:
     ```typescript
     return {
       id: 1,
       user_id: "usr-doctor-01",
       ...
       name: [{ use: "official", text: "Dr. John Smith", family: "Smith", given: ["John"], prefix: ["Dr."] }],
       qualification: [{ code_text: "MD - General Medicine", code_display: "Doctor of Medicine" }],
       telecom: [{ system: "email", value: "doctor@drgodly.com" }],
       ...
     };
     ```

7. **Token Decoding in fhir-gql**:
   In `backend/fhir-gql/app/auth/dependencies.py`:
   - Lines 33–41:
     ```python
     if settings.ENVIRONMENT == "development" and (token == "dev-jwt-token" or token.startswith("dev-")):
         return {
             "sub": "dev-user-001",
             "name": "Dev Practitioner",
             "email": "doctor@drgodly.com",
             "role": "practitioner",
             "org_id": "org-default-01",
             "permissions": ["*"],
         }
     ```
   - The token `dev-jwt-token` yields `sub: "dev-user-001"`, which diverges from `dev-login`'s `usr-doctor-01` or `usr-patient-01`.

8. **FHIR Server Models and Persistence**:
   - `backend/fhir-server/app/models/practitioner/practitioner.py`:
     Table `practitioner` has columns `id`, `practitioner_id`, `user_id`, `org_id`, `active`, `gender`, `birth_date`.
     Related table `practitioner_name` has columns `practitioner_id`, `text`, `family`, `given`, `prefix`.
     Related table `practitioner_telecom` has columns `practitioner_id`, `system`, `value`.
   - `backend/fhir-server/app/models/patient/patient.py`:
     Table `patient` has columns `id`, `patient_id`, `user_id`, `org_id`, `active`, `gender`, `birth_date`.
     Related table `patient_name` has columns `patient_id`, `text`, `family`, `given`, `prefix`.
     Related table `patient_telecom` has columns `patient_id`, `system`, `value`.
   - `frontend/prisma/schema/schema.prisma`:
     Contains tables `intakes`, `consultations`, `ai_consultations`, `EmrChatSession`, `EmrChatMessage`. Contains **no** `User` table.

9. **Redirect Routing**:
   In `ORIGINAL_REQUEST.md`:
   - Doctor dashboard target: `/en/bezs/telemedicine/doctor/dashboard`
   - Patient dashboard target: `/en/bezs/telemedicine/patient`
   - Admin organizations target: `/en/bezs/telemedicine/admin/organizations`
   In `frontend/src/app/api/auth/dev-login/route.ts`:
   - Doctor redirects to `/bezs/telemedicine/doctor` (line 26)
   - Admin redirects to `/bezs/telemedicine/admin` (line 28)

---

## 2. Logic Chain

1. From **Observation 1**, `dev-login/route.ts` only sets browser cookies (`drgodly_session`, `dev_token`) and never communicates with PostgreSQL. Therefore, user registrations or logins never persist to PostgreSQL tables.
2. From **Observation 3, 4, and 5**, `(apps)/layout.tsx` does not supply `role` to the layout components, and neither `NavUser` nor `SidebarNavUser` accepts or renders a user role. Therefore, user roles are never rendered in the frontend header or sidebar even when present in the cookie session.
3. From **Observation 6**, the 150ms timeout in `require-profile.ts` aborts any slower backend fetch and unconditionally returns static hardcoded profile objects ("Dr. John Smith", "Sarah Jenkins"). Because these fallbacks do not inspect `getServerSession()`, user profiles in dashboard pages always revert to the hardcoded defaults regardless of the logged-in user.
4. From **Observation 7 and 8**, `fhir-gql` decodes `dev-jwt-token` to `sub: "dev-user-001"`, whereas `dev-login` issues `user.id: "usr-doctor-01"`. When `fhir-gql` queries `fhir-server` for `Practitioner` or `Patient` matching `user_id == actor.sub`, the query searches for `"dev-user-001"`, which fails to match profiles created under `"usr-doctor-01"`.
5. From **Observation 9 and 1**, `dev-login/route.ts` specifies `/bezs/telemedicine/doctor` instead of `/en/bezs/telemedicine/doctor/dashboard` and `/bezs/telemedicine/admin` instead of `/en/bezs/telemedicine/admin/organizations`, directly conflicting with Requirement R1.

---

## 3. Caveats

- **External BetterAuth Status**: BetterAuth (port 5001) is designed as a standalone IAM service and is not active in this development environment. All authentication relies on the internal `dev-login` cookie flow and `dev-jwt-token`.
- **Docker Services Inactive**: The Docker daemon was not running during this read-only inspection. When Docker containers (`fhir-server` on 8000, `fhir-gql` on 8005, Postgres on 5436/5434, Redis on 6381) are initialized, network ports must be verified to ensure clean startup without collisions.
- **Prisma vs FHIR Database**: The Prisma database (`drgodly`) does not store user profiles. All clinical profiles (doctor names, patient names, specialties, telecom contacts) belong in the FHIR database (`fhir-server` PostgreSQL).

---

## 4. Conclusion

The absence of live profile data in the Mindspace header, sidebar, and dashboard pages is caused by:
1. `dev-login` bypassing PostgreSQL persistence entirely.
2. `layout.tsx`, `AppNavbar`, `NavUser`, `MenuBar`, and `SidebarNavUser` omitting the `role` property and rendering logic.
3. `require-profile.ts` using hardcoded fallback mock profiles with an unrealistically short 150ms timeout.
4. Subject ID discrepancies between `dev-login` (`usr-${role}-01`) and `fhir-gql` (`dev-user-001`).
5. Redirect path divergence in `dev-login/route.ts`.

Remediation requires:
- Updating `dev-login/route.ts` to redirect to the exact R1 dashboard URLs and persist user/profile records to PostgreSQL.
- Passing `role` in `layout.tsx` and displaying it in `NavUser.tsx` and `SidebarNavUser.tsx`.
- Updating `require-profile.ts` to derive fallback profile identity dynamically from `getServerSession()` and extending the timeout to 1200ms.
- Aligning `dev-jwt-token` subject claims with session user IDs in `fhir-gql/app/auth/dependencies.py`.

---

## 5. Verification Method

To verify these findings and confirm resolution:

1. **Verify Redirect Routing**:
   Inspect `frontend/src/app/api/auth/dev-login/route.ts`:
   - Doctor redirect must resolve to `/en/bezs/telemedicine/doctor/dashboard`
   - Patient redirect must resolve to `/en/bezs/telemedicine/patient`
   - Admin redirect must resolve to `/en/bezs/telemedicine/admin/organizations`
   Execute `curl -X POST http://localhost:4000/api/auth/dev-login -H "Content-Type: application/json" -d "{\"role\":\"doctor\",\"locale\":\"en\"}"` and inspect `redirectUrl`.

2. **Verify Header and Sidebar Role Rendering**:
   Inspect `frontend/src/modules/client/shared/components/NavUser.tsx` and `SidebarNavUser.tsx` to verify `role` is accepted in props and rendered in the DOM.

3. **Verify PostgreSQL Persistence**:
   Inspect `fhir-server` PostgreSQL tables via SQL query:
   ```sql
   SELECT p.id, p.user_id, pn.text, pt.value 
   FROM practitioner p 
   JOIN practitioner_name pn ON p.id = pn.practitioner_id 
   JOIN practitioner_telecom pt ON p.id = pt.practitioner_id;
   ```
   Confirm that newly registered users appear in `practitioner` or `patient` tables.

4. **Verify Dynamic Profile Guard Fallbacks**:
   Inspect `frontend/src/modules/server/auth/require-profile.ts`:
   Confirm that fallback values are sourced from `session.user.name` and `session.user.email` rather than static strings.
