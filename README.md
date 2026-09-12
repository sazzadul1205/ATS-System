````markdown
# 🎯 ATS Demo — Applicant Tracking System

A Laravel + Inertia demo of an **Applicant Tracking System (ATS)** that scores resumes against job listings using keyword matching, tracks application statuses through a hiring pipeline, and notifies applicants on status changes.

Built to demonstrate backend architecture, database design, and pragmatic Laravel patterns.

---

## 📚 Table of Contents

- [What This Is](#-what-this-is)
- [What This Is Not](#-what-this-is-not)
- [Feature Overview](#-feature-overview)
- [How the ATS Scoring Works](#-how-the-ats-scoring-works)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Running the Demo](#-running-the-demo)
- [Demo Data](#-demo-data)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Routes Overview](#-routes-overview)
- [Testing](#-testing)
- [Performance Notes](#-performance-notes)
- [Security Notes](#-security-notes)
- [Known Limitations](#-known-limitations)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 What This Is

A **demonstration project** showcasing:

- End-to-end resume submission → parsing → ATS scoring → status tracking
- Clean Controller → Service → Model architecture
- Indexed JSON-backed scoring with a fast indexed column for sorting/filtering
- Race-condition-safe score recalculation using atomic cache locks
- Bulk status updates with a single `UPDATE` + single bulk timeline insert
- Post-commit notifications (failed transactions never send mail)
- Inertia.js single-page app experience with server-side routing

Designed to be **read**, **run**, and **extended** — not deployed to production as-is.

---

## 🚫 What This Is Not

To be upfront about scope:

- **Not a production ATS.** Real ATS systems use NLP, embeddings, and LLM-based scoring. This uses keyword matching.
- **Not multi-tenant.** There is one implicit employer role.
- **Not fully authenticated per-role.** Applicant vs. employer auth separation is a roadmap item.
- **Not OCR-capable.** Scanned/image PDFs will not yield extractable text.
- **Not battle-tested at scale.** No queued resume parsing, S3, or CDN.
- **Not bug-free by design.** Some model `$fillable` arrays and migrations may drift; see [Known Limitations](#-known-limitations).

These are documented trade-offs, not oversights.

---

## ✨ Feature Overview

### For Applicants

- Public job listing view with keyword hints
- Apply form with CV upload (PDF / DOC / DOCX, ≤ 5 MB)
- **Magic-byte file validation** (not just extension)
- Duplicate submission guard (same email + same job within 5 minutes)
- Immediate ATS score + matched/missing keyword feedback after submission

### For Employers / Reviewers

- **ATS Dashboard:** status counts, average/min/max ATS score, top jobs, recent applications
- **Applications index** with filters: status, job, search, min ATS score
- **Single application view** with full ATS analysis + status timeline
- Inline status updates with notes
- **Bulk status update** with atomic timeline writes
- Recalculate ATS score on demand (idempotent, lock-protected)
- Per-job application views with grouped status counts

### Behind the Scenes

- Indexed `ats_score_percentage` column kept in sync via model `saving` event
- JSON `ats_score` payload as the canonical detailed result
- Cached dashboard stats with explicit cache busting on writes
- `DB::afterCommit` for notifications
- Soft deletes on applications, jobs, categories, locations
- Slug generation with automatic uniqueness on job listings

---

## 🧮 How the ATS Scoring Works

> **Algorithm:** Keyword overlap between resume text and job keywords, expressed as a percentage.

```
score = (matched_keywords / total_job_keywords) * 100
```

### Step-by-Step

1. **Resume text extraction**

    - `.pdf` → `smalot/pdfparser` → fallback `pdftotext` (Poppler) → fallback literal PDF stream scan
    - `.docx` → unzip `word/document.xml`, strip tags
    - `.doc` → `antiword` CLI → fallback ASCII byte filter

2. **Keyword normalization**

    - Lowercase, trim, collapse whitespace
    - Deduplicated, capped at 100 keywords

3. **Matching**

    - Multi-word keywords (e.g. `rest api`) → substring match
    - Single-word keywords (e.g. `docker`) → `\b` word-boundary regex

4. **Scoring & analysis**
    - Percentage = matched / total × 100
    - Level: `≥80` Excellent · `≥60` Good · `≥40` Fair · `<40` Needs Improvement
    - Returns matched list, missing list, suggestions, top matches/misses

### Example

Job keywords:

```
["react", "nodejs", "typescript", "postgresql", "aws", "docker", "git", "agile", "rest api", "graphql"]
```

Resume mentions: `react`, `nodejs`, `typescript`, `docker`, `git`, `agile` → **6 / 10 = 60%** → _Good_.

### Scoring Trade-offs

| Aspect       | Choice                                   | Why                                           |
| ------------ | ---------------------------------------- | --------------------------------------------- |
| Matching     | Literal keyword overlap                  | Fast, deterministic, easy to explain          |
| No stemming  | `"developers"` won't match `"developer"` | Keeps demo honest; stemming is a roadmap item |
| No synonyms  | `"JS"` ≠ `"JavaScript"`                  | Synonyms need a lookup table                  |
| No weighting | Every keyword counts equally             | Weighted keywords are a roadmap item          |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Request                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  ATSController  (Orchestration, validation, Inertia responses)  │
└───────┬───────────────────────────────────────┬─────────────────┘
        │                                       │
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────────┐
│   ATSService          │           │   Eloquent Models         │
│   (Pure scoring)      │◄──────────┤   Application             │
│   - text extraction   │           │   JobListing              │
│   - keyword match     │           │   ApplicantProfile        │
│   - analysis gen      │           │   ApplicantCv             │
└───────────────────────┘           │   StatusTimeline          │
                                    └───────────┬───────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │   MySQL / MariaDB         │
                                    │   JSON + indexed columns  │
                                    └───────────┬───────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │  Notifications            │
                                    │  (mail + database, queued)│
                                    └───────────────────────────┘
```

### Key Design Decisions

- **Indexed percentage column** — JSON is great for the payload, terrible for `ORDER BY`. Store `ats_score` JSON _and_ `ats_score_percentage` (indexed). The model's `saving` event syncs them automatically.
- **Atomic recalculation** — `Cache::lock("ats:recalc:{$id}", 30)` prevents concurrent recalcs on the same application.
- **After-commit notifications** — `DB::afterCommit()` ensures we never email on a rolled-back transaction.
- **Bulk updates** — 1 `UPDATE` + 1 bulk `insert` for N timeline rows, not N updates.
- **Grouped status counts** — `GROUP BY status` in one query instead of 4 `COUNT(*)` calls.
- **Soft deletes** — Applications, jobs, categories, locations keep history.

---

## 🛠 Tech Stack

| Layer           | Technology                                          |
| --------------- | --------------------------------------------------- |
| Backend         | PHP 8.2+, Laravel 11                                |
| Frontend        | Inertia.js + Vue 3 + Vite                           |
| Database        | MySQL 8 / MariaDB 10.6+                             |
| PDF parsing     | `smalot/pdfparser` + Poppler (`pdftotext`) fallback |
| DOC parsing     | `antiword` (optional)                               |
| File validation | Magic bytes + `ZipArchive` (DOCX)                   |
| Cache           | Redis or file driver                                |
| Queue           | Database driver (optional)                          |
| Testing         | Pest or PHPUnit                                     |

---

## 📋 Requirements

- **PHP** ≥ 8.2 with `zip`, `fileinfo`, `pdo_mysql` extensions
- **Composer** ≥ 2.x
- **Node.js** ≥ 18 + npm
- **MySQL** ≥ 8.0 or **MariaDB** ≥ 10.6
- **Optional CLIs** (for best PDF/DOC extraction):
    - `pdftotext` (from `poppler-utils`)
    - `antiword` (for `.doc`)
- **Optional:** Redis (cache/queue)

Install optional CLIs on Debian/Ubuntu:

```bash
sudo apt-get install poppler-utils antiword
```

On macOS:

```bash
brew install poppler antiword
```

---

## ⚙️ Installation

### 1. Clone & install dependencies

```bash
git clone <your-repo-url> ats-demo
cd ats-demo

composer install
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set your DB credentials:

```dotenv
APP_NAME="ATS Demo"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ats_demo
DB_USERNAME=root
DB_PASSWORD=

FILESYSTEM_DISK=public
QUEUE_CONNECTION=sync   # use 'database' + queue:work for async notifications
CACHE_STORE=file        # or 'redis'
```

### 3. Create the database

```bash
mysql -u root -p -e "CREATE DATABASE ats_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Migrate, link storage, seed

```bash
php artisan migrate:fresh --seed
php artisan storage:link
```

### 5. Build frontend & serve

```bash
npm run dev          # in one terminal
php artisan serve    # in another
```

Open **http://localhost:8000**.

---

## 🚀 Running the Demo

### Option A — Sync queue (simplest)

Leave `QUEUE_CONNECTION=sync` in `.env`. Notifications send inline.

### Option B — Async queue (recommended for realism)

```bash
# .env
QUEUE_CONNECTION=database

php artisan queue:table
php artisan migrate
php artisan queue:work
```

### Option C — Full dev stack

```bash
composer run dev
```

_(If you have the Laravel `composer dev` script configured.)_

---

## 🌱 Demo Data

The `ATSDemoSeeder` (invoked via `DatabaseSeeder`) creates:

| Entity             | Count | Notes                                          |
| ------------------ | ----- | ---------------------------------------------- |
| Users              | 1     | `test@example.com` / `password`                |
| Job Categories     | 5     | Engineering, Design, Marketing, Sales, Support |
| Locations          | 5     | Remote, NY, SF, London, Berlin                 |
| Job Listings       | 5     | Realistic titles with 6–10 keywords each       |
| Applicant Profiles | 10    | Seeded from a fixed list                       |
| Applications       | 10    | Spread across statuses & ATS score bands       |

### Score bands seeded

| Band   | ATS % | Count | Statuses                       |
| ------ | ----- | ----- | ------------------------------ |
| High   | 78–92 | 3     | shortlisted, hired             |
| Medium | 58–70 | 3     | pending, rejected              |
| Low    | 32–55 | 4     | rejected, pending, shortlisted |

### Reset

```bash
php artisan migrate:fresh --seed
```

---

## 📁 Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── ATSController.php              # All ATS HTTP entry points
│   └── Middleware/
│       └── HandleInertiaRequests.php      # Shared Inertia props
├── Models/
│   ├── Application.php                    # Core entity; statuses, ATS sync
│   ├── ApplicantProfile.php               # Applicant identity + CVs
│   ├── ApplicantCv.php                    # Multi-CV per profile (max 3)
│   ├── JobListing.php                     # Job postings + slug generation
│   ├── JobCategory.php                    # Categorization
│   ├── Location.php                       # Geographic tagging
│   ├── StatusTimeline.php                 # Status change audit trail
│   └── User.php                           # Auth user
├── Notifications/
│   └── ApplicationStatusUpdated.php       # Mail + database, queued
├── Providers/
│   └── AppServiceProvider.php
└── Services/
    └── ATSService.php                     # Pure scoring + text extraction

database/
├── factories/
│   └── UserFactory.php
├── migrations/
│   ├── 0001_01_01_000000_create_users_table.php
│   ├── 0001_01_01_000001_create_cache_table.php
│   ├── 0001_01_01_000002_create_jobs_table.php
│   ├── 2024_01_01_000001_create_ats_tables.php
│   └── 2025_01_15_000000_add_ats_score_percentage_to_applications_table.php
└── seeders/
    ├── ATSDemoSeeder.php
    └── DatabaseSeeder.php

resources/js/Pages/ATS/
├── Dashboard.vue
├── Apply.vue
├── Applications/
│   ├── Index.vue
│   └── Show.vue
└── Jobs/
    ├── Index.vue
    └── Applications.vue
```

---

## 🗄 Database Schema

### `users`

Standard Laravel auth table.

### `job_categories`

| Column                  | Type    | Notes          |
| ----------------------- | ------- | -------------- |
| id                      | bigint  | PK             |
| name                    | varchar |                |
| description             | text    | nullable       |
| is_active               | boolean | default `true` |
| timestamps, softDeletes |         |                |

### `locations`

| Column                  | Type    | Notes          |
| ----------------------- | ------- | -------------- |
| id                      | bigint  | PK             |
| name                    | varchar |                |
| country                 | varchar | nullable       |
| is_active               | boolean | default `true` |
| timestamps, softDeletes |         |                |

### `job_listings`

| Column                                      | Type              | Notes                       |
| ------------------------------------------- | ----------------- | --------------------------- |
| id                                          | bigint            | PK                          |
| user_id                                     | FK users          | nullable, nullOnDelete      |
| category_id                                 | FK job_categories | nullable, nullOnDelete      |
| title                                       | varchar           |                             |
| slug                                        | varchar           | nullable, unique-generating |
| description, requirements, responsibilities | text              | nullable                    |
| keywords                                    | json              | ATS matching source         |
| job_type                                    | varchar           | default `full-time`         |
| salary_min, salary_max                      | decimal(10,2)     | nullable                    |
| experience_required                         | int               | default 0                   |
| education_required                          | varchar           | default `bachelor`          |
| is_active, is_featured                      | boolean           |                             |
| expires_at                                  | timestamp         | nullable                    |
| timestamps, softDeletes                     |                   |                             |

Index: `(is_active, created_at)`

### `job_listing_location` (pivot)

`job_listing_id`, `location_id`, timestamps.

### `applicant_profiles`

| Column                      | Type     | Notes    |
| --------------------------- | -------- | -------- |
| id                          | bigint   | PK       |
| user_id                     | FK users | nullable |
| full_name                   | varchar  |          |
| email                       | varchar  |          |
| phone                       | varchar  | nullable |
| summary                     | text     | nullable |
| linkedin_url, portfolio_url | varchar  | nullable |
| timestamps, softDeletes     |          |          |

### `applicant_cvs`

| Column               | Type    | Notes           |
| -------------------- | ------- | --------------- |
| id                   | bigint  | PK              |
| applicant_profile_id | FK      | cascadeOnDelete |
| cv_path              | varchar |                 |
| original_filename    | varchar |                 |
| file_type            | varchar | default `pdf`   |
| order_position       | int     | default 0       |
| timestamps           |         |                 |

### `applications` (core table)

| Column                             | Type             | Notes                                     |
| ---------------------------------- | ---------------- | ----------------------------------------- |
| id                                 | bigint           | PK                                        |
| user_id                            | FK users         | nullable                                  |
| job_listing_id                     | FK job_listings  | cascadeOnDelete                           |
| applicant_profile_id               | FK               | nullable                                  |
| name, email, phone                 | varchar          |                                           |
| education_level                    | varchar          | default `bachelor`                        |
| years_of_experience                | int              | default 0                                 |
| resume_path                        | varchar          | nullable                                  |
| expected_salary                    | decimal(10,2)    | nullable                                  |
| **ats_score**                      | json             | Full analysis payload                     |
| **ats_score_percentage**           | tinyint unsigned | Indexed, synced from JSON                 |
| matched_keywords, missing_keywords | json             | nullable                                  |
| ats_last_attempted_at              | timestamp        | nullable                                  |
| ats_attempt_count                  | int              | default 0                                 |
| ats_calculation_status             | varchar          | pending / processing / completed / failed |
| status                             | varchar          | pending / shortlisted / rejected / hired  |
| employer_notes                     | text             | nullable                                  |
| facebook_link, linkedin_link       | varchar          | nullable                                  |
| timestamps, softDeletes            |                  |                                           |

Indexes: `(status, created_at)`, `(job_listing_id, status)`, `(ats_score_percentage)`

### `status_timelines`

| Column         | Type            | Notes           |
| -------------- | --------------- | --------------- |
| id             | bigint          | PK              |
| application_id | FK applications | cascadeOnDelete |
| status         | varchar         |                 |
| notes          | text            | nullable        |
| timestamps     |                 |                 |

Index: `(application_id)`

### `password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`

Standard Laravel infrastructure tables.

---

## 🛣 Routes Overview

| Method | URI                                  | Action                | Purpose                 |
| ------ | ------------------------------------ | --------------------- | ----------------------- |
| GET    | `/ats/dashboard`                     | `dashboard`           | ATS overview            |
| GET    | `/ats/applications`                  | `applications`        | Filterable list         |
| GET    | `/ats/applications/{id}`             | `showApplication`     | Detail + ATS analysis   |
| PATCH  | `/ats/applications/{id}/status`      | `updateStatus`        | Single status change    |
| PATCH  | `/ats/applications/bulk-status`      | `bulkUpdateStatus`    | Bulk status change      |
| POST   | `/ats/applications/{id}/recalculate` | `recalculateAtsScore` | Re-run scoring          |
| GET    | `/ats/jobs`                          | `jobs`                | Job listing index       |
| GET    | `/ats/jobs/{id}/applications`        | `jobApplications`     | Per-job applications    |
| GET    | `/ats/jobs/{id}/apply`               | `applyForm`           | Public apply form       |
| POST   | `/ats/jobs/{id}/apply`               | `storeApplication`    | Submit application + CV |

---

## 🧪 Testing

This demo currently ships **without automated tests** — this is a known gap and the #1 planned addition.

### Recommended first tests

```bash
php artisan make:test ATSServiceTest --pest
php artisan make:test ApplicationStatusTest --pest
php artisan make:test StoreApplicationTest --pest
```

Suggested coverage:

- **`ATSServiceTest`** — given resume text + keywords, assert score, matched, missing.
- **`ApplicationStatusTest`** — status transition writes timeline row + fires notification after commit.
- **`StoreApplicationTest`** — rejects duplicate within 5 min; rejects invalid PDF magic bytes; accepts valid PDF.
- **`BulkUpdateStatusTest`** — one `UPDATE` and one bulk insert; timeline rows created; notification queued.

### Running tests

```bash
php artisan test
# or with Pest
./vendor/bin/pest
```

---

## ⚡ Performance Notes

| Concern                                | Mitigation                                                       |
| -------------------------------------- | ---------------------------------------------------------------- |
| Sorting/filtering by ATS score         | Indexed `ats_score_percentage` column                            |
| Dashboard status counts (4 queries)    | Single `GROUP BY status` query                                   |
| Dashboard aggregate stats              | Cached 60s + cache-busted on write                               |
| Bulk status changes                    | 1 `UPDATE` + 1 bulk `insert`                                     |
| Concurrent recalculation               | `Cache::lock()` per-application                                  |
| Notification delivery blocking request | `ShouldQueue` + async worker                                     |
| N+1 on application lists               | Eager-loaded `jobListing`, `category`                            |
| Filtering performance                  | Indexes on `(status, created_at)` and `(job_listing_id, status)` |

---

## 🔒 Security Notes

- **File upload validation** — Magic-byte check (not just extension) for PDF, DOC, DOCX.
- **DOCX verification** — `ZipArchive` confirms `word/document.xml` exists (blocks renamed ZIPs).
- **SQL injection** — Eloquent parameter binding throughout; no raw SQL with user input.
- **Mass assignment** — `$fillable` arrays on all models.
- **CSRF** — Inertia + Laravel default middleware.
- **Rate limiting** — Duplicate submission guard (5 min per email + job). Not a substitute for full rate limiting middleware.

### Production hardening (not implemented)

- Per-role authentication middleware
- Signed URLs for resume downloads
- S3 storage with private ACLs
- Virus scanning on uploads (`clamav`)
- IP-based rate limiting on public apply route

---

## ⚠️ Known Limitations

Be aware of these before relying on this repo:

1. **Model/migration drift** — Some `$fillable` entries reference columns not yet in migrations (e.g. `JobListing` fields, `ApplicantCv` fields). Aligning these is a top roadmap priority.
2. **No automated test suite** — Recommended tests are outlined above.
3. **PDF extraction is best-effort** — Falls back through three strategies; scanned PDFs without a text layer will fail.
4. **No OCR** — Image-only PDFs and JPGs are rejected at upload.
5. **Queue is optional** — With `QUEUE_CONNECTION=sync`, notifications block the request.
6. **Notification `old_status` is `null` for bulk updates** — Because old status isn't tracked per-application before the bulk `UPDATE`.
7. **Dashboard cache not busted on single status update** — Only `storeApplication` currently busts `ats:status-counts`. Bulk/individual updates refresh within 30s.
8. **Seeder location attachment uses `rand(1,5)`** — Fragile if IDs shift; use `Location::inRandomOrder()->first()->id` instead.
9. **Seeded ATS payloads have empty `matched_keywords` arrays** — Only submissions through the apply flow get full analysis.
10. **No multi-tenant isolation** — Single employer context only.

---

## 🗺 Roadmap

### Near-term

- [ ] Add Pest test suite (ATSService, status transitions, file validation)
- [ ] Align every model `$fillable` against its migration
- [ ] Add `FormRequest` classes for `storeApplication` and `updateStatus`
- [ ] Cache-bust `ats:status-counts` on all status-changing actions
- [ ] Track `old_status` correctly for bulk updates
- [ ] Add a `README` architecture diagram image

### Medium-term

- [ ] Weighted keywords (`{ term, weight }`) in `JobListing::$keywords`
- [ ] Resume section detection (skills, experience, education)
- [ ] Role-based auth (applicant / employer / admin)
- [ ] Queued ATS recalculation via job dispatch
- [ ] S3 storage + signed URLs for resumes
- [ ] Export applications to CSV/Excel
- [ ] Email templates (Blade + MJML)

### Long-term

- [ ] LLM-based scoring via embedding similarity (OpenAI/Claude)
- [ ] OCR integration (Tesseract) for scanned PDFs
- [ ] Multi-tenant with row-level scoping
- [ ] Analytics dashboard (funnel, time-to-hire, source tracking)
- [ ] Interview scheduling + calendar integration
- [ ] Candidate portal with application history

---

## 📄 License

MIT License. See `LICENSE` for details.

This is a demonstration project. Use it, fork it, learn from it — attribution appreciated but not required.

---

## 🙋 Author

Built as a portfolio demonstration of Laravel backend architecture, service-layer design, and pragmatic ATS workflows.

**Questions, issues, or ideas?** Open an issue or reach out directly.

---

_Last updated: 2025_
````
