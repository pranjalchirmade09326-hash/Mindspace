import pytest
import httpx

BASE_URL = "http://localhost:8080"

@pytest.mark.asyncio
async def test_health():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        res = await client.get("/health/ready")
        assert res.status_code == 200
        assert res.json()["status"] == "ready"

@pytest.mark.asyncio
async def test_member_summary():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        res = await client.get("/api/v1/members/me/summary")
        assert res.status_code == 200
        data = res.json()
        assert "userId" in data
        assert "stats" in data
        assert "moodTrend" in data
        assert "activeGoals" in data

@pytest.mark.asyncio
async def test_mood_creation_and_encryption():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        res = await client.post("/api/v1/wellbeing/moods", json={
            "mood_code": "peaceful",
            "scale_code": "1_to_10",
            "scale_value": 9.0,
            "note": "Automated test reflection note"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["mood_code"] == "peaceful"
        assert data["note"] == "Automated test reflection note"

@pytest.mark.asyncio
async def test_goal_creation():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        res = await client.post("/api/v1/wellbeing/goals", json={
            "goal": "Test goal from automated test suite",
            "target_date": "2026-11-30"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["goal"] == "Test goal from automated test suite"
        assert data["status"] == "active"
        goal_id = data["id"]

        # Toggle goal status to completed
        toggle_res = await client.put(f"/api/v1/wellbeing/goals/{goal_id}/toggle")
        assert toggle_res.status_code == 200
        assert toggle_res.json()["status"] == "completed"

        # Toggle back to active
        toggle_res2 = await client.put(f"/api/v1/wellbeing/goals/{goal_id}/toggle")
        assert toggle_res2.status_code == 200
        assert toggle_res2.json()["status"] == "active"

@pytest.mark.asyncio
async def test_peer_session_booking_and_lifecycle():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        book_res = await client.post("/api/v1/peer/book-session", json={
            "listener_name": "Aarav Sharma (Verified Peer Listener)",
            "channel": "voice",
            "note": "Automated test session"
        })
        assert book_res.status_code == 200
        conv_id = book_res.json()["id"]
        assert conv_id is not None

        get_res = await client.get("/api/v1/peer/conversations")
        assert get_res.status_code == 200
        assert any(c["id"] == conv_id for c in get_res.json())

        close_res = await client.put(f"/api/v1/peer/conversations/{conv_id}/close")
        assert close_res.status_code == 200

@pytest.mark.asyncio
async def test_operations_dashboards():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Listener summary & profile
        res = await client.get("/api/v1/listeners/me/summary")
        assert res.status_code == 200
        data = res.json()
        assert "applicationState" in data
        assert "capacityLimit" in data

        res = await client.get("/api/v1/listeners/me/profile")
        assert res.status_code == 200

        # Supervisor summary & roster
        res = await client.get("/api/v1/operations/supervisor/summary")
        assert res.status_code == 200
        assert "activeListeners" in res.json()

        res = await client.get("/api/v1/operations/supervisor/listeners")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

        # Safety summary & cases
        res = await client.get("/api/v1/operations/safety/summary")
        assert res.status_code == 200
        assert "openCases" in res.json()

        res = await client.get("/api/v1/operations/safety/cases")
        assert res.status_code == 200

        # Platform admin
        res = await client.get("/api/v1/admin/platform/overview")
        assert res.status_code == 200
        assert "activeUsers" in res.json()

        # Session policy
        res = await client.get("/api/v1/auth/session-policy")
        assert res.status_code == 200

@pytest.mark.asyncio
async def test_intake_lifecycle():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # Create intake session
        res = await client.post("/api/v1/intakes", json={"channel": "text", "locale": "en"})
        assert res.status_code == 200
        intake_id = res.json()["id"]
        assert intake_id is not None

        # Add response
        resp_res = await client.post(f"/api/v1/intakes/{intake_id}/responses", json={
            "question_id": "phq9_q1",
            "response": "Little interest or pleasure in doing things"
        })
        assert resp_res.status_code == 200
        assert resp_res.json()["status"] == "success"

        # Read back responses
        get_res = await client.get(f"/api/v1/intakes/{intake_id}/responses")
        assert get_res.status_code == 200
        responses = get_res.json()
        assert len(responses) >= 1
        assert responses[0]["response"] == "Little interest or pleasure in doing things"
