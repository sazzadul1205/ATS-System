<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('applications', function (Blueprint $table) {
      $table->unsignedTinyInteger('ats_score_percentage')
        ->nullable()
        ->after('ats_score')
        ->index();
    });

    // Backfill existing rows (MySQL/MariaDB)
    if (DB::getDriverName() === 'mysql') {
      DB::statement("
                UPDATE applications
                SET ats_score_percentage = CAST(
                    JSON_UNQUOTE(JSON_EXTRACT(ats_score, '$.percentage')) AS UNSIGNED
                )
                WHERE ats_score IS NOT NULL
                  AND JSON_EXTRACT(ats_score, '$.percentage') IS NOT NULL
            ");
    }
  }

  public function down(): void
  {
    Schema::table('applications', function (Blueprint $table) {
      $table->dropIndex(['ats_score_percentage']);
      $table->dropColumn('ats_score_percentage');
    });
  }
};
