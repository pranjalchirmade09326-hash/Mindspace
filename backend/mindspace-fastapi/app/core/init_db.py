from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import encrypt_content
from app.models.member import AppPrincipal, MemberProfile, MemberPreference
from app.models.peer import ListenerProfile, ListenerMatchRequest, ListenerMatch, PeerConversation, PeerMessage
from app.models.wellbeing import WellbeingGoal, MoodEntry
from app.models.intake import IntakeSession
from datetime import datetime, timezone, timedelta
import uuid

async def init_and_seed_db():
    try:
        # 1. Create tables if they do not exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # 2. Seed default data if empty
        async with AsyncSessionLocal() as db:
            # Check if member already exists
            member_user_id = "usr-demo-member-01"
            res = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == member_user_id))
            if not res.scalar_one_or_none():
                # Add demo member
                member_principal = AppPrincipal(user_id=member_user_id, account_state="active")
                db.add(member_principal)
                await db.flush()

                member_profile = MemberProfile(
                    user_id=member_user_id,
                    display_name="Priya Sharma",
                    eligibility_state="verified",
                    profile_state="active"
                )
                db.add(member_profile)

                member_pref = MemberPreference(
                    user_id=member_user_id,
                    locale="en",
                    timezone="Asia/Kolkata",
                    preferred_languages=["English", "Hindi"]
                )
                db.add(member_pref)

                # Add demo listener
                listener_user_id = "usr-demo-listener-01"
                listener_res = await db.execute(select(AppPrincipal).where(AppPrincipal.user_id == listener_user_id))
                if not listener_res.scalar_one_or_none():
                    db.add(AppPrincipal(user_id=listener_user_id, account_state="active"))
                    await db.flush()

                    db.add(MemberProfile(
                        user_id=listener_user_id,
                        display_name="Aarav Sharma (Verified Peer Listener)",
                        eligibility_state="verified"
                    ))

                listener_prof_res = await db.execute(select(ListenerProfile).where(ListenerProfile.user_id == listener_user_id))
                listener = listener_prof_res.scalar_one_or_none()
                if not listener:
                    listener = ListenerProfile(
                        id=uuid.uuid4(),
                        user_id=listener_user_id,
                        application_state="approved",
                        eligibility_state="eligible",
                        capacity_limit=3,
                        profile_languages=["English", "Hindi"]
                    )
                    db.add(listener)
                    await db.flush()

                # Add sample goals (AES-256-GCM encrypted)
                g1_ct, g1_kv = encrypt_content("15-minute daily mindfulness breathing")
                g2_ct, g2_kv = encrypt_content("Evening digital screen wind-down before 10 PM")
                
                db.add(WellbeingGoal(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    goal_ciphertext=g1_ct,
                    key_version=g1_kv,
                    status="active",
                    target_date=datetime.now(timezone.utc).date() + timedelta(days=10)
                ))
                db.add(WellbeingGoal(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    goal_ciphertext=g2_ct,
                    key_version=g2_kv,
                    status="active",
                    target_date=datetime.now(timezone.utc).date() + timedelta(days=15)
                ))

                # Add sample moods (AES-256-GCM encrypted)
                m1_ct, m1_kv = encrypt_content("Evening reflection and mindfulness breathwork")
                m2_ct, m2_kv = encrypt_content("Feeling centered and calm after meditation")
                m3_ct, m3_kv = encrypt_content("Positive somatic focus, feeling grounded")

                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="peaceful",
                    scale_code="1_to_10",
                    scale_value=8.5,
                    note_ciphertext=m1_ct,
                    key_version=m1_kv,
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=2)
                ))
                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="grateful",
                    scale_code="1_to_10",
                    scale_value=9.0,
                    note_ciphertext=m2_ct,
                    key_version=m2_kv,
                    recorded_at=datetime.now(timezone.utc) - timedelta(days=1)
                ))
                db.add(MoodEntry(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    mood_code="calm",
                    scale_code="1_to_10",
                    scale_value=8.0,
                    note_ciphertext=m3_ct,
                    key_version=m3_kv,
                    recorded_at=datetime.now(timezone.utc)
                ))

                # Add sample peer conversations
                # 1. Active video session
                req1 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req1)
                await db.flush()
                match1 = ListenerMatch(id=uuid.uuid4(), request_id=req1.id, listener_id=listener.id, match_state="accepted")
                db.add(match1)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match1.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="voice",
                    conversation_state="open",
                    started_at=datetime.now(timezone.utc) - timedelta(hours=1)
                ))

                # 2. Completed voice session
                req2 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req2)
                await db.flush()
                match2 = ListenerMatch(id=uuid.uuid4(), request_id=req2.id, listener_id=listener.id, match_state="accepted")
                db.add(match2)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match2.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="voice",
                    conversation_state="closed",
                    started_at=datetime.now(timezone.utc) - timedelta(days=1),
                    ended_at=datetime.now(timezone.utc) - timedelta(days=1, hours=-1)
                ))

                # 3. Completed chat session
                req3 = ListenerMatchRequest(id=uuid.uuid4(), member_id=member_user_id, request_state="matched")
                db.add(req3)
                await db.flush()
                match3 = ListenerMatch(id=uuid.uuid4(), request_id=req3.id, listener_id=listener.id, match_state="accepted")
                db.add(match3)
                await db.flush()
                db.add(PeerConversation(
                    id=uuid.uuid4(),
                    match_id=match3.id,
                    member_id=member_user_id,
                    listener_id=listener.id,
                    channel="text",
                    conversation_state="closed",
                    started_at=datetime.now(timezone.utc) - timedelta(days=2),
                    ended_at=datetime.now(timezone.utc) - timedelta(days=2, hours=-1)
                ))

                # Intake session completed
                db.add(IntakeSession(
                    id=uuid.uuid4(),
                    member_id=member_user_id,
                    channel="text",
                    status="completed",
                    locale="en",
                    started_at=datetime.now(timezone.utc) - timedelta(days=3),
                    completed_at=datetime.now(timezone.utc) - timedelta(days=3, hours=-1)
                ))

                await db.commit()
                print("MindSpace PostgreSQL successfully initialized & seeded!")
    except Exception as e:
        print(f"Database initialization notice: {e}")

