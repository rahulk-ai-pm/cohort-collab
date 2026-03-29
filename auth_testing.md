# Auth-Gated App Testing Playbook

## Step 1: Create Test User & Session
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  role: 'member',
  professional_experience: 'Senior PM with 8 years experience',
  current_role: 'Product Manager at TestCorp',
  aspirations: 'Lead product strategy at scale',
  linkedin_url: 'https://linkedin.com/in/testuser',
  onboarding_complete: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Step 2: Create Admin Test Session
```bash
mongosh --eval "
use('test_database');
var userId = 'admin-user-' + Date.now();
var sessionToken = 'admin_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'vrk.bluestacks@gmail.com',
  name: 'Admin User',
  picture: '',
  role: 'admin',
  onboarding_complete: true,
  created_at: new Date().toISOString()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Admin session token: ' + sessionToken);
print('Admin User ID: ' + userId);
"
```

## Step 3: Browser Testing
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "YOUR_SESSION_TOKEN",
    "domain": "your-app.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://your-app.com/dashboard")
```
