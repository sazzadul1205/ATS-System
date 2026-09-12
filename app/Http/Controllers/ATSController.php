<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\JobListing;
use App\Models\StatusTimeline;
use App\Notifications\ApplicationStatusUpdated;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use ZipArchive;

class ATSController extends Controller
{
    /**
     * Display ATS dashboard with applications overview.
     */
    public function dashboard(Request $request): Response
    {
        $statusCounts = Cache::remember(
            'ats:status-counts',
            30,
            fn() => Application::statusCounts()
        );

        $atsStats = Cache::remember('ats:score-stats', 60, function () {
            $row = Application::query()
                ->whereNotNull('ats_score_percentage')
                ->selectRaw('AVG(ats_score_percentage) as avg_ats')
                ->selectRaw('MIN(ats_score_percentage) as min_ats')
                ->selectRaw('MAX(ats_score_percentage) as max_ats')
                ->first();

            return [
                'avg' => round((float) ($row->avg_ats ?? 0), 2),
                'min' => (int) ($row->min_ats ?? 0),
                'max' => (int) ($row->max_ats ?? 0),
            ];
        });

        $recentApplications = Application::query()
            ->select([
                'id',
                'name',
                'email',
                'job_listing_id',
                'status',
                'ats_score_percentage',
                'created_at',
            ])
            ->with(['jobListing:id,title'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($app) => [
                'id'         => $app->id,
                'name'       => $app->name,
                'email'      => $app->email,
                'job_title'  => $app->jobListing?->title ?? 'N/A',
                'status'     => $app->status,
                'ats_score'  => $app->ats_score_percentage ?? 0,
                'created_at' => $app->created_at->diffForHumans(),
            ]);

        $topJobs = JobListing::query()
            ->select(['id', 'title', 'is_active'])
            ->withCount('applications')
            ->where('is_active', true)
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get();

        return Inertia::render('ATS/Dashboard', [
            'statusCounts'       => $statusCounts,
            'atsStats'           => $atsStats,
            'recentApplications' => $recentApplications,
            'topJobs'            => $topJobs,
        ]);
    }

    /**
     * Display all applications with filtering.
     */
    public function applications(Request $request): Response
    {
        $query = Application::query()
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'job_listing_id',
                'status',
                'ats_score_percentage',
                'years_of_experience',
                'education_level',
                'expected_salary',
                'created_at',
            ])
            ->with([
                'jobListing:id,title,category_id',
                'jobListing.category:id,name',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('job_id')) {
            $query->where('job_listing_id', $request->job_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('min_ats_score')) {
            $query->where('ats_score_percentage', '>=', (int) $request->min_ats_score);
        }

        $perPage = (int) $request->input('per_page', 15);
        $applications = $query->latest()->paginate($perPage)->withQueryString();

        $applications->getCollection()->transform(fn($app) => [
            'id'               => $app->id,
            'name'             => $app->name,
            'email'            => $app->email,
            'phone'            => $app->phone,
            'job' => [
                'id'       => $app->jobListing?->id,
                'title'    => $app->jobListing?->title,
                'category' => $app->jobListing?->category?->name,
            ],
            'status'           => $app->status,
            'ats_score'        => $app->ats_score_percentage ?? 0,
            'experience_years' => $app->years_of_experience,
            'education_level'  => $app->education_level,
            'expected_salary'  => $app->expected_salary,
            'created_at'       => $app->created_at->format('Y-m-d H:i'),
            'can_update'       => ! in_array($app->status, [
                Application::STATUS_HIRED,
                Application::STATUS_REJECTED,
            ], true),
        ]);

        return Inertia::render('ATS/Applications/Index', [
            'applications' => $applications,
            'filters'      => $request->only(['status', 'job_id', 'search', 'min_ats_score', 'per_page']),
            'jobs'         => JobListing::where('is_active', true)->get(['id', 'title']),
            'statuses'     => Application::$statuses,
            'statusCounts' => Application::statusCounts(),
        ]);
    }

    /**
     * Show single application details.
     */
    public function showApplication(int $id): Response
    {
        $application = Application::with([
            'jobListing:id,title,description,requirements,category_id',
            'jobListing.category:id,name',
            'statusTimelines' => fn($q) => $q->orderByDesc('created_at'),
        ])->findOrFail($id);

        $atsAnalysis = $application->ats_score['analysis'] ?? null;

        return Inertia::render('ATS/Applications/Show', [
            'application' => $application,
            'atsAnalysis' => $atsAnalysis,
        ]);
    }

    /**
     * Update application status.
     */
    public function updateStatus(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(Application::$statuses)],
            'notes'  => ['nullable', 'string', 'max:1000'],
        ]);

        $application = Application::findOrFail($id);
        $oldStatus   = $application->status;

        $application->updateStatus($validated['status'], $validated['notes'] ?? null);

        return back()->with('success', "Application status updated from {$oldStatus} to {$validated['status']}.");
    }

    /**
     * Bulk update application statuses.
     * 1 UPDATE + 1 bulk insert of timelines + notifications after commit.
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'application_ids'   => ['required', 'array', 'min:1'],
            'application_ids.*' => ['exists:applications,id'],
            'status'            => ['required', Rule::in(Application::$statuses)],
            'notes'             => ['nullable', 'string', 'max:1000'],
        ]);

        $ids    = $validated['application_ids'];
        $status = $validated['status'];
        $notes  = $validated['notes'] ?? null;
        $now    = now();

        DB::transaction(function () use ($ids, $status, $notes, $now) {
            Application::whereIn('id', $ids)->update([
                'status'         => $status,
                'employer_notes' => $notes,
                'updated_at'     => $now,
            ]);

            StatusTimeline::insert(
                collect($ids)->map(fn($id) => [
                    'application_id' => $id,
                    'status'         => $status,
                    'notes'          => $notes,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ])->all()
            );
        });

        // Notify after the transaction commits.
        $applications = Application::with('user')->whereIn('id', $ids)->get();

        foreach ($applications as $app) {
            $app->user?->notify(new ApplicationStatusUpdated($app, null, $notes));
        }

        return back()->with('success', count($ids) . ' applications updated successfully.');
    }

    /**
     * Recalculate ATS score for an application.
     */
    public function recalculateAtsScore(int $id)
    {
        $application = Application::findOrFail($id);

        try {
            $success = $application->recalculateAtsScoreInline();

            if ($success) {
                return back()->with('success', 'ATS score recalculated successfully.');
            }

            return back()->with('error', 'Failed to recalculate ATS score.');
        } catch (\Throwable $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    /**
     * Display job listings.
     */
    public function jobs(): Response
    {
        $jobs = JobListing::with(['category:id,name', 'locations:id,name'])
            ->withCount('applications')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ATS/Jobs/Index', [
            'jobs' => $jobs,
        ]);
    }

    /**
     * Show applications for a specific job.
     */
    public function jobApplications(int $jobId, Request $request): Response
    {
        $job = JobListing::with(['category:id,name'])->findOrFail($jobId);

        $baseQuery = Application::query()
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'job_listing_id',
                'status',
                'ats_score_percentage',
                'years_of_experience',
                'education_level',
                'created_at',
            ])
            ->where('job_listing_id', $jobId);

        // Filtered paginated query
        $listQuery = (clone $baseQuery)->latest();

        if ($request->filled('status')) {
            $listQuery->where('status', $request->status);
        }

        $applications = $listQuery->paginate(20)->withQueryString();

        // One grouped query for status counts on the full job set
        $statusCounts = Application::statusCounts(clone $baseQuery);
        unset($statusCounts['total']); // job view shows per-status only

        $applications->getCollection()->transform(fn($app) => [
            'id'               => $app->id,
            'name'             => $app->name,
            'email'            => $app->email,
            'phone'            => $app->phone,
            'status'           => $app->status,
            'ats_score'        => $app->ats_score_percentage ?? 0,
            'years_of_experience' => $app->years_of_experience,
            'education_level'  => $app->education_level,
            'created_at'       => $app->created_at->toIso8601String(),
            'can_update'       => ! in_array($app->status, [
                Application::STATUS_HIRED,
                Application::STATUS_REJECTED,
            ], true),
        ]);

        return Inertia::render('ATS/Jobs/Applications', [
            'job'          => [
                'id'       => $job->id,
                'title'    => $job->title,
                'category' => $job->category ? ['name' => $job->category->name] : null,
            ],
            'applications' => $applications,
            'statusCounts' => $statusCounts,
            'filters'      => $request->only(['status']),
        ]);
    }

    /**
     * Show the public application form for a job listing.
     */
    public function applyForm(int $jobId): Response
    {
        $job = JobListing::with(['category:id,name', 'locations:id,name'])->findOrFail($jobId);

        return Inertia::render('ATS/Apply', [
            'job' => [
                'id'           => $job->id,
                'title'        => $job->title,
                'description'  => $job->description,
                'requirements' => $job->requirements,
                'keywords'     => collect($job->keywords)->take(15)->values(),
                'category'     => $job->category?->name,
                'locations'    => $job->locations->pluck('name')->values(),
                'job_type'     => $job->getJobTypeLabelAttribute(),
                'is_active'    => $job->is_active,
            ],
        ]);
    }

    /**
     * Store a public application with a CV and run the ATS score inline.
     */
    public function storeApplication(Request $request, int $jobId): RedirectResponse
    {
        $job = JobListing::findOrFail($jobId);

        if (! $job->canApply()) {
            return back()->withErrors(['cv' => 'This job posting is no longer accepting applications.']);
        }

        $validated = $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'email'              => ['required', 'email', 'max:255'],
            'phone'              => ['nullable', 'string', 'max:50'],
            'years_of_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'education_level'    => ['nullable', 'in:high_school,associate,bachelor,master,phd'],
            'expected_salary'    => ['nullable', 'numeric', 'min:0'],
            'cv'                 => [
                'required',
                'file',
                'extensions:pdf,doc,docx',
                'max:5120',
                function (string $attribute, UploadedFile $file, Closure $fail): void {
                    $extension = strtolower($file->getClientOriginalExtension());
                    $contents  = file_get_contents($file->getRealPath());
                    $isValid   = match ($extension) {
                        'pdf'  => is_string($contents) && str_starts_with($contents, '%PDF-'),
                        'doc'  => is_string($contents) && str_starts_with($contents, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"),
                        'docx' => $this->isValidDocx($file),
                        default => false,
                    };

                    if (! $isValid) {
                        $fail('The CV must be a valid PDF, DOC, or DOCX file.');
                    }
                },
            ],
        ]);

        // Reject duplicate submissions from the same email within 5 minutes.
        $recent = Application::where('job_listing_id', $job->id)
            ->where('email', $validated['email'])
            ->where('created_at', '>', now()->subMinutes(5))
            ->exists();

        if ($recent) {
            return back()->withErrors([
                'email' => 'You already applied for this job recently. Please wait a few minutes.',
            ]);
        }

        $resumePath = $request->file('cv')->store("resumes/{$job->id}", 'public');

        $application = Application::create([
            'job_listing_id'         => $job->id,
            'name'                   => $validated['name'],
            'email'                  => $validated['email'],
            'phone'                  => $validated['phone'] ?? null,
            'resume_path'            => $resumePath,
            'years_of_experience'    => (int) ($validated['years_of_experience'] ?? 0),
            'education_level'        => $validated['education_level'] ?? 'bachelor',
            'expected_salary'        => $validated['expected_salary'] ?? null,
            'status'                 => Application::STATUS_PENDING,
            'ats_calculation_status' => Application::ATS_PENDING,
        ]);

        StatusTimeline::create([
            'application_id' => $application->id,
            'status'         => Application::STATUS_PENDING,
            'notes'          => 'Application received',
        ]);

        // Run ATS inline so the tester sees the result immediately.
        $application->recalculateAtsScoreInline();

        // Bust cached dashboard stats so fresh data shows up.
        Cache::forget('ats:status-counts');
        Cache::forget('ats:score-stats');

        return redirect()
            ->route('ats.applications.show', $application->id)
            ->with('success', 'Your application was submitted and scored by the ATS. View your result below.');
    }

    /**
     * Verify a DOCX upload is a real OOXML package.
     */
    private function isValidDocx(UploadedFile $file): bool
    {
        $archive = new ZipArchive;

        if ($archive->open($file->getRealPath()) !== true) {
            return false;
        }

        $hasDocument = $archive->locateName('word/document.xml') !== false;
        $archive->close();

        return $hasDocument;
    }
}
