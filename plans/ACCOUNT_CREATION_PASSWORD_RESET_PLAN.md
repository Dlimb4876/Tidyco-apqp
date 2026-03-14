# Account Creation & Password Reset Implementation Plan

## Overview

This document outlines the implementation plan for adding user account creation and password reset functionality to the Tidyco Operations Portal. The system will be restricted to `@tidyco.co.uk` email addresses only.

---

## Current State Analysis

### Existing Authentication Setup
- **Provider**: Supabase Auth (v2)
- **Configuration**: 
  - URL: `https://eihxvmzsfnpdaizggsvs.supabase.co`
  - Public key configured in `core/js/auth.js`
- **Login Flow**: Email/password sign-in via `doLogin()` function
- **Session Management**: `currentUser` global variable, persists across sessions
- **Logout**: `doLogout()` clears session and returns to login screen

### Missing Features
- ❌ No user registration/sign-up flow
- ❌ No password reset mechanism
- ❌ No email domain validation
- ❌ No email verification step
- ❌ Login screen lacks "Forgot password?" and "Create account" links

---

## Requirements

### Functional Requirements
1. **Account Creation**
   - Users can request account creation with `@tidyco.co.uk` email
   - Email domain validation (reject non-Tidyco emails)
   - Email verification required before account activation
   - Password strength requirements enforced
   - Duplicate account prevention

2. **Password Reset**
   - Users can request password reset via email
   - Secure reset token with expiration (1 hour)
   - Password reset form with validation
   - Confirmation upon successful reset

3. **Email Restrictions**
   - Only `@tidyco.co.uk` emails accepted
   - Clear error messages for invalid domains
   - Case-insensitive domain matching

### Non-Functional Requirements
- Mobile-responsive UI
- Accessible forms (WCAG 2.1 AA)
- Secure password handling (Supabase handles hashing)
- Rate limiting on requests (Supabase built-in)
- No plain-text password storage
- Audit trail for account actions

---

## Implementation Options

### Option 1: Supabase Auth Built-in (RECOMMENDED) ⭐

**Description**: Use Supabase's built-in sign-up and password reset flows with custom UI.

**Pros**:
- ✅ Minimal infrastructure changes
- ✅ Built-in email verification and recovery
- ✅ Secure token management handled by Supabase
- ✅ RLS policies already in place
- ✅ No additional database tables needed
- ✅ Automatic rate limiting and security

**Cons**:
- ⚠️ Custom email templates require Supabase dashboard configuration
- ⚠️ Limited customization of verification emails (without custom SMTP)

**Implementation Effort**: 2-3 days

---

### Option 2: Custom Backend with Email Service

**Description**: Build custom account management API with dedicated email service (e.g., SendGrid, Resend).

**Pros**:
- ✅ Full control over email templates
- ✅ Custom validation logic
- ✅ Detailed audit logging

**Cons**:
- ❌ Requires additional infrastructure (Edge Functions or server)
- ❌ More complex security considerations
- ❌ Higher maintenance burden
- ❌ Additional cost for email service

**Implementation Effort**: 5-7 days

---

### Option 3: Admin-Mediated Account Creation

**Description**: Users request accounts via form, admin manually creates accounts in Supabase dashboard.

**Pros**:
- ✅ Simplest implementation
- ✅ Full admin control over who gets access
- ✅ No email verification complexity

**Cons**:
- ❌ Poor user experience (delayed access)
- ❌ Admin overhead for each new user
- ❌ Not scalable

**Implementation Effort**: 1 day

---

## Recommended Approach: Option 1 (Supabase Auth Built-in)

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Login Screen  │────▶│  Supabase Auth   │────▶│  Email Delivery │
│  (Custom UI)    │     │  (Managed)       │     │  (Supabase)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        ▲                       │
        │                       ▼
        │              ┌──────────────────┐
        └──────────────│  User Confirms   │
                       │  Email Link      │
                       └──────────────────┘
```

---

## Implementation Steps

### Phase 1: Supabase Configuration (Day 1)

#### 1.1 Enable Email Auth in Supabase
- [ ] Go to Supabase Dashboard → Authentication → Providers
- [ ] Enable "Email" provider
- [ ] Configure email templates:
  - **Invite/User Confirmation**: Custom message with Tidyco branding
  - **Recovery Email**: Password reset instructions
- [ ] Set `Site URL` to production URL
- [ ] Add redirect URLs for email confirmation

#### 1.2 Configure Email Settings
- [ ] Verify sender email in Supabase (e.g., `noreply@tidyco.co.uk`)
- [ ] Test email delivery
- [ ] Optional: Configure custom SMTP for branded emails

#### 1.3 Set Up RLS Policies
- [ ] Ensure `auth.users` table has correct policies
- [ ] Verify existing tables allow authenticated access only

---

### Phase 2: Frontend Implementation (Days 2-3)

#### 2.1 Update Login Screen (`index.html`)

**Add "Create Account" and "Forgot Password?" links:**

```html
<div class="login-field">
  <label>Password</label>
  <input type="password" id="loginPassword" placeholder="••••••••" 
         onkeydown="if(event.key==='Enter')doLogin()">
</div>

<!-- NEW: Action links -->
<div class="login-actions" style="display:flex;justify-content:space-between;margin:12px 0;">
  <a href="#" onclick="showForgotPassword();return false;" 
     style="font-size:13px;color:var(--blue);text-decoration:none;">Forgot password?</a>
  <a href="#" onclick="showSignUp();return false;" 
     style="font-size:13px;color:var(--blue);text-decoration:none;">Create account</a>
</div>

<button class="login-btn" id="loginBtn" onclick="doLogin()">Sign in</button>

<!-- NEW: Sign Up Form (hidden by default) -->
<div id="signUpForm" style="display:none;">
  <div class="login-title">Create Account</div>
  <div class="login-err" id="signUpErr"></div>
  <div class="login-field">
    <label>Tidyco Email</label>
    <input type="email" id="signUpEmail" placeholder="name@tidyco.co.uk">
    <small style="color:var(--muted);font-size:11px;">
      Only @tidyco.co.uk emails are accepted
    </small>
  </div>
  <div class="login-field">
    <label>Password</label>
    <input type="password" id="signUpPassword" placeholder="Min 8 characters">
    <small style="color:var(--muted);font-size:11px;">
      Min 8 characters, include number & uppercase
    </small>
  </div>
  <div class="login-field">
    <label>Confirm Password</label>
    <input type="password" id="signUpConfirm" placeholder="Re-enter password">
  </div>
  <button class="login-btn" onclick="doSignUp()">Create Account</button>
  <button class="login-btn" style="background:var(--muted);margin-top:8px;" 
          onclick="hideSignUp()">Back to Sign In</button>
</div>

<!-- NEW: Forgot Password Form (hidden by default) -->
<div id="forgotPasswordForm" style="display:none;">
  <div class="login-title">Reset Password</div>
  <div class="login-err" id="resetErr"></div>
  <div class="login-suc" id="resetSuc" style="display:none;"></div>
  <div class="login-field">
    <label>Tidyco Email</label>
    <input type="email" id="resetEmail" placeholder="name@tidyco.co.uk">
  </div>
  <button class="login-btn" onclick="doResetPassword()">Send Reset Link</button>
  <button class="login-btn" style="background:var(--muted);margin-top:8px;" 
          onclick="hideForgotPassword()">Back to Sign In</button>
</div>
```

#### 2.2 Create New Auth Module (`core/js/auth-signup.js`)

```javascript
// ═══════════════════════════════════
// auth-signup.js — Account creation & password reset
// Depends on: auth.js (supa client, currentUser)
// ═══════════════════════════════════

const TIDYCO_DOMAIN = 'tidyco.co.uk';

// Validate email domain
function isValidTidycoEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith('@' + TIDYCO_DOMAIN);
}

// Validate password strength
function isValidPassword(password) {
  if (!password || password.length < 8) return false;
  // Require at least one uppercase and one number
  return /[A-Z]/.test(password) && /[0-9]/.test(password);
}

// Show sign up form
window.showSignUp = function() {
  document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
    <div class="login-logo">
      <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
      <div class="login-logo-sub">Create Account</div>
    </div>
    <div class="login-err" id="signUpErr"></div>
    <div class="login-field">
      <label>Tidyco Email</label>
      <input type="email" id="signUpEmail" placeholder="name@tidyco.co.uk" 
             autocomplete="email">
      <small style="color:var(--muted);font-size:11px;">
        Only @tidyco.co.uk emails are accepted
      </small>
    </div>
    <div class="login-field">
      <label>Password</label>
      <input type="password" id="signUpPassword" placeholder="Min 8 characters"
             autocomplete="new-password">
      <small style="color:var(--muted);font-size:11px;">
        Min 8 characters, include number & uppercase letter
      </small>
    </div>
    <div class="login-field">
      <label>Confirm Password</label>
      <input type="password" id="signUpConfirm" placeholder="Re-enter password"
             autocomplete="new-password">
    </div>
    <button class="login-btn" id="signUpBtn" onclick="doSignUp()">Create Account</button>
    <button class="login-btn" style="background:var(--muted);margin-top:8px;" 
            onclick="location.reload()">Back to Sign In</button>
  `;
};

// Handle sign up
window.doSignUp = async function() {
  const email = document.getElementById('signUpEmail')?.value.trim();
  const password = document.getElementById('signUpPassword')?.value;
  const confirm = document.getElementById('signUpConfirm')?.value;
  const btn = document.getElementById('signUpBtn');
  const err = document.getElementById('signUpErr');
  
  err.style.display = 'none';
  
  // Validation
  if (!email) {
    showSignUpErr('Please enter your email address.');
    return;
  }
  
  if (!isValidTidycoEmail(email)) {
    showSignUpErr('Only @tidyco.co.uk email addresses are accepted.');
    return;
  }
  
  if (!password || !isValidPassword(password)) {
    showSignUpErr('Password must be at least 8 characters with one uppercase letter and one number.');
    return;
  }
  
  if (password !== confirm) {
    showSignUpErr('Passwords do not match.');
    return;
  }
  
  // Submit to Supabase
  btn.disabled = true;
  btn.textContent = 'Creating...';
  
  try {
    const { data, error } = await supa.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        emailRedirectTo: window.location.origin + '/index.html',
        data: {
          email_domain: TIDYCO_DOMAIN
        }
      }
    });
    
    if (error) throw error;
    
    // Success - show confirmation
    document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
      <div class="login-logo">
        <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
        <div class="login-logo-sub">Check Your Email</div>
      </div>
      <div style="text-align:center;color:var(--ink);margin:16px 0;">
        <p style="margin-bottom:12px;">
          We've sent a confirmation link to:<br>
          <strong style="color:var(--blue);">${esc(email)}</strong>
        </p>
        <p style="font-size:13px;color:var(--muted);">
          Click the link to activate your account, then sign in.
        </p>
      </div>
      <button class="login-btn" onclick="location.reload()">Back to Sign In</button>
    `;
    
  } catch (err) {
    showSignUpErr(err.message || 'Failed to create account.');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
};

function showSignUpErr(msg) {
  const e = document.getElementById('signUpErr');
  e.textContent = msg;
  e.style.display = 'block';
}

// Show forgot password form
window.showForgotPassword = function() {
  document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
    <div class="login-logo">
      <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
      <div class="login-logo-sub">Reset Password</div>
    </div>
    <div class="login-err" id="resetErr"></div>
    <div class="login-suc" id="resetSuc" style="display:none;"></div>
    <div class="login-field">
      <label>Tidyco Email</label>
      <input type="email" id="resetEmail" placeholder="name@tidyco.co.uk"
             autocomplete="email">
    </div>
    <button class="login-btn" id="resetBtn" onclick="doResetPassword()">Send Reset Link</button>
    <button class="login-btn" style="background:var(--muted);margin-top:8px;" 
            onclick="location.reload()">Back to Sign In</button>
  `;
};

// Handle password reset
window.doResetPassword = async function() {
  const email = document.getElementById('resetEmail')?.value.trim();
  const btn = document.getElementById('resetBtn');
  const err = document.getElementById('resetErr');
  const suc = document.getElementById('resetSuc');
  
  err.style.display = 'none';
  suc.style.display = 'none';
  
  // Validation
  if (!email) {
    showResetErr('Please enter your email address.');
    return;
  }
  
  if (!isValidTidycoEmail(email)) {
    showResetErr('Only @tidyco.co.uk email addresses are accepted.');
    return;
  }
  
  // Submit to Supabase
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  try {
    const { error } = await supa.auth.resetPasswordForEmail(
      email.toLowerCase(),
      {
        redirectTo: window.location.origin + '/index.html#recover'
      }
    );
    
    if (error) throw error;
    
    // Success - show confirmation (even if email doesn't exist, for security)
    document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
      <div class="login-logo">
        <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
        <div class="login-logo-sub">Check Your Email</div>
      </div>
      <div style="text-align:center;color:var(--ink);margin:16px 0;">
        <p style="margin-bottom:12px;">
          If an account exists for <strong>${esc(email)}</strong>, 
          you'll receive a password reset link shortly.
        </p>
        <p style="font-size:13px;color:var(--muted);">
          The link expires in 1 hour.
        </p>
      </div>
      <button class="login-btn" onclick="location.reload()">Back to Sign In</button>
    `;
    
  } catch (err) {
    showResetErr(err.message || 'Failed to send reset link.');
    btn.disabled = false;
    btn.textContent = 'Send Reset Link';
  }
};

function showResetErr(msg) {
  const e = document.getElementById('resetErr');
  e.textContent = msg;
  e.style.display = 'block';
}

// Handle password recovery from URL hash
async function handlePasswordRecovery() {
  if (window.location.hash === '#recover') {
    // User clicked recovery link - show password reset form
    const session = await supa.auth.getSession();
    if (session.data.session) {
      // User is authenticated via recovery link - let them set new password
      showNewPasswordForm();
    }
  }
}

// Show new password form (after clicking recovery link)
function showNewPasswordForm() {
  document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
    <div class="login-logo">
      <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
      <div class="login-logo-sub">New Password</div>
    </div>
    <div class="login-err" id="newPassErr"></div>
    <div class="login-field">
      <label>New Password</label>
      <input type="password" id="newPassword" placeholder="Min 8 characters"
             autocomplete="new-password">
    </div>
    <div class="login-field">
      <label>Confirm New Password</label>
      <input type="password" id="confirmPassword" placeholder="Re-enter password"
             autocomplete="new-password">
    </div>
    <button class="login-btn" id="updatePassBtn" onclick="doUpdatePassword()">
      Update Password
    </button>
  `;
}

// Handle password update after recovery
window.doUpdatePassword = async function() {
  const newPassword = document.getElementById('newPassword')?.value;
  const confirm = document.getElementById('confirmPassword')?.value;
  const btn = document.getElementById('updatePassBtn');
  const err = document.getElementById('newPassErr');
  
  err.style.display = 'none';
  
  if (!newPassword || !isValidPassword(newPassword)) {
    showNewPassErr('Password must be at least 8 characters with one uppercase letter and one number.');
    return;
  }
  
  if (newPassword !== confirm) {
    showNewPassErr('Passwords do not match.');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Updating...';
  
  try {
    const { error } = await supa.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    // Success
    document.getElementById('loginScreen').querySelector('.login-box').innerHTML = `
      <div class="login-logo">
        <img src="Tidyco logo-blue.png" alt="Tidyco" class="login-logo-img">
        <div class="login-logo-sub">Password Updated</div>
      </div>
      <div style="text-align:center;color:var(--ink);margin:16px 0;">
        <p style="margin-bottom:12px;">
          Your password has been successfully updated.
        </p>
        <p style="font-size:13px;color:var(--muted);">
          You can now sign in with your new password.
        </p>
      </div>
      <button class="login-btn" onclick="location.reload()">Sign In</button>
    `;
    
  } catch (err) {
    showNewPassErr(err.message || 'Failed to update password.');
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
};

function showNewPassErr(msg) {
  const e = document.getElementById('newPassErr');
  e.textContent = msg;
  e.style.display = 'block';
}

// Initialize on page load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', handlePasswordRecovery);
}
```

#### 2.3 Update `index.html` Script Load Order

Add the new auth module after `auth.js`:

```html
<!-- Auth -->
<script src="core/js/auth.js"></script>
<script src="core/js/auth-signup.js"></script>  <!-- NEW -->
```

#### 2.4 Add CSS for New Elements (`core/css/components.css`)

```css
/* Sign up and reset forms */
.login-suc {
  background: #ecfdf5;
  color: #059669;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  margin: 12px 0;
  border: 1px solid #a7f3d0;
}

.login-actions {
  margin: 12px 0;
}

.login-actions a:hover {
  text-decoration: underline;
}

small {
  display: block;
  margin-top: 4px;
  color: var(--muted);
}
```

---

### Phase 3: Testing & Validation (Day 3)

#### 3.1 Manual Testing Checklist

**Account Creation:**
- [ ] Valid `@tidyco.co.uk` email accepted
- [ ] Non-Tidyco email rejected with clear error
- [ ] Weak password rejected
- [ ] Password mismatch detected
- [ ] Confirmation email received
- [ ] Email verification link works
- [ ] Verified user can sign in
- [ ] Duplicate email rejected

**Password Reset:**
- [ ] "Forgot password?" link visible
- [ ] Valid email accepted
- [ ] Non-Tidyco email rejected
- [ ] Reset email received
- [ ] Reset link redirects correctly
- [ ] New password can be set
- [ ] Weak password rejected
- [ ] Old password no longer works
- [ ] Reset link expires after 1 hour

**UI/UX:**
- [ ] Forms responsive on mobile
- [ ] Error messages clear and helpful
- [ ] Success messages informative
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

#### 3.2 Security Testing

- [ ] Rate limiting prevents brute force
- [ ] SQL injection prevented (Supabase handles)
- [ ] XSS prevented (escape all user input)
- [ ] CSRF protection (Supabase handles)
- [ ] Passwords never logged
- [ ] Session tokens secure

---

### Phase 4: Documentation & Rollout (Day 4)

#### 4.1 Update User Documentation
- [ ] Add "Getting Started" guide
- [ ] Document password requirements
- [ ] Create troubleshooting FAQ

#### 4.2 Admin Documentation
- [ ] How to manage users in Supabase dashboard
- [ ] How to resend verification emails
- [ ] How to disable compromised accounts

#### 4.3 Rollout Plan
1. Deploy to staging environment
2. Test with 2-3 internal users
3. Gather feedback and iterate
4. Deploy to production
5. Monitor for issues (first 48 hours)

---

## Database Schema (No Changes Required)

Supabase Auth handles user storage in `auth.users` table. No additional tables needed.

**Optional: Audit Log Table** (if detailed tracking needed)

```sql
CREATE TABLE account_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,  -- 'signup', 'login', 'password_reset', 'password_update'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE account_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON account_audit_log
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Supabase Dashboard Configuration

### Email Templates

**1. Confirm Signup:**
```
Subject: Confirm Your Tidyco Operations Portal Account

Hi,

Welcome to Tidyco Operations Portal!

Please confirm your email address by clicking the link below:

[Confirm Email]

This link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Thanks,
Tidyco Team
```

**2. Password Reset:**
```
Subject: Reset Your Tidyco Operations Portal Password

Hi,

Someone requested a password reset for your Tidyco Operations Portal account.

Click the link below to reset your password:

[Reset Password]

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
Tidyco Team
```

---

## Security Considerations

### Email Domain Validation
- Client-side validation for UX (immediate feedback)
- **Server-side validation via Supabase hooks** (if needed for extra security)
- Case-insensitive matching

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- Consider: special characters optional

### Rate Limiting
- Supabase provides built-in rate limiting
- Default: 3 signups per hour per IP
- Default: 4 password resets per hour per IP

### Session Security
- JWT tokens with 1-hour expiry
- Refresh tokens for persistent sessions
- Secure cookie storage

---

## Future Enhancements (Post-MVP)

1. **Multi-Factor Authentication (MFA)**
   - TOTP authenticator app support
   - SMS verification (requires Twilio integration)

2. **Admin User Management**
   - Admin portal to create/disable users
   - Bulk user import
   - Role-based access control

3. **Session Management**
   - View active sessions
   - Remote logout from other devices
   - Session activity logs

4. **Account Recovery Alternatives**
   - Security questions
   - Backup email address
   - Admin-assisted recovery

5. **Email Customization**
   - Custom SMTP server
   - Branded email templates with HTML
   - Email analytics

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Email delivery failures | High | Low | Configure custom SMTP, monitor delivery rates |
| Phishing attacks | Medium | Low | Clear email templates, user education |
| Brute force attacks | Medium | Low | Rate limiting, account lockout after failures |
| Password reuse | Low | Medium | Password strength requirements, breach detection |
| Account takeover | High | Low | MFA (future), session monitoring |

---

## Success Metrics

- **Time to first login**: < 5 minutes from signup
- **Email delivery rate**: > 99%
- **Password reset completion**: > 90%
- **User support tickets**: < 5% of users need assistance
- **Security incidents**: 0 successful attacks

---

## Appendix: Code Snippets

### Email Domain Validation Regex
```javascript
const TIDYCO_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@tidyco\.co\.uk$/i;
```

### Password Strength Checker
```javascript
function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    passed,
    total: 5,
    score: passed / 5, // 0.0 to 1.0
    checks
  };
}
```

### Supabase Auth Listener
```javascript
supa.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in');
      break;
    case 'SIGNED_OUT':
      console.log('User signed out');
      break;
    case 'PASSWORD_RECOVERY':
      console.log('Password recovery initiated');
      break;
  }
});
```

---

## Contact & Support

For questions or issues during implementation:
- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Supabase Discord**: https://discord.supabase.com
- **Project Lead**: [Add contact]

---

*Last updated: March 2026*
*Version: 1.0*
