#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class TeamFormationAPITester:
    def __init__(self, base_url="https://course-collab.preview.emergentagent.com"):
        self.base_url = base_url
        # Using existing test sessions from iteration 1
        self.member_token = "member_test_session"  # member_1 session
        self.admin_token = "admin_test_session"    # admin session
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.project_id = None

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
                    if isinstance(response_data, dict) and len(str(response_data)) < 300:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) <= 5:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
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

    def test_skills_endpoint(self):
        """Test GET /api/skills - returns list of 18 APM skills"""
        print("\n" + "="*50)
        print("TESTING SKILLS ENDPOINT")
        print("="*50)
        
        success, skills_data = self.run_test(
            "Get Skills List",
            "GET",
            "skills",
            200,
            token=self.member_token
        )
        
        if success and isinstance(skills_data, list):
            print(f"✅ Found {len(skills_data)} skills")
            if len(skills_data) == 18:
                print("✅ Correct number of APM skills (18)")
            else:
                print(f"⚠️  Expected 18 skills, got {len(skills_data)}")
            
            # Check for some expected skills
            expected_skills = ["Data Analysis", "Product Strategy", "UX/Design", "Leadership"]
            found_skills = [skill for skill in expected_skills if skill in skills_data]
            print(f"✅ Found expected skills: {found_skills}")
        
        return success

    def test_onboarding_with_skills(self):
        """Test PUT /api/profile/onboarding - saves skills field along with other profile data"""
        print("\n" + "="*50)
        print("TESTING ONBOARDING WITH SKILLS")
        print("="*50)
        
        onboarding_data = {
            "professional_experience": "Senior PM with 8 years experience in fintech",
            "current_role": "Senior Product Manager at TechCorp",
            "aspirations": "Lead product strategy for AI-driven products",
            "linkedin_url": "https://linkedin.com/in/testuser",
            "skills": ["Data Analysis", "Product Strategy", "UX/Design", "Leadership", "Agile/Scrum"]
        }
        
        success, response_data = self.run_test(
            "Profile Onboarding with Skills",
            "PUT",
            "profile/onboarding",
            200,
            data=onboarding_data,
            token=self.member_token
        )
        
        if success and response_data:
            saved_skills = response_data.get('skills', [])
            print(f"✅ Skills saved: {saved_skills}")
            if len(saved_skills) == 5:
                print("✅ All 5 skills saved correctly")
            else:
                print(f"⚠️  Expected 5 skills, got {len(saved_skills)}")
        
        return success

    def test_admin_project_with_goals_skills(self):
        """Test POST /api/admin/projects - creates project with goals and skills_required fields"""
        print("\n" + "="*50)
        print("TESTING ADMIN PROJECT WITH GOALS AND SKILLS")
        print("="*50)
        
        project_data = {
            "title": "AI Product Strategy Project",
            "description": "Develop a comprehensive AI product strategy for a fintech startup",
            "context": "This project focuses on creating a roadmap for AI integration in financial services",
            "group_size": 4,
            "links": ["https://example.com/ai-strategy"],
            "goals": "1. Analyze market opportunities for AI in fintech\n2. Define product requirements and user personas\n3. Create a 12-month product roadmap\n4. Develop go-to-market strategy",
            "skills_required": ["Data Analysis", "Product Strategy", "Financial Modeling", "Market Research", "UX/Design"]
        }
        
        success, project_response = self.run_test(
            "Admin Create Project with Goals and Skills",
            "POST",
            "admin/projects",
            200,
            data=project_data,
            token=self.admin_token
        )
        
        if success and project_response:
            self.project_id = project_response.get('project_id')
            print(f"✅ Created project with ID: {self.project_id}")
            
            # Verify goals and skills_required are saved
            if 'goals' in project_response:
                print("✅ Project goals saved")
            if 'skills_required' in project_response:
                print(f"✅ Skills required saved: {project_response['skills_required']}")
        
        return success

    def test_project_detail_with_goals_skills(self):
        """Test GET /api/projects/{id} - returns project with goals and skills_required"""
        print("\n" + "="*50)
        print("TESTING PROJECT DETAIL WITH GOALS AND SKILLS")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        success, project_data = self.run_test(
            "Get Project Detail with Goals and Skills",
            "GET",
            f"projects/{self.project_id}",
            200,
            token=self.member_token
        )
        
        if success and project_data:
            has_goals = 'goals' in project_data and project_data['goals']
            has_skills = 'skills_required' in project_data and project_data['skills_required']
            
            if has_goals:
                print("✅ Project goals present in response")
            else:
                print("❌ Project goals missing from response")
            
            if has_skills:
                print(f"✅ Skills required present: {project_data['skills_required']}")
            else:
                print("❌ Skills required missing from response")
            
            return has_goals and has_skills
        
        return success

    def test_team_preferences(self):
        """Test team preferences endpoints"""
        print("\n" + "="*50)
        print("TESTING TEAM PREFERENCES")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        # Test saving team preferences
        preferences_data = {
            "preferred_teammates": ["user_123", "user_456"],
            "skills_offered": ["Data Analysis", "Product Strategy", "UX/Design"],
            "skills_wanted": ["Financial Modeling", "Market Research"]
        }
        
        success1, pref_response = self.run_test(
            "Save Team Preferences",
            "POST",
            f"projects/{self.project_id}/preferences",
            200,
            data=preferences_data,
            token=self.member_token
        )
        
        # Test getting saved preferences
        success2, saved_prefs = self.run_test(
            "Get My Team Preference",
            "GET",
            f"projects/{self.project_id}/my-preference",
            200,
            token=self.member_token
        )
        
        if success2 and saved_prefs:
            print(f"✅ Retrieved saved preferences: {len(saved_prefs.get('preferred_teammates', []))} teammates, {len(saved_prefs.get('skills_offered', []))} skills offered")
        
        # Test preferences count
        success3, count_data = self.run_test(
            "Get Preferences Count",
            "GET",
            f"projects/{self.project_id}/preferences/count",
            200,
            token=self.member_token
        )
        
        if success3 and count_data:
            print(f"✅ Preferences count: {count_data.get('count', 0)}")
        
        return success1 and success2 and success3

    def test_my_team_not_published(self):
        """Test GET /api/projects/{id}/my-team - returns team status (not_published when no teams)"""
        print("\n" + "="*50)
        print("TESTING MY TEAM (NOT PUBLISHED)")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        success, team_data = self.run_test(
            "Get My Team (Not Published)",
            "GET",
            f"projects/{self.project_id}/my-team",
            200,
            token=self.member_token
        )
        
        if success and team_data:
            status = team_data.get('status')
            if status == 'not_published':
                print("✅ Correct status: not_published (no teams generated yet)")
                return True
            else:
                print(f"⚠️  Unexpected status: {status}")
        
        return success

    def test_generate_teams(self):
        """Test POST /api/admin/projects/{id}/generate-teams - generates AI-balanced teams"""
        print("\n" + "="*50)
        print("TESTING AI TEAM GENERATION")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        print("⏳ Generating teams with AI (this may take 5-10 seconds)...")
        
        success, teams_data = self.run_test(
            "Generate AI Teams",
            "POST",
            f"admin/projects/{self.project_id}/generate-teams",
            200,
            data={},
            token=self.admin_token
        )
        
        if success and teams_data:
            teams = teams_data.get('teams', [])
            status = teams_data.get('status')
            print(f"✅ Generated {len(teams)} teams with status: {status}")
            
            if status == 'draft':
                print("✅ Teams created in draft status (ready for review)")
            
            # Store teams data for next test
            self.teams_data = teams_data
            return True
        
        return success

    def test_admin_get_teams(self):
        """Test GET /api/admin/projects/{id}/teams - returns draft teams with member details"""
        print("\n" + "="*50)
        print("TESTING ADMIN GET TEAMS")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        success, teams_data = self.run_test(
            "Admin Get Teams",
            "GET",
            f"admin/projects/{self.project_id}/teams",
            200,
            token=self.admin_token
        )
        
        if success and teams_data:
            teams = teams_data.get('teams', [])
            status = teams_data.get('status')
            print(f"✅ Retrieved {len(teams)} teams with status: {status}")
            
            # Check if teams have member details
            for i, team in enumerate(teams):
                member_details = team.get('member_details', [])
                print(f"   Team {i+1} ({team.get('team_name', 'Unnamed')}): {len(member_details)} members with details")
        
        return success

    def test_publish_teams(self):
        """Test POST /api/admin/projects/{id}/publish-teams - publishes teams and sends notifications"""
        print("\n" + "="*50)
        print("TESTING PUBLISH TEAMS")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        success, publish_response = self.run_test(
            "Publish Teams",
            "POST",
            f"admin/projects/{self.project_id}/publish-teams",
            200,
            data={},
            token=self.admin_token
        )
        
        if success and publish_response:
            message = publish_response.get('message', '')
            if 'published' in message.lower():
                print("✅ Teams published successfully")
            print(f"   Response: {message}")
        
        return success

    def test_my_team_published(self):
        """Test GET /api/projects/{id}/my-team - returns published team with member details"""
        print("\n" + "="*50)
        print("TESTING MY TEAM (PUBLISHED)")
        print("="*50)
        
        if not self.project_id:
            print("❌ No project ID available from previous test")
            return False
        
        success, team_data = self.run_test(
            "Get My Team (Published)",
            "GET",
            f"projects/{self.project_id}/my-team",
            200,
            token=self.member_token
        )
        
        if success and team_data:
            status = team_data.get('status')
            if status == 'published':
                print("✅ Team status: published")
                team = team_data.get('team', {})
                if team:
                    team_name = team.get('team_name', 'Unnamed')
                    member_details = team.get('member_details', [])
                    print(f"✅ Team: {team_name} with {len(member_details)} members")
                    return True
            elif status == 'not_assigned':
                print("⚠️  User not assigned to any team")
            else:
                print(f"⚠️  Unexpected status: {status}")
        
        return success

    def test_admin_analytics_still_works(self):
        """Test GET /api/admin/analytics - still works correctly"""
        print("\n" + "="*50)
        print("TESTING ADMIN ANALYTICS (STILL WORKS)")
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
    print("🚀 Starting Team Formation API Testing (Iteration 2)")
    print("=" * 60)
    
    tester = TeamFormationAPITester()
    
    # Run all test suites for team formation features
    test_results = []
    
    test_results.append(("Skills Endpoint", tester.test_skills_endpoint()))
    test_results.append(("Onboarding with Skills", tester.test_onboarding_with_skills()))
    test_results.append(("Admin Project with Goals/Skills", tester.test_admin_project_with_goals_skills()))
    test_results.append(("Project Detail with Goals/Skills", tester.test_project_detail_with_goals_skills()))
    test_results.append(("Team Preferences", tester.test_team_preferences()))
    test_results.append(("My Team (Not Published)", tester.test_my_team_not_published()))
    test_results.append(("Generate AI Teams", tester.test_generate_teams()))
    test_results.append(("Admin Get Teams", tester.test_admin_get_teams()))
    test_results.append(("Publish Teams", tester.test_publish_teams()))
    test_results.append(("My Team (Published)", tester.test_my_team_published()))
    test_results.append(("Admin Analytics Still Works", tester.test_admin_analytics_still_works()))
    
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