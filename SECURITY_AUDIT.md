# 🔒 ATS System - Security Audit & Vulnerability Report

## Executive Summary

This document provides a comprehensive security audit of the Applicant Tracking System (ATS) codebase. The audit identifies potential vulnerabilities, security best practices already in place, and recommendations for production hardening.

---

## ✅ Security Strengths (Already Implemented)

### 1. File Upload Security
- **Magic-byte validation**: Files are validated by their actual binary content, not just extension
- **DOCX verification**: Uses `ZipArchive` to confirm `word/document.xml` exists (blocks renamed ZIP files)
- **File size limits**: Maximum 5MB for CV uploads
- **Allowed extensions**: Only PDF, DOC, DOCX permitted

```php
// Example from ATSController.php
'cv' => [
    'required',
    'file',
    'extensions:pdf,doc,docx',
    'max:5120',
    function (string $attribute, UploadedFile $file, Closure $fail): void {
        // Magic byte validation
    }
]
```

### 2. SQL Injection Prevention
- **Eloquent ORM**: All queries use parameterized bindings
- **No raw SQL with user input**: Queries are built using Eloquent's query builder
- **Prepared statements**: Laravel's PDO configuration uses prepared statements by default

### 3. Mass Assignment Protection
- **`$fillable` arrays**: All models explicitly define fillable attributes
- **Strong typing**: Validation rules enforce data types before database insertion

### 4. CSRF Protection
- **Inertia + Laravel**: Default CSRF middleware is active
- **Token validation**: Axios automatically includes `X-XSRF-TOKEN` header

### 5. Rate Limiting
- **Duplicate submission guard**: 5-minute cooldown per email + job combination
- **Throttle middleware**: Apply route has `throttle:5,1` (5 requests per minute)

### 6. Input Validation
- **Comprehensive validation rules**: All user inputs are validated
- **Type checking**: Numeric fields, dates, enums are all type-checked
- **String length limits**: Prevents buffer overflow attacks

### 7. Soft Deletes
- **Data recovery**: Applications, jobs, categories support soft deletes
- **Audit trail**: Deleted records can be recovered if needed

---

## ⚠️ Identified Vulnerabilities & Concerns

### HIGH PRIORITY

#### 1. Missing Authentication/Authorization Middleware
**Issue**: The ATS routes lack proper authentication middleware. Anyone with the URL can access employer functions.

**Current State**:
```php
Route::get('/ats/jobs', [ATSController::class, 'jobs']);
Route::post('/ats/jobs', [ATSController::class, 'storeJob']);
Route::delete('/ats/jobs/{jobId}', [ATSController::class, 'deleteJob']);
```

**Risk**: Unauthorized users can create, modify, or delete job postings.

**Recommendation**:
```php
Route::middleware(['auth', 'role:employer'])->group(function () {
    Route::get('/ats/jobs', [ATSController::class, 'jobs']);
    Route::post('/ats/jobs', [ATSController::class, 'storeJob']);
    Route::delete('/ats/jobs/{jobId}', [ATSController::class, 'deleteJob']);
});
```

#### 2. No Authorization Policies
**Issue**: No policy classes to check if the authenticated user owns the resource they're modifying.

**Risk**: Authenticated users could potentially modify other users' job postings.

**Recommendation**: Create `JobListingPolicy` with `update()` and `delete()` methods:
```php
class JobListingPolicy {
    public function update(User $user, JobListing $job): bool {
        return $user->id === $job->user_id;
    }
    
    public function delete(User $user, JobListing $job): bool {
        return $user->id === $job->user_id;
    }
}
```

#### 3. XSS Vulnerability in Pagination Labels
**Issue**: Pagination labels are rendered with `dangerouslySetInnerHTML` without sanitization.

**Location**: `/resources/js/pages/ATS/Jobs/Index.jsx` line ~158
```jsx
dangerouslySetInnerHTML={{ __html: link.label }}
```

**Risk**: If an attacker can inject HTML into pagination labels, they could execute malicious scripts.

**Recommendation**: Sanitize HTML output or use text content only:
```jsx
// Option 1: Use DOMPurify
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(link.label) }}

// Option 2: Use textContent (safer)
{link.label}
```

#### 4. Path Traversal in File Downloads
**Issue**: Resume file paths may be vulnerable to path traversal attacks if not properly sanitized.

**Risk**: Attackers could potentially access files outside the intended directory.

**Recommendation**: 
- Use signed URLs for downloads
- Validate file paths against allowed directories
- Store files outside web root

#### 5. Missing Input Sanitization on Rich Text Fields
**Issue**: `description` and `requirements` fields accept HTML without sanitization.

**Risk**: Stored XSS attacks through job descriptions.

**Recommendation**: 
```php
use Illuminate\Support\Facades\Purifier;

'description' => ['required', 'string'],
// Then sanitize before saving:
'description' => Purifier::clean($request->description),
```

### MEDIUM PRIORITY

#### 6. No Rate Limiting on Admin Routes
**Issue**: Job creation/update/delete routes lack rate limiting.

**Risk**: Brute force attacks, DoS through resource exhaustion.

**Recommendation**:
```php
Route::post('/ats/jobs', [ATSController::class, 'storeJob'])
    ->middleware('throttle:30,1'); // 30 per minute
```

#### 7. Sensitive Data Exposure in Error Messages
**Issue**: Some error messages might leak internal information.

**Location**: `recalculateAtsScore` method returns raw exception messages.

**Recommendation**:
```php
catch (\Throwable $e) {
    \Log::error('ATS recalculation failed', ['exception' => $e]);
    return back()->with('error', 'An error occurred while recalculating the score.');
}
```

#### 8. Missing Content-Type Validation on API Responses
**Issue**: Responses don't explicitly set Content-Type headers.

**Risk**: MIME type confusion attacks.

**Recommendation**: Laravel handles this by default, but verify in `app/Http/Kernel.php`.

#### 9. No Audit Logging
**Issue**: No logging of who created/modified/deleted job postings.

**Risk**: Cannot track malicious insider activity.

**Recommendation**: Implement audit logging package or custom solution:
```php
// In JobListing model
protected static function booted() {
    static::created(fn($job) => ActivityLog::create([
        'user_id' => auth()->id(),
        'action' => 'job_created',
        'model' => JobListing::class,
        'model_id' => $job->id,
    ]));
}
```

#### 10. Weak Password Requirements (if auth is implemented)
**Issue**: No password policy enforcement visible in codebase.

**Recommendation**: 
```php
'password' => ['required', 'min:12', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'uncompromised']
```

### LOW PRIORITY

#### 11. Missing Security Headers
**Issue**: No explicit security headers configured (CSP, HSTS, X-Frame-Options).

**Recommendation**: Add to middleware or `.htaccess`:
```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### 12. No Virus Scanning on Uploads
**Issue**: Uploaded CVs are not scanned for malware.

**Recommendation**: Integrate ClamAV:
```php
use Xenolope\Quahog\Quahog;

$scanner = new Quahog('/var/run/clamav/clamd.ctl');
$scanResult = $scanner->scanStream($file->get());
if ($scanResult->isInfected()) {
    $fail('File contains malware.');
}
```

#### 13. Session Security Configuration
**Issue**: Session configuration should be verified for production.

**Recommendation**: Ensure in `config/session.php`:
```php
'expire_on_close' => true,
'secure' => env('SESSION_SECURE_COOKIE', true),
'http_only' => true,
'same_site' => 'lax',
```

#### 14. Database Credentials in Environment
**Issue**: Ensure `.env` file is not committed and has proper permissions.

**Recommendation**: 
- Add `.env` to `.gitignore` (already done)
- Set restrictive file permissions: `chmod 600 .env`

#### 15. No CAPTCHA on Public Forms
**Issue**: Apply form could be abused by bots.

**Recommendation**: Add reCAPTCHA v3:
```php
'captcha' => ['required', 'captcha'],
```

---

## 🛡️ Production Hardening Checklist

### Before Deployment

- [ ] Enable authentication middleware on all employer routes
- [ ] Implement authorization policies for all resources
- [ ] Add rate limiting to all state-changing endpoints
- [ ] Configure HTTPS/TLS with HSTS
- [ ] Set up proper session security cookies
- [ ] Enable CSRF protection verification
- [ ] Configure Content Security Policy headers
- [ ] Set up virus scanning for file uploads
- [ ] Implement audit logging
- [ ] Remove debug mode (`APP_DEBUG=false`)
- [ ] Configure proper error pages (no stack traces)
- [ ] Set up database backups with encryption
- [ ] Configure firewall rules
- [ ] Enable DDoS protection (Cloudflare, etc.)
- [ ] Set up monitoring and alerting

### Ongoing Maintenance

- [ ] Regular dependency updates (`composer update`, `npm update`)
- [ ] Security patch monitoring
- [ ] Log review and analysis
- [ ] Penetration testing (quarterly)
- [ ] Access review (who has admin access)
- [ ] Backup verification and restore testing
- [ ] SSL certificate renewal monitoring

---

## 📋 Recommended Security Packages

```json
{
    "require": {
        "spatie/laravel-permission": "^6.0",
        "spatie/laravel-activitylog": "^4.7",
        "laravel/sanctum": "^3.3",
        "intervention/image": "^3.0",
        "xenolope/quahog": "^3.0"
    },
    "require-dev": {
        "phpunit/phpunit": "^10.0",
        "brianium/paratest": "^7.0",
        "fakerphp/faker": "^1.23"
    }
}
```

---

## 🔍 Testing Recommendations

### Security Test Cases

1. **Authentication Bypass**
   - Try accessing `/ats/jobs/create` without login
   - Try modifying job postings belonging to other users

2. **SQL Injection**
   - Submit `' OR '1'='1` in search fields
   - Test all filter parameters

3. **XSS Testing**
   - Submit `<script>alert('XSS')</script>` in job descriptions
   - Test application names, emails, notes

4. **File Upload Attacks**
   - Upload PHP file renamed as `.pdf`
   - Upload file with malicious magic bytes
   - Test large file uploads (>5MB)
   - Upload zip bombs

5. **Rate Limiting**
   - Rapid-fire form submissions
   - Concurrent requests from same IP

6. **CSRF Testing**
   - Attempt POST without CSRF token
   - Test cross-origin requests

---

## 📞 Incident Response Plan

If a security breach is detected:

1. **Immediate Actions**
   - Enable maintenance mode: `php artisan down`
   - Rotate all API keys and secrets
   - Revoke suspicious sessions
   - Preserve logs for forensics

2. **Investigation**
   - Review audit logs
   - Identify affected data
   - Determine attack vector
   - Document timeline

3. **Recovery**
   - Patch vulnerability
   - Restore from clean backup if needed
   - Notify affected users (if PII compromised)
   - Gradual service restoration

4. **Post-Incident**
   - Conduct post-mortem
   - Update security procedures
   - Implement additional controls
   - Schedule penetration test

---

## 📚 References

- [Laravel Security Documentation](https://laravel.com/docs/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)
- [Inertia.js Security Guide](https://inertiajs.com/security)

---

**Last Updated**: 2025-01-XX  
**Audited By**: Security Review Process  
**Next Review Date**: Quarterly
