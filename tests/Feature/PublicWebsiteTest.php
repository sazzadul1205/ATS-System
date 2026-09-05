<?php

use App\Models\Application;
use App\Models\JobListing;
use Database\Seeders\ATSDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    $this->seed(ATSDemoSeeder::class);
});

test('the ATS dashboard is publicly accessible at /', function () {
    $this->get('/')->assertOk();
});

test('the ATS dashboard is publicly accessible at /ats', function () {
    $this->get('/ats')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('ATS/Dashboard'));
});

test('the ATS applications page is publicly accessible', function () {
    $this->get('/ats/applications')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('ATS/Applications/Index')
                ->has('applications.data')
        );
});

test('the ATS jobs page is publicly accessible', function () {
    $this->get('/ats/jobs')
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('ATS/Jobs/Index')
                ->has('jobs.data')
        );
});

test('the apply form for a job is publicly accessible', function () {
    $job = JobListing::first();

    $this->get("/ats/jobs/{$job->id}/apply")
        ->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('ATS/Apply')
                ->has('job')
        );
});

test('a tester can upload their CV and get an ATS score', function () {
    Storage::fake('public');

    $job = JobListing::where('title', 'Senior Full Stack Developer')->firstOrFail();

    $response = $this->post("/ats/jobs/{$job->id}/apply", [
        'name' => 'Tester Applicant',
        'email' => 'tester@example.com',
        'phone' => '+1 555-0101',
        'years_of_experience' => 5,
        'education_level' => 'bachelor',
        'expected_salary' => 85000,
        'cv' => UploadedFile::fake()->createWithContent('cv.pdf', atsTestPdf('React Node.js TypeScript PostgreSQL AWS Docker')),
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $application = Application::latest('id')->first();

    expect($application)->not->toBeNull()
        ->and($application->name)->toBe('Tester Applicant')
        ->and($application->email)->toBe('tester@example.com')
        ->and($application->job_listing_id)->toBe($job->id)
        ->and($application->resume_path)->not->toBeNull()
        ->and($application->ats_attempt_count)->toBe(1)
        ->and($application->ats_score)->not->toBeNull();
});

test('a CV file is required to submit an application', function () {
    $job = JobListing::first();

    $this->post("/ats/jobs/{$job->id}/apply", [
        'name' => 'No CV',
        'email' => 'nocv@example.com',
    ])->assertSessionHasErrors('cv');
});

test('CV uploads must contain a valid document signature', function () {
    $job = JobListing::first();

    $this->post("/ats/jobs/{$job->id}/apply", [
        'name' => 'Invalid CV',
        'email' => 'invalid-cv@example.com',
        'cv' => UploadedFile::fake()->createWithContent('resume.pdf', 'This is not a PDF file.'),
    ])->assertSessionHasErrors('cv');
});

test('applications are rejected for closed jobs', function () {
    Storage::fake('public');

    $job = JobListing::first();
    $job->update(['is_active' => false]);

    $this->post("/ats/jobs/{$job->id}/apply", [
        'name' => 'Late Applicant',
        'email' => 'late@example.com',
        'cv' => UploadedFile::fake()->create('cv.pdf', 100),
    ])->assertSessionHasErrors('cv');
});

/**
 * Build a minimal but valid PDF so the ATS parser can extract text.
 */
function atsTestPdf(string $text): string
{
    $objects = [
        1 => '<< /Type /Catalog /Pages 2 0 R >>',
        2 => '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        3 => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
        4 => null,
        5 => '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    $stream = "BT /F1 12 Tf 72 720 Td ({$text}) Tj ET";
    $objects[4] = '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream";

    $pdf = "%PDF-1.4\n";
    $offsets = [];

    foreach ($objects as $id => $body) {
        $offsets[$id] = strlen($pdf);
        $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
    }

    $xrefStart = strlen($pdf);
    $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n";
    $pdf .= "0000000000 65535 f \n";

    foreach ($objects as $id => $body) {
        $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
    }

    $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
    $pdf .= "startxref\n{$xrefStart}\n%%EOF";

    return $pdf;
}
