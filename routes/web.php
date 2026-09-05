<?php

use App\Http\Controllers\ATSController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | ATS Demo Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/ats', [ATSController::class, 'dashboard'])->name('ats.dashboard');

    // Applications
    Route::get('/ats/applications', [ATSController::class, 'applications'])->name('ats.applications.index');
    Route::get('/ats/applications/{id}', [ATSController::class, 'showApplication'])->name('ats.applications.show');
    Route::post('/ats/applications/{id}/status', [ATSController::class, 'updateStatus'])->name('ats.applications.update-status');
    Route::post('/ats/applications/bulk-status', [ATSController::class, 'bulkUpdateStatus'])->name('ats.applications.bulk-status');
    Route::post('/ats/applications/{id}/recalculate-ats', [ATSController::class, 'recalculateAtsScore'])->name('ats.applications.recalculate-ats');

    // Jobs
    Route::get('/ats/jobs', [ATSController::class, 'jobs'])->name('ats.jobs.index');
    Route::get('/ats/jobs/{jobId}/applications', [ATSController::class, 'jobApplications'])->name('ats.jobs.applications');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
