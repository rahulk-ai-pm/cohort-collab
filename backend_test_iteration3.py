#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class AdminModerationTester:
    def __init__(self, base_url="https://course-collab.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = "admin_test_session"
        self.member_token = "member_test_session"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, description=""):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        if description:
            print(f"   Description: {description}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json() if response.content else {}
                except:
                    response_data = {}
                self.test_results.append({
                    "test": name,
                    "status": "PASSED",
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "response_data": response_data
                })
                return True, response_data
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error: {error_data}")
                except:
                    error_data = {"error": response.text}
                self.test_results.append({
                    "test": name,
                    "status": "FAILED",
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "error_data": error_data
                })
                return False, error_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "error": str(e)
            })
            return False, {}

    def test_admin_members_list(self):
        """Test GET /api/admin/members - lists all members with is_blocked field"""
        success, response = self.run_test(
            "Admin Members List",
            "GET",
            "admin/members",
            200,
            token=self.admin_token,
            description="Should list all members with is_blocked field"
        )
        
        if success and isinstance(response, list):
            # Check if members have is_blocked field
            for member in response:
                if 'is_blocked' not in member:
                    print(f"❌ Member {member.get('name', 'Unknown')} missing is_blocked field")
                    return False
            print(f"✅ Found {len(response)} members, all have is_blocked field")
            return True
        return False

    def test_block_member(self):
        """Test POST /api/admin/members/{user_id}/block - blocks member"""
        success, response = self.run_test(
            "Block Member",
            "POST",
            "admin/members/member_1/block",
            200,
            token=self.admin_token,
            description="Should block member_1 and kill their sessions"
        )
        
        if success:
            # Verify member is blocked by checking blocked_emails collection
            blocked_success, blocked_response = self.run_test(
                "Verify Member Blocked",
                "GET",
                "admin/blocked",
                200,
                token=self.admin_token,
                description="Should show member_1 in blocked list"
            )
            
            if blocked_success and isinstance(blocked_response, list):
                blocked_emails = [b.get('email') for b in blocked_response]
                if 'member1@example.com' in blocked_emails:
                    print("✅ Member successfully added to blocked list")
                    return True
                else:
                    print("❌ Member not found in blocked list")
                    return False
        return False

    def test_blocked_member_cannot_login(self):
        """Test that blocked member cannot exchange session"""
        # First, try to use the blocked member's session
        success, response = self.run_test(
            "Blocked Member Session Check",
            "GET",
            "auth/me",
            401,  # Should fail with 401 since sessions were killed
            token=self.member_token,
            description="Blocked member's session should be invalid"
        )
        return success

    def test_unblock_member(self):
        """Test DELETE /api/admin/members/{user_id}/block - unblocks member"""
        success, response = self.run_test(
            "Unblock Member",
            "DELETE",
            "admin/members/member_1/block",
            200,
            token=self.admin_token,
            description="Should unblock member_1"
        )
        
        if success:
            # Verify member is unblocked
            blocked_success, blocked_response = self.run_test(
                "Verify Member Unblocked",
                "GET",
                "admin/blocked",
                200,
                token=self.admin_token,
                description="Should not show member_1 in blocked list"
            )
            
            if blocked_success and isinstance(blocked_response, list):
                blocked_emails = [b.get('email') for b in blocked_response]
                if 'member1@example.com' not in blocked_emails:
                    print("✅ Member successfully removed from blocked list")
                    return True
                else:
                    print("❌ Member still found in blocked list")
                    return False
        return False

    def test_remove_member(self):
        """Test DELETE /api/admin/members/{user_id} - removes member and all data"""
        success, response = self.run_test(
            "Remove Member",
            "DELETE",
            "admin/members/member_2",
            200,
            token=self.admin_token,
            description="Should remove member_2 and all associated data"
        )
        
        if success:
            # Verify member is removed from members list
            members_success, members_response = self.run_test(
                "Verify Member Removed",
                "GET",
                "admin/members",
                200,
                token=self.admin_token,
                description="Should not show member_2 in members list"
            )
            
            if members_success and isinstance(members_response, list):
                member_ids = [m.get('user_id') for m in members_response]
                if 'member_2' not in member_ids:
                    print("✅ Member successfully removed from members list")
                    return True
                else:
                    print("❌ Member still found in members list")
                    return False
        return False

    def test_cannot_block_admin(self):
        """Test that admin cannot block another admin"""
        success, response = self.run_test(
            "Cannot Block Admin",
            "POST",
            "admin/members/admin_test_user/block",
            400,  # Should fail with 400 Bad Request
            token=self.admin_token,
            description="Should not allow blocking admin users"
        )
        return success

    def test_cannot_remove_admin(self):
        """Test that admin cannot remove another admin"""
        success, response = self.run_test(
            "Cannot Remove Admin",
            "DELETE",
            "admin/members/admin_test_user",
            400,  # Should fail with 400 Bad Request
            token=self.admin_token,
            description="Should not allow removing admin users"
        )
        return success

    def test_delete_discussion(self):
        """Test DELETE /api/admin/discussions/{disc_id} - deletes discussion and messages"""
        success, response = self.run_test(
            "Delete Discussion",
            "DELETE",
            "admin/discussions/test_disc_1",
            200,
            token=self.admin_token,
            description="Should delete test_disc_1 and all its messages"
        )
        
        if success:
            # Verify discussion is removed from discussions list
            discussions_success, discussions_response = self.run_test(
                "Verify Discussion Deleted",
                "GET",
                "discussions",
                200,
                token=self.admin_token,
                description="Should not show test_disc_1 in discussions list"
            )
            
            if discussions_success and isinstance(discussions_response, list):
                discussion_ids = [d.get('discussion_id') for d in discussions_response]
                if 'test_disc_1' not in discussion_ids:
                    print("✅ Discussion successfully deleted")
                    return True
                else:
                    print("❌ Discussion still found in discussions list")
                    return False
        return False

    def test_blocked_emails_list(self):
        """Test GET /api/admin/blocked - lists all blocked emails"""
        success, response = self.run_test(
            "List Blocked Emails",
            "GET",
            "admin/blocked",
            200,
            token=self.admin_token,
            description="Should return list of blocked emails"
        )
        
        if success and isinstance(response, list):
            print(f"✅ Found {len(response)} blocked emails")
            return True
        return False

    def test_member_access_denied(self):
        """Test that regular members cannot access admin endpoints"""
        # Create a new member session for testing
        import subprocess
        result = subprocess.run([
            'mongosh', '--eval', '''
            use('test_database');
            var userId = 'test_member_access';
            var sessionToken = 'test_member_session';
            db.users.deleteOne({user_id: userId});
            db.user_sessions.deleteMany({user_id: userId});
            db.users.insertOne({
              user_id: userId,
              email: 'testmember@example.com',
              name: 'Test Member',
              role: 'member',
              onboarding_complete: true,
              created_at: new Date().toISOString()
            });
            db.user_sessions.insertOne({
              user_id: userId,
              session_token: sessionToken,
              expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
              created_at: new Date().toISOString()
            });
            '''
        ], capture_output=True, text=True)
        
        # Test member trying to access admin endpoints
        success, response = self.run_test(
            "Member Access Denied",
            "GET",
            "admin/members",
            403,  # Should fail with 403 Forbidden
            token="test_member_session",
            description="Regular members should not access admin endpoints"
        )
        return success

def main():
    print("🚀 Starting Admin Moderation Features Testing")
    print("=" * 60)
    
    tester = AdminModerationTester()
    
    # Test admin member management
    print("\n📋 Testing Admin Member Management...")
    tester.test_admin_members_list()
    tester.test_block_member()
    tester.test_blocked_member_cannot_login()
    tester.test_unblock_member()
    tester.test_remove_member()
    tester.test_cannot_block_admin()
    tester.test_cannot_remove_admin()
    
    # Test discussion management
    print("\n💬 Testing Discussion Management...")
    tester.test_delete_discussion()
    
    # Test blocked emails list
    print("\n🚫 Testing Blocked Emails Management...")
    tester.test_blocked_emails_list()
    
    # Test access control
    print("\n🔒 Testing Access Control...")
    tester.test_member_access_denied()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All admin moderation tests passed!")
        return 0
    else:
        print("❌ Some tests failed. Check the output above for details.")
        
        # Print failed tests summary
        failed_tests = [t for t in tester.test_results if t.get('status') != 'PASSED']
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test.get('status', 'UNKNOWN')}")
                if 'error' in test:
                    print(f"    Error: {test['error']}")
                elif 'error_data' in test:
                    print(f"    Error Data: {test['error_data']}")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())