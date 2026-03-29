#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CohortLearningAPITester:
    def __init__(self, base_url="https://course-collab.preview.emergentagent.com"):
        self.base_url = base_url
        self.member_token = "test_session_1774764379054"
        self.admin_token = "admin_session_1774764384141"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_health_endpoint(self):
        """Test API health endpoint"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINT")
        print("="*50)
        
        success, _ = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS")
        print("="*50)
        
        # Test auth/me with member token
        success1, member_data = self.run_test(
            "Auth Me - Member",
            "GET",
            "auth/me",
            200,
            token=self.member_token
        )
        
        # Test auth/me with admin token
        success2, admin_data = self.run_test(
            "Auth Me - Admin",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        
        # Verify admin role
        if success2 and admin_data.get('role') == 'admin':
            print("✅ Admin role verified")
        elif success2:
            print(f"❌ Admin role check failed - got role: {admin_data.get('role')}")
        
        return success1 and success2

    def test_profile_endpoints(self):
        """Test profile and onboarding endpoints"""
        print("\n" + "="*50)
        print("TESTING PROFILE ENDPOINTS")
        print("="*50)
        
        # Test profile onboarding update
        onboarding_data = {
            "professional_experience": "Updated PM experience",
            "current_role": "Senior Product Manager",
            "aspirations": "VP of Product",
            "linkedin_url": "https://linkedin.com/in/updated"
        }
        
        success, _ = self.run_test(
            "Profile Onboarding Update",
            "PUT",
            "profile/onboarding",
            200,
            data=onboarding_data,
            token=self.member_token
        )
        
        return success

    def test_members_endpoints(self):
        """Test members/directory endpoints"""
        print("\n" + "="*50)
        print("TESTING MEMBERS ENDPOINTS")
        print("="*50)
        
        success, members_data = self.run_test(
            "List Members",
            "GET",
            "members",
            200,
            token=self.member_token
        )
        
        if success and isinstance(members_data, list):
            print(f"✅ Found {len(members_data)} members")
        
        return success

    def test_admin_project_endpoints(self):
        """Test admin project management endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN PROJECT ENDPOINTS")
        print("="*50)
        
        # Create a test project
        project_data = {
            "title": "Test Project API",
            "description": "A test project created via API testing",
            "context": "This is context for the chatbot about the test project",
            "group_size": 4,
            "links": ["https://example.com/project"]
        }
        
        success1, project_response = self.run_test(
            "Admin Create Project",
            "POST",
            "admin/projects",
            200,
            data=project_data,
            token=self.admin_token
        )
        
        project_id = None
        if success1 and project_response:
            project_id = project_response.get('project_id')
            print(f"✅ Created project with ID: {project_id}")
        
        # Test list projects
        success2, projects_list = self.run_test(
            "List Projects",
            "GET",
            "projects",
            200,
            token=self.member_token
        )
        
        if success2 and isinstance(projects_list, list):
            print(f"✅ Found {len(projects_list)} projects")
        
        # Test get project detail
        success3 = True
        if project_id:
            success3, project_detail = self.run_test(
                "Get Project Detail",
                "GET",
                f"projects/{project_id}",
                200,
                token=self.member_token
            )
            
            # Test project recommendations
            success4, recommendations = self.run_test(
                "Get Project Recommendations",
                "GET",
                f"projects/{project_id}/recommendations",
                200,
                token=self.member_token
            )
            
            if success4 and isinstance(recommendations, list):
                print(f"✅ Found {len(recommendations)} recommendations")
        
        return success1 and success2 and success3

    def test_admin_case_study_endpoints(self):
        """Test admin case study management endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN CASE STUDY ENDPOINTS")
        print("="*50)
        
        # Create a test case study
        cs_data = {
            "title": "Test Case Study API",
            "description": "A test case study created via API testing",
            "context": "This is context for the chatbot about the test case study",
            "links": ["https://example.com/casestudy"]
        }
        
        success1, cs_response = self.run_test(
            "Admin Create Case Study",
            "POST",
            "admin/case-studies",
            200,
            data=cs_data,
            token=self.admin_token
        )
        
        cs_id = None
        if success1 and cs_response:
            cs_id = cs_response.get('case_study_id')
            print(f"✅ Created case study with ID: {cs_id}")
        
        # Test list case studies
        success2, cs_list = self.run_test(
            "List Case Studies",
            "GET",
            "case-studies",
            200,
            token=self.member_token
        )
        
        if success2 and isinstance(cs_list, list):
            print(f"✅ Found {len(cs_list)} case studies")
        
        # Test get case study detail
        success3 = True
        success4 = True
        if cs_id:
            success3, cs_detail = self.run_test(
                "Get Case Study Detail",
                "GET",
                f"case-studies/{cs_id}",
                200,
                token=self.member_token
            )
            
            # Test post case study message
            message_data = {"content": "This is a test message for the case study"}
            success4, message_response = self.run_test(
                "Post Case Study Message",
                "POST",
                f"case-studies/{cs_id}/messages",
                200,
                data=message_data,
                token=self.member_token
            )
        
        return success1 and success2 and success3 and success4

    def test_discussion_endpoints(self):
        """Test discussion endpoints"""
        print("\n" + "="*50)
        print("TESTING DISCUSSION ENDPOINTS")
        print("="*50)
        
        # Create a test discussion
        discussion_data = {
            "title": "Test Discussion API",
            "content": "This is a test discussion created via API testing"
        }
        
        success1, disc_response = self.run_test(
            "Create Discussion",
            "POST",
            "discussions",
            200,
            data=discussion_data,
            token=self.member_token
        )
        
        disc_id = None
        if success1 and disc_response:
            disc_id = disc_response.get('discussion_id')
            print(f"✅ Created discussion with ID: {disc_id}")
        
        # Test list discussions
        success2, disc_list = self.run_test(
            "List Discussions",
            "GET",
            "discussions",
            200,
            token=self.member_token
        )
        
        if success2 and isinstance(disc_list, list):
            print(f"✅ Found {len(disc_list)} discussions")
        
        # Test post discussion message
        success3 = True
        if disc_id:
            message_data = {"content": "This is a test message for the discussion"}
            success3, message_response = self.run_test(
                "Post Discussion Message",
                "POST",
                f"discussions/{disc_id}/messages",
                200,
                data=message_data,
                token=self.member_token
            )
        
        return success1 and success2 and success3

    def test_chatbot_endpoints(self):
        """Test chatbot endpoints"""
        print("\n" + "="*50)
        print("TESTING CHATBOT ENDPOINTS")
        print("="*50)
        
        # Test chatbot message
        chatbot_data = {"message": "What is the APM program about?"}
        success1, chat_response = self.run_test(
            "Chatbot Message",
            "POST",
            "chatbot/message",
            200,
            data=chatbot_data,
            token=self.member_token
        )
        
        if success1 and chat_response:
            print("✅ Chatbot responded successfully")
        
        # Test chatbot history
        success2, history = self.run_test(
            "Chatbot History",
            "GET",
            "chatbot/history",
            200,
            token=self.member_token
        )
        
        if success2 and isinstance(history, list):
            print(f"✅ Found {len(history)} chat messages in history")
        
        return success1 and success2

    def test_notification_endpoints(self):
        """Test notification endpoints"""
        print("\n" + "="*50)
        print("TESTING NOTIFICATION ENDPOINTS")
        print("="*50)
        
        success, notifications = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200,
            token=self.member_token
        )
        
        if success and isinstance(notifications, list):
            print(f"✅ Found {len(notifications)} notifications")
        
        return success

    def test_admin_analytics_endpoints(self):
        """Test admin analytics endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN ANALYTICS ENDPOINTS")
        print("="*50)
        
        success, analytics = self.run_test(
            "Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            token=self.admin_token
        )
        
        if success and analytics:
            print(f"✅ Analytics data retrieved:")
            print(f"   Total members: {analytics.get('total_members', 'N/A')}")
            print(f"   Total projects: {analytics.get('total_projects', 'N/A')}")
            print(f"   Total case studies: {analytics.get('total_case_studies', 'N/A')}")
            print(f"   Total discussions: {analytics.get('total_discussions', 'N/A')}")
            print(f"   Total chatbot queries: {analytics.get('total_chatbot_queries', 'N/A')}")
        
        return success

def main():
    print("🚀 Starting Cohort Learning App API Testing")
    print("=" * 60)
    
    tester = CohortLearningAPITester()
    
    # Run all test suites
    test_results = []
    
    test_results.append(("Health Endpoint", tester.test_health_endpoint()))
    test_results.append(("Auth Endpoints", tester.test_auth_endpoints()))
    test_results.append(("Profile Endpoints", tester.test_profile_endpoints()))
    test_results.append(("Members Endpoints", tester.test_members_endpoints()))
    test_results.append(("Admin Project Endpoints", tester.test_admin_project_endpoints()))
    test_results.append(("Admin Case Study Endpoints", tester.test_admin_case_study_endpoints()))
    test_results.append(("Discussion Endpoints", tester.test_discussion_endpoints()))
    test_results.append(("Chatbot Endpoints", tester.test_chatbot_endpoints()))
    test_results.append(("Notification Endpoints", tester.test_notification_endpoints()))
    test_results.append(("Admin Analytics Endpoints", tester.test_admin_analytics_endpoints()))
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests Details:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())