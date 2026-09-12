<?php
// app/Models/Application.php

namespace App\Models;

use App\Models\User;
use App\Notifications\ApplicationStatusUpdated;
use App\Services\ATSService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Application extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'job_listing_id',
        'applicant_profile_id',
        'name',
        'email',
        'phone',
        'education_level',
        'years_of_experience',
        'resume_path',
        'expected_salary',
        'ats_score',
        'ats_score_percentage',
        'matched_keywords',
        'missing_keywords',
        'ats_last_attempted_at',
        'ats_attempt_count',
        'ats_calculation_status',
        'status',
        'employer_notes',
        'facebook_link',
        'linkedin_link',
    ];

    protected $casts = [
        'expected_salary'       => 'decimal:2',
        'ats_score'             => 'array',
        'ats_score_percentage'  => 'integer',
        'matched_keywords'      => 'array',
        'missing_keywords'      => 'array',
        'ats_last_attempted_at' => 'datetime',
        'ats_attempt_count'     => 'integer',
        'years_of_experience'   => 'integer',
        'created_at'            => 'datetime',
        'updated_at'            => 'datetime',
        'deleted_at'            => 'datetime',
    ];

    /* ==========================================
     | STATUS CONSTANTS
     |========================================== */

    public const STATUS_PENDING     = 'pending';
    public const STATUS_SHORTLISTED = 'shortlisted';
    public const STATUS_REJECTED    = 'rejected';
    public const STATUS_HIRED       = 'hired';

    public static array $statuses = [
        self::STATUS_PENDING,
        self::STATUS_SHORTLISTED,
        self::STATUS_REJECTED,
        self::STATUS_HIRED,
    ];

    /* ==========================================
     | ATS STATUS CONSTANTS
     |========================================== */

    public const ATS_PENDING    = 'pending';
    public const ATS_PROCESSING = 'processing';
    public const ATS_COMPLETED  = 'completed';
    public const ATS_FAILED     = 'failed';

    public static array $atsStatuses = [
        self::ATS_PENDING,
        self::ATS_PROCESSING,
        self::ATS_COMPLETED,
        self::ATS_FAILED,
    ];

    /* ==========================================
     | MODEL EVENTS
     |========================================== */

    protected static function booted(): void
    {
        // Keep ats_score_percentage in sync with ats_score JSON.
        static::saving(function (Application $app): void {
            $app->ats_score_percentage = $app->ats_score['percentage'] ?? null;
        });
    }

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    public function applicantProfile(): BelongsTo
    {
        return $this->belongsTo(ApplicantProfile::class);
    }

    public function statusTimelines(): HasMany
    {
        return $this->hasMany(StatusTimeline::class)->orderBy('created_at');
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    public function scopePending(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PENDING);
    }

    public function scopeShortlisted(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_SHORTLISTED);
    }

    public function scopeRejected(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_REJECTED);
    }

    public function scopeHired(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_HIRED);
    }

    public function scopeByJob(Builder $q, int $jobId): Builder
    {
        return $q->where('job_listing_id', $jobId);
    }

    public function scopeByEmployer(Builder $q, int $employerId): Builder
    {
        return $q->whereHas('jobListing', fn(Builder $sub) => $sub->where('user_id', $employerId));
    }

    public function scopeMinAtsScore(Builder $q, int|float $minScore): Builder
    {
        return $q->where('ats_score_percentage', '>=', $minScore);
    }

    public function scopeAtsScoreBetween(Builder $q, int|float $min, int|float $max): Builder
    {
        return $q->whereBetween('ats_score_percentage', [$min, $max]);
    }

    /**
     * Grouped status counts — 1 query instead of 4.
     *
     * @return array{pending:int,shortlisted:int,rejected:int,hired:int,total:int}
     */
    public static function statusCounts(?Builder $query = null): array
    {
        $counts = ($query ?? static::query())
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        return [
            'pending'     => (int) ($counts[self::STATUS_PENDING]     ?? 0),
            'shortlisted' => (int) ($counts[self::STATUS_SHORTLISTED] ?? 0),
            'rejected'    => (int) ($counts[self::STATUS_REJECTED]    ?? 0),
            'hired'       => (int) ($counts[self::STATUS_HIRED]       ?? 0),
            'total'       => array_sum($counts),
        ];
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    /**
     * Update application status atomically.
     * Writes status + timeline row in one transaction,
     * then fires the notification AFTER commit.
     */
    public function updateStatus(string $newStatus, ?string $notes = null): bool
    {
        $oldStatus = $this->status;

        $ok = DB::transaction(function () use ($newStatus, $notes): bool {
            $updated = $this->update([
                'status'         => $newStatus,
                'employer_notes' => $notes,
            ]);

            if (! $updated) {
                return false;
            }

            $this->statusTimelines()->create([
                'status' => $newStatus,
                'notes'  => $notes,
            ]);

            return true;
        });

        if ($ok) {
            DB::afterCommit(function () use ($oldStatus, $newStatus, $notes): void {
                $this->loadMissing('user');
                $this->user?->notify(new ApplicationStatusUpdated($this, $oldStatus, $notes));
            });
        }

        return $ok;
    }

    public function getActualResumePath(): ?string
    {
        if (! empty($this->resume_path)) {
            return $this->resume_path;
        }

        $profile = $this->relationLoaded('applicantProfile')
            ? $this->applicantProfile
            : $this->applicantProfile()->with('primaryCv')->first();

        return $profile?->primaryCv?->cv_path;
    }

    public function isAtsCompleted(): bool
    {
        return $this->ats_calculation_status === self::ATS_COMPLETED;
    }

    public function isAtsCalculationStuck(int $minutes = 30): bool
    {
        if (! in_array($this->ats_calculation_status, [self::ATS_PENDING, self::ATS_PROCESSING], true)) {
            return false;
        }

        $cutoff = now()->subMinutes($minutes);

        return $this->ats_last_attempted_at
            ? $this->ats_last_attempted_at < $cutoff
            : $this->created_at < $cutoff;
    }

    /**
     * Calculate ATS score. Writes both `ats_score` (JSON) and
     * `ats_score_percentage` (indexed integer — set by the saving event).
     */
    public function calculateATSScore(): bool
    {
        try {
            if (! class_exists(ATSService::class)) {
                $this->update([
                    'ats_calculation_status' => self::ATS_FAILED,
                    'ats_score'              => [
                        'percentage' => 0,
                        'error'      => 'ATS Service not available.',
                        'status'     => 'service_missing',
                    ],
                    'ats_last_attempted_at'  => now(),
                    'ats_attempt_count'      => ($this->ats_attempt_count ?? 0) + 1,
                ]);

                return false;
            }

            $this->loadMissing(['jobListing', 'applicantProfile']);

            if (! $this->jobListing) {
                throw new \Exception('Job listing not found for ATS calculation');
            }

            $this->update(['ats_calculation_status' => self::ATS_PROCESSING]);

            /** @var ATSService $atsService */
            $atsService = app(ATSService::class);
            $result = $atsService->calculateScore($this, $this->jobListing);

            $this->update([
                'ats_score'              => $result,
                'matched_keywords'       => $result['matched_keywords'] ?? [],
                'missing_keywords'       => $result['missing_keywords'] ?? [],
                'ats_calculation_status' => self::ATS_COMPLETED,
                'ats_last_attempted_at'  => now(),
                'ats_attempt_count'      => ($this->ats_attempt_count ?? 0) + 1,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('ATS Score calculation failed', [
                'application_id' => $this->id,
                'error'          => $e->getMessage(),
            ]);

            $this->update([
                'ats_calculation_status' => self::ATS_FAILED,
                'ats_score'              => [
                    'percentage' => 0,
                    'error'      => $e->getMessage(),
                    'status'     => 'failed',
                ],
                'ats_last_attempted_at'  => now(),
                'ats_attempt_count'      => ($this->ats_attempt_count ?? 0) + 1,
            ]);

            return false;
        }
    }

    /**
     * Recalculate with an atomic lock so parallel requests don't double-run.
     */
    public function recalculateAtsScoreInline(): bool
    {
        return Cache::lock("ats:recalc:{$this->id}", 30)->block(5, function (): bool {
            $this->update([
                'ats_calculation_status' => self::ATS_PENDING,
                'ats_score'              => null,
                'ats_score_percentage'   => null,
                'matched_keywords'       => null,
                'missing_keywords'       => null,
                'ats_attempt_count'      => 0,
            ]);

            return $this->calculateATSScore();
        });
    }

    public function canBeUpdated(): bool
    {
        return ! in_array($this->status, [self::STATUS_HIRED, self::STATUS_REJECTED], true);
    }

    /* ==========================================
     | ACCESSORS
     |========================================== */

    public function getResumeUrlAttribute(): ?string
    {
        return $this->resume_path ? asset('storage/' . $this->resume_path) : null;
    }

    /**
     * Prefer the indexed column, fall back to JSON for legacy rows.
     */
    public function getAtsScorePercentageAttribute(mixed $value): ?int
    {
        return $value !== null
            ? (int) $value
            : (isset($this->ats_score['percentage'])
                ? (int) $this->ats_score['percentage']
                : null);
    }
}
