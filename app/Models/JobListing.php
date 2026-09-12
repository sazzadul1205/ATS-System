<?php
// app/Models/JobListing.php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class JobListing extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'requirements',
        'job_type',
        'salary_min',
        'salary_max',
        'is_salary_negotiable',
        'as_per_companies_policy',
        'category_id',
        'experience_level',
        'education_requirement',
        'education_details',
        'benefits',
        'skills',
        'responsibilities',
        'keywords',
        'application_deadline',
        'publish_at',
        'views_count',
        'is_active',
        'user_id',
        'required_facebook_link',
        'required_linkedin_link',
    ];

    protected $casts = [
        'salary_min'                => 'decimal:2',
        'salary_max'                => 'decimal:2',
        'is_salary_negotiable'      => 'boolean',
        'as_per_companies_policy'   => 'boolean',
        'benefits'                  => 'array',
        'skills'                    => 'array',
        'responsibilities'          => 'array',
        'keywords'                  => 'array',
        'is_active'                 => 'boolean',
        'required_facebook_link'    => 'boolean',
        'required_linkedin_link'    => 'boolean',
        'application_deadline'      => 'date',
        'publish_at'                => 'date',
        'views_count'               => 'integer',
        'created_at'                => 'datetime',
        'updated_at'                => 'datetime',
        'deleted_at'                => 'datetime',
    ];

    public static array $jobTypes = [
        'full-time',
        'part-time',
        'contract',
        'internship',
        'remote',
        'hybrid',
    ];

    public static array $experienceLevels = [
        'entry',
        'junior',
        'mid-level',
        'senior',
        'lead',
        'executive',
    ];

    protected static function booted(): void
    {
        static::creating(function (JobListing $job): void {
            if (empty($job->slug)) {
                $baseSlug = Str::slug($job->title);
                $slug = $baseSlug;
                $counter = 1;

                while (self::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $job->slug = $slug;
            }
        });

        static::updating(function (JobListing $job): void {
            if ($job->isDirty('title') && ! $job->isDirty('slug')) {
                $baseSlug = Str::slug($job->title);
                $slug = $baseSlug;
                $counter = 1;

                while (self::where('slug', $slug)->where('id', '!=', $job->id)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $job->slug = $slug;
            }
        });
    }

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    public function employer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(JobCategory::class, 'category_id');
    }

    public function locations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'job_listing_location')
            ->withTimestamps();
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Active (published/visible) — does NOT check deadline.
     * Use `open()` for "actively accepting applications".
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Open for applications: active AND not past deadline.
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query
            ->where('is_active', true)
            ->where(function (Builder $q) {
                $q->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now()->toDateString());
            });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('publish_at', '<=', now());
    }

    public function scopeByEmployer(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeByJobType(Builder $query, string $jobType): Builder
    {
        return $query->where('job_type', $jobType);
    }

    public function scopeByLocation(Builder $query, int $locationId): Builder
    {
        return $query->whereHas('locations', function (Builder $q) use ($locationId): void {
            $q->where('locations.id', $locationId);
        });
    }

    public function scopeSearch(Builder $query, string $keyword): Builder
    {
        return $query->where(function (Builder $q) use ($keyword): void {
            $q->where('title', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%")
                ->orWhere('requirements', 'like', "%{$keyword}%")
                ->orWhereJsonContains('skills', $keyword)
                ->orWhereJsonContains('keywords', $keyword);
        });
    }

    /* ==========================================
     | ACCESSORS & HELPERS
     |========================================== */

    public function getSalaryRangeAttribute(): string
    {
        if ($this->as_per_companies_policy) {
            return 'As per company policy';
        }

        if ($this->is_salary_negotiable) {
            return 'Negotiable';
        }

        if ($this->salary_min && $this->salary_max) {
            return number_format($this->salary_min) . ' - ' . number_format($this->salary_max) . ' BDT';
        }

        if ($this->salary_min) {
            return 'From ' . number_format($this->salary_min) . ' BDT';
        }

        return 'Not specified';
    }

    public function incrementViews(): void
    {
        $this->increment('views_count');
    }

    /**
     * Null deadline = never expires.
     */
    public function isExpired(): bool
    {
        return $this->application_deadline !== null
            && $this->application_deadline->isPast();
    }

    public function canApply(): bool
    {
        return $this->is_active && ! $this->isExpired();
    }

    /**
     * Prefer withCount('applications') if set; fall back to a query.
     */
    public function getApplicationCountAttribute(): int
    {
        return (int) ($this->attributes['applications_count']
            ?? $this->applications()->count());
    }

    public function getJobTypeLabelAttribute(): string
    {
        $labels = [
            'full-time'  => 'Full Time',
            'part-time'  => 'Part Time',
            'contract'   => 'Contract',
            'internship' => 'Internship',
            'remote'     => 'Remote',
            'hybrid'     => 'Hybrid',
        ];

        return $labels[$this->job_type] ?? ucfirst((string) $this->job_type);
    }

    public function getExperienceLevelLabelAttribute(): string
    {
        $labels = [
            'entry'     => 'Entry Level',
            'junior'    => 'Junior',
            'mid-level' => 'Mid Level',
            'senior'    => 'Senior',
            'lead'      => 'Lead',
            'executive' => 'Executive',
        ];

        return $labels[$this->experience_level]
            ?? ucfirst(str_replace('-', ' ', (string) $this->experience_level));
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where($field ?? $this->getRouteKeyName(), $value)
            ->withTrashed()
            ->firstOrFail();
    }
}
