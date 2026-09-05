<?php

use App\Http\Controllers\ATSController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public ATS Website
|--------------------------------------------------------------------------
|
| The ATS system is the public-facing website, so every page is accessible
| without authentication.
|
*/

Route::get('/', [ATSController::class, 'dashboard'])->name('home');
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
