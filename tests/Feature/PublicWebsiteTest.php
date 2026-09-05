<?php

use Database\Seeders\ATSDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

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
