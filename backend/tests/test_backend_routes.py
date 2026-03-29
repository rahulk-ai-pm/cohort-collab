"""
Backend API Tests for Cohort Collaboration App
Tests all routes after backend refactoring from monolithic server.py to modular route files.
Iteration 5: Testing modular routes structure
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint - verifies backend is running after refactoring"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        print(f"✓ Health check passed: {data}")


class TestAuthRoutes:
    """Auth routes - /api/auth/* endpoints"""
    
    def test_auth_me_unauthenticated(self):
        """GET /api/auth/me should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ GET /api/auth/me returns 401 without auth")
    
    def test_auth_session_missing_body(self):
        """POST /api/auth/session should return 400 without session_id"""
        response = requests.post(f"{BASE_URL}/api/auth/session", json={})
        assert response.status_code == 400
        print("✓ POST /api/auth/session returns 400 without session_id")
    
    def test_auth_logout(self):
        """POST /api/auth/logout should work even without session"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ POST /api/auth/logout returns 200")


class TestProjectsRoutes:
    """Projects routes - /api/projects/* endpoints"""
    
    def test_projects_list_unauthenticated(self):
        """GET /api/projects should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 401
        print("✓ GET /api/projects returns 401 without auth")
    
    def test_project_detail_unauthenticated(self):
        """GET /api/projects/{id} should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/projects/test_project_id")
        assert response.status_code == 401
        print("✓ GET /api/projects/{id} returns 401 without auth")
    
    def test_project_recommendations_unauthenticated(self):
        """GET /api/projects/{id}/recommendations should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/projects/test_project_id/recommendations")
        assert response.status_code == 401
        print("✓ GET /api/projects/{id}/recommendations returns 401 without auth")
    
    def test_project_my_preference_unauthenticated(self):
        """GET /api/projects/{id}/my-preference should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/projects/test_project_id/my-preference")
        assert response.status_code == 401
        print("✓ GET /api/projects/{id}/my-preference returns 401 without auth")
    
    def test_project_my_team_unauthenticated(self):
        """GET /api/projects/{id}/my-team should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/projects/test_project_id/my-team")
        assert response.status_code == 401
        print("✓ GET /api/projects/{id}/my-team returns 401 without auth")


class TestCaseStudiesRoutes:
    """Case studies routes - /api/case-studies/* endpoints"""
    
    def test_case_studies_list_unauthenticated(self):
        """GET /api/case-studies should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/case-studies")
        assert response.status_code == 401
        print("✓ GET /api/case-studies returns 401 without auth")
    
    def test_case_study_detail_unauthenticated(self):
        """GET /api/case-studies/{id} should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/case-studies/test_cs_id")
        assert response.status_code == 401
        print("✓ GET /api/case-studies/{id} returns 401 without auth")
    
    def test_case_study_messages_unauthenticated(self):
        """GET /api/case-studies/{id}/messages should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/case-studies/test_cs_id/messages")
        assert response.status_code == 401
        print("✓ GET /api/case-studies/{id}/messages returns 401 without auth")


class TestDiscussionsRoutes:
    """Discussions routes - /api/discussions/* endpoints"""
    
    def test_discussions_list_unauthenticated(self):
        """GET /api/discussions should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/discussions")
        assert response.status_code == 401
        print("✓ GET /api/discussions returns 401 without auth")
    
    def test_discussion_messages_unauthenticated(self):
        """GET /api/discussions/{id}/messages should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/discussions/test_disc_id/messages")
        assert response.status_code == 401
        print("✓ GET /api/discussions/{id}/messages returns 401 without auth")
    
    def test_create_discussion_unauthenticated(self):
        """POST /api/discussions should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/discussions", json={"title": "Test", "content": "Test"})
        assert response.status_code == 401
        print("✓ POST /api/discussions returns 401 without auth")


class TestChatbotRoutes:
    """Chatbot routes - /api/chatbot/* endpoints"""
    
    def test_chatbot_message_unauthenticated(self):
        """POST /api/chatbot/message should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/chatbot/message", json={"message": "Hello"})
        assert response.status_code == 401
        print("✓ POST /api/chatbot/message returns 401 without auth")
    
    def test_chatbot_history_unauthenticated(self):
        """GET /api/chatbot/history should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/chatbot/history")
        assert response.status_code == 401
        print("✓ GET /api/chatbot/history returns 401 without auth")


class TestNotificationsRoutes:
    """Notifications routes - /api/notifications/* endpoints"""
    
    def test_notifications_list_unauthenticated(self):
        """GET /api/notifications should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/notifications")
        assert response.status_code == 401
        print("✓ GET /api/notifications returns 401 without auth")
    
    def test_mark_notification_read_unauthenticated(self):
        """PUT /api/notifications/{id}/read should return 401 without auth"""
        response = requests.put(f"{BASE_URL}/api/notifications/test_notif_id/read")
        assert response.status_code == 401
        print("✓ PUT /api/notifications/{id}/read returns 401 without auth")


class TestFilesRoutes:
    """Files routes - /api/files/* endpoints"""
    
    def test_file_download_unauthenticated(self):
        """GET /api/files/{path} should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/files/test/path/file.pdf")
        assert response.status_code == 401
        print("✓ GET /api/files/{path} returns 401 without auth")


class TestAdminRoutes:
    """Admin routes - /api/admin/* endpoints"""
    
    def test_admin_analytics_unauthenticated(self):
        """GET /api/admin/analytics should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics")
        assert response.status_code == 401
        print("✓ GET /api/admin/analytics returns 401 without auth")
    
    def test_admin_members_unauthenticated(self):
        """GET /api/admin/members should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/members")
        assert response.status_code == 401
        print("✓ GET /api/admin/members returns 401 without auth")
    
    def test_admin_blocked_unauthenticated(self):
        """GET /api/admin/blocked should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/blocked")
        assert response.status_code == 401
        print("✓ GET /api/admin/blocked returns 401 without auth")
    
    def test_admin_create_project_unauthenticated(self):
        """POST /api/admin/projects should return 401 without auth (or 422 if validation first)"""
        response = requests.post(f"{BASE_URL}/api/admin/projects", json={
            "title": "Test Project",
            "description": "Test description",
            "context": "",
            "group_size": 4,
            "links": [],
            "goals": "",
            "skills_required": []
        })
        # 401 if auth checked first, 422 if validation checked first - both acceptable
        assert response.status_code in [401, 422]
        print(f"✓ POST /api/admin/projects returns {response.status_code} without auth")
    
    def test_admin_create_case_study_unauthenticated(self):
        """POST /api/admin/case-studies should return 401 without auth (or 422 if validation first)"""
        response = requests.post(f"{BASE_URL}/api/admin/case-studies", json={
            "title": "Test Case Study",
            "description": "Test description",
            "context": "",
            "links": []
        })
        # 401 if auth checked first, 422 if validation checked first - both acceptable
        assert response.status_code in [401, 422]
        print(f"✓ POST /api/admin/case-studies returns {response.status_code} without auth")
    
    def test_admin_delete_discussion_unauthenticated(self):
        """DELETE /api/admin/discussions/{id} should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/discussions/test_disc_id")
        assert response.status_code == 401
        print("✓ DELETE /api/admin/discussions/{id} returns 401 without auth")


class TestMembersRoutes:
    """Members routes - /api/members/* endpoints"""
    
    def test_members_list_unauthenticated(self):
        """GET /api/members should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/members")
        assert response.status_code == 401
        print("✓ GET /api/members returns 401 without auth")


class TestSkillsRoutes:
    """Skills routes - /api/skills endpoint"""
    
    def test_skills_list_unauthenticated(self):
        """GET /api/skills should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/skills")
        assert response.status_code == 401
        print("✓ GET /api/skills returns 401 without auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
