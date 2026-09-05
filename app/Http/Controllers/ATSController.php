<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\JobListing;
use App\Models\StatusTimeline;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;
use ZipArchive;

class ATSController extends Controller
{
    /**
     * Display ATS dashboard with applications overview
     */
    public function dashboard(Request $request): Response
    {
        // Status counts
        $statusCounts = [
            'pending' => Application::where('status', 'pending')->count(),
            'shortlisted' => Application::where('status', 'shortlisted')->count(),
            'rejected' => Application::where('status', 'rejected')->count(),
            'hired' => Application::where('status', 'hired')->count(),
            'total' => Application::count(),
        ];

        // ATS Stats
        $atsStats = Application::selectRaw("
            AVG(CAST(JSON_EXTRACT(ats_score, '$.percentage') AS UNSIGNED)) as avg_ats,
            MIN(CAST(JSON_EXTRACT(ats_score, '$.percentage') AS UNSIGNED)) as min_ats,
            MAX(CAST(JSON_EXTRACT(ats_score, '$.percentage') AS UNSIGNED)) as max_ats
        ")->first();

        // Recent applications
        $recentApplications = Application::with(['jobListing', 'applicantProfile'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'email' => $app->email,
                    'job_title' => $app->jobListing?->title ?? 'N/A',
                    'status' => $app->status,
                    'ats_score' => $app->ats_score_percentage ?? 0,
                    'created_at' => $app->created_at->diffForHumans(),
                ];
            });

        // Job listings with application counts
        $jobsWithApps = JobListing::withCount('applications')
            ->where('is_active', true)
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get(['id', 'title', 'is_active']);

        return Inertia::render('ATS/Dashboard', [
            'statusCounts' => $statusCounts,
            'atsStats' => [
                'avg' => round($atsStats->avg_ats ?? 0, 2),
                'min' => $atsStats->min_ats ?? 0,
                'max' => $atsStats->max_ats ?? 0,
            ],
            'recentApplications' => $recentApplications,
            'topJobs' => $jobsWithApps,
        ]);
    }

    /**
     * Display all applications with filtering
     */
    public function applications(Request $request): Response
    {
        $query = Application::with([
            'jobListing' => fn ($q) => $q->with(['category', 'locations']),
            'applicantProfile.user',
            'statusTimelines',
        ]);

        // Apply filters
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
            $query->whereRaw("CAST(JSON_EXTRACT(ats_score, '$.percentage') AS UNSIGNED) >= ?", [$request->min_ats_score]);
        }

        $perPage = $request->input('per_page', 15);
        $applications = $query->paginate($perPage)->withQueryString();

        // Transform for frontend
        $applications->getCollection()->transform(function ($app) {
            return [
                'id' => $app->id,
                'name' => $app->name,
                'email' => $app->email,
                'phone' => $app->phone,
                'job' => [
                    'id' => $app->jobListing?->id,
                    'title' => $app->jobListing?->title,
                    'category' => $app->jobListing?->category?->name,
                ],
                'status' => $app->status,
                'ats_score' => $app->ats_score_percentage ?? 0,
                'matched_keywords' => $app->matched_keywords ?? [],
                'missing_keywords' => $app->missing_keywords ?? [],
                'experience_years' => $app->years_of_experience,
                'education_level' => $app->education_level,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at->format('Y-m-d H:i'),
                'can_update' => ! in_array($app->status, ['hired', 'rejected']),
            ];
        });

        // Filter options
        $jobs = JobListing::where('is_active', true)->get(['id', 'title']);
        $statuses = Application::$statuses;

        return Inertia::render('ATS/Applications/Index', [
            'applications' => $applications,
            'filters' => $request->only(['status', 'job_id', 'search', 'min_ats_score', 'per_page']),
            'jobs' => $jobs,
            'statuses' => $statuses,
            'statusCounts' => [
                'pending' => Application::where('status', 'pending')->count(),
                'shortlisted' => Application::where('status', 'shortlisted')->count(),
                'rejected' => Application::where('status', 'rejected')->count(),
                'hired' => Application::where('status', 'hired')->count(),
            ],
        ]);
    }

    /**
     * Show single application details
     */
    public function showApplication(int $id): Response
    {
        $application = Application::with([
            'jobListing' => fn ($q) => $q->with(['employer', 'category', 'locations']),
            'applicantProfile' => fn ($q) => $q->with([
                'user',
                'jobHistories',
                'educationHistories',
                'achievements',
                'cvs',
            ]),
            'statusTimelines' => fn ($q) => $q->orderBy('created_at', 'desc'),
        ])->findOrFail($id);

        $atsAnalysis = $application->ats_score['analysis'] ?? null;

        return Inertia::render('ATS/Applications/Show', [
            'application' => $application,
            'atsAnalysis' => $atsAnalysis,
        ]);
    }

    /**
     * Update application status
     */
    public function updateStatus(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string|max:1000',
        ]);

        $application = Application::findOrFail($id);
        $oldStatus = $application->status;

        $application->updateStatus($validated['status'], $validated['notes']);

        return back()->with('success', "Application status updated from {$oldStatus} to {$validated['status']}.");
    }

    /**
     * Bulk update application statuses
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'exists:applications,id',
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updated = Application::whereIn('id', $validated['application_ids'])
            ->each(function ($app) use ($validated) {
                $app->updateStatus($validated['status'], $validated['notes']);
            });

        return back()->with('success', count($validated['application_ids']).' applications updated successfully.');
    }

    /**
     * Recalculate ATS score for an application
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
        } catch (\Exception $e) {
            return back()->with('error', 'Error: '.$e->getMessage());
        }
    }

    /**
     * Display job listings
     */
    public function jobs(): Response
    {
        $jobs = JobListing::with(['category', 'locations'])
            ->withCount('applications')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ATS/Jobs/Index', [
            'jobs' => $jobs,
        ]);
    }

    /**
     * Show applications for a specific job
     */
    public function jobApplications(int $jobId, Request $request): Response
    {
        $job = JobListing::findOrFail($jobId);

        $query = Application::with([
            'applicantProfile.user',
            'statusTimelines',
        ])->where('job_listing_id', $jobId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('created_at', 'desc')->paginate(20);

        $statusCounts = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'shortlisted' => (clone $query)->where('status', 'shortlisted')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'hired' => (clone $query)->where('status', 'hired')->count(),
        ];

        return Inertia::render('ATS/Jobs/Applications', [
            'job' => $job,
            'applications' => $applications,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['status']),
        ]);
    }

    /**
     * Show the public application form for a job listing.
     */
    public function applyForm(int $jobId): Response
    {
        $job = JobListing::with(['category', 'locations'])->findOrFail($jobId);

        return Inertia::render('ATS/Apply', [
            'job' => [
                'id' => $job->id,
                'title' => $job->title,
                'description' => $job->description,
                'requirements' => $job->requirements,
                'keywords' => collect($job->keywords)->take(15)->values(),
                'category' => $job->category?->name,
                'locations' => $job->locations->pluck('name')->values(),
                'job_type' => $job->getJobTypeLabelAttribute(),
                'is_active' => $job->is_active,
            ],
        ]);
    }

    /**
     * Store a public application with a CV and run the ATS score inline.
     */
    public function storeApplication(Request $request, int $jobId): RedirectResponse
    {
        $job = JobListing::findOrFail($jobId);

        if (! $job->is_active) {
            return back()->withErrors(['cv' => 'This job posting is no longer accepting applications.']);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'years_of_experience' => ['nullable', 'integer', 'min:0', 'max:60'],
            'education_level' => ['nullable', 'in:high_school,associate,bachelor,master,phd'],
            'expected_salary' => ['nullable', 'numeric', 'min:0'],
            'cv' => [
                'required',
                'file',
                'extensions:pdf,doc,docx',
                'max:5120',
                function (string $attribute, UploadedFile $file, Closure $fail): void {
                    $extension = strtolower($file->getClientOriginalExtension());
                    $contents = file_get_contents($file->getRealPath());
                    $isValid = match ($extension) {
                        'pdf' => is_string($contents) && str_starts_with($contents, '%PDF-'),
                        'doc' => is_string($contents) && str_starts_with($contents, "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"),
                        'docx' => $this->isValidDocx($file),
                        default => false,
                    };

                    if (! $isValid) {
                        $fail('The CV must be a valid PDF, DOC, or DOCX file.');
                    }
                },
            ],
        ]);

        $resumePath = $request->file('cv')->store('resumes', 'public');

        $application = Application::create([
            'job_listing_id' => $job->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'resume_path' => $resumePath,
            'years_of_experience' => (int) ($validated['years_of_experience'] ?? 0),
            'education_level' => $validated['education_level'] ?? 'bachelor',
            'expected_salary' => $validated['expected_salary'] ?? null,
            'status' => Application::STATUS_PENDING,
            'ats_calculation_status' => Application::ATS_PENDING,
        ]);

        StatusTimeline::create([
            'application_id' => $application->id,
            'status' => Application::STATUS_PENDING,
            'notes' => 'Application received',
        ]);

        // Run the ATS score inline so the tester sees the result immediately.
        $application->recalculateAtsScoreInline();

        return redirect()
            ->route('ats.applications.show', $application->id)
            ->with('success', 'Your application was submitted and scored by the ATS. View your result below.');
    }

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
