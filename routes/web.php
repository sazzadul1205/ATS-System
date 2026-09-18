<?php

use App\Http\Controllers\ATSController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public ATS Website
|--------------------------------------------------------------------------
*/

Route::get('/', [ATSController::class, 'dashboard'])->name('home');
Route::get('/ats', [ATSController::class, 'dashboard'])->name('ats.dashboard');

// Applications
Route::get('/ats/applications', [ATSController::class, 'applications'])->name('ats.applications.index');
Route::get('/ats/applications/{id}', [ATSController::class, 'showApplication'])->name('ats.applications.show');
Route::post('/ats/applications/{id}/status', [ATSController::class, 'updateStatus'])->name('ats.applications.update-status');
Route::post('/ats/applications/bulk-status', [ATSController::class, 'bulkUpdateStatus'])->name('ats.applications.bulk-status');
Route::post('/ats/applications/{id}/recalculate-ats', [ATSController::class, 'recalculateAtsScore'])->name('ats.applications.recalculate-ats');
Route::get('/ats/applications/export', [ATSController::class, 'exportApplications'])->name('ats.applications.export');

// Jobs
Route::get('/ats/jobs', [ATSController::class, 'jobs'])->name('ats.jobs.index');
Route::get('/ats/jobs/create', [ATSController::class, 'createJob'])->name('ats.jobs.create');
Route::post('/ats/jobs', [ATSController::class, 'storeJob'])->name('ats.jobs.store');
Route::put('/ats/jobs/{jobId}', [ATSController::class, 'updateJob'])->name('ats.jobs.update');
Route::delete('/ats/jobs/{jobId}', [ATSController::class, 'deleteJob'])->name('ats.jobs.delete');
Route::get('/ats/jobs/{jobId}/applications', [ATSController::class, 'jobApplications'])->name('ats.jobs.applications');

// Public apply flow — throttled to 5 submissions per minute per IP
Route::get('/ats/jobs/{jobId}/apply', [ATSController::class, 'applyForm'])->name('ats.jobs.apply');
Route::post('/ats/jobs/{jobId}/apply', [ATSController::class, 'storeApplication'])
  ->middleware('throttle:5,1')
  ->name('ats.jobs.apply.store');
