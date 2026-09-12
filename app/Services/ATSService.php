<?php

namespace App\Services;

use App\Models\Application;
use App\Models\JobListing;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;
use ZipArchive;

class ATSService
{
    /**
     * @return array<string, mixed>
     */
    public function calculateScore(Application $application, JobListing $jobListing): array
    {
        try {
            $resumePath = $application->getActualResumePath();

            if (! $resumePath) {
                Log::warning('No resume found for application', ['application_id' => $application->id]);
                return $this->defaultScore('No resume found for this application');
            }

            $resumeText = $this->extractResumeText($resumePath);

            if ($resumeText === '') {
                return $this->defaultScore('Unable to extract text from resume');
            }

            $jobKeywords = $this->extractJobKeywords($jobListing);

            if (empty($jobKeywords)) {
                Log::warning('No keywords found for job listing', ['job_listing_id' => $jobListing->id]);
                return $this->defaultScore('No keywords defined for this job');
            }

            $matches = $this->calculateKeywordMatches($resumeText, $jobKeywords);
            $score   = $this->calculateATSScore($matches, $jobKeywords);

            return [
                'percentage'                 => round($score, 2),
                'matched_keywords'           => $matches['matched'],
                'missing_keywords'           => $matches['missing'],
                'matched_count'              => count($matches['matched']),
                'total_keywords'             => count($jobKeywords),
                'extracted_skills'           => [],
                'extracted_experience_years' => 0,
                'extracted_education'        => 'Not specified',
                'analysis'                   => $this->generateAnalysis($matches, $score),
                'calculated_at'              => now()->toDateTimeString(),
            ];
        } catch (\Throwable $e) {
            Log::error('ATS Score Calculation Error: ' . $e->getMessage(), [
                'application_id' => $application->id,
                'job_listing_id' => $jobListing->id,
            ]);

            return $this->defaultScore('Error calculating score: ' . $e->getMessage());
        }
    }

    private function extractResumeText(string $resumePath): string
    {
        if (Storage::disk('public')->exists($resumePath)) {
            $fullPath = Storage::disk('public')->path($resumePath);
        } elseif (file_exists($resumePath)) {
            $fullPath = $resumePath;
        } else {
            throw new \Exception('Resume file not found at: ' . $resumePath);
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));

        return match ($extension) {
            'pdf'   => $this->extractFromPDF($fullPath),
            'docx'  => $this->extractFromDocx($fullPath),
            'doc'   => $this->extractFromDoc($fullPath),
            default => throw new \Exception('Unsupported file format: ' . $extension),
        };
    }

    /**
     * PDF extraction: parser → pdftotext → literal extraction (bytes read last).
     */
    private function extractFromPDF(string $pdfPath): string
    {
        // 1. smalot/pdfparser
        try {
            $parser = new Parser;
            $pdf = $parser->parseFile($pdfPath);
            $text = trim($pdf->getText());
            if ($text !== '') {
                return $text;
            }
        } catch (\Throwable $e) {
            Log::debug('PDF parser failed, trying fallbacks', ['error' => $e->getMessage()]);
        }

        // 2. pdftotext (poppler-utils)
        if (function_exists('shell_exec')) {
            $output = @shell_exec('pdftotext ' . escapeshellarg($pdfPath) . ' - 2>/dev/null');
            if (is_string($output) && trim($output) !== '') {
                return trim($output);
            }
        }

        // 3. Read bytes only now for literal stream extraction
        $contents = @file_get_contents($pdfPath);
        if ($contents === false) {
            throw new \Exception('Cannot read PDF file');
        }

        $literal = $this->extractLiteralPdfText($contents);
        if ($literal !== '') {
            return $literal;
        }

        throw new \Exception('PDF does not contain extractable text');
    }

    /**
     * Extract simple literal strings used by uncompressed PDF text operators.
     */
    private function extractLiteralPdfText(string $contents): string
    {
        preg_match_all('/\(((?:\\\\.|[^\\\\)])*)\)\s*T[Jj]/s', $contents, $matches);

        $text = array_map(function (string $value): string {
            return preg_replace_callback('/\\\\([\\\\()nrtbf])/', function (array $m): string {
                return match ($m[1]) {
                    'n' => "\n",
                    'r' => "\r",
                    't' => "\t",
                    'b' => "\x08",
                    'f' => "\x0C",
                    default => $m[1],
                };
            }, $value) ?? $value;
        }, $matches[1] ?? []);

        return trim(implode(' ', $text));
    }

    private function extractFromDocx(string $docxPath): string
    {
        $zip = new ZipArchive;
        if ($zip->open($docxPath) !== true) {
            throw new \Exception('Cannot open DOCX file');
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($xml === false) {
            throw new \Exception('Cannot find document.xml in DOCX');
        }

        $text = strip_tags($xml);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text) ?? '';

        return trim($text);
    }

    private function extractFromDoc(string $docPath): string
    {
        if (function_exists('shell_exec')) {
            $output = @shell_exec('antiword ' . escapeshellarg($docPath) . ' 2>/dev/null');
            if (is_string($output) && trim($output) !== '') {
                return $output;
            }
        }

        $content = @file_get_contents($docPath);
        if ($content === false) {
            throw new \Exception('Cannot read DOC file');
        }

        $content = preg_replace('/[^\x20-\x7E\x0A\x0D]/', ' ', $content) ?? '';

        return trim(preg_replace('/\s+/', ' ', $content) ?? '');
    }

    /**
     * @return array<int, string>
     */
    private function extractJobKeywords(JobListing $jobListing): array
    {
        $rawKeywords = $jobListing->keywords;

        if (is_string($rawKeywords) && trim($rawKeywords) !== '') {
            $decoded = json_decode($rawKeywords, true);
            $rawKeywords = is_array($decoded) ? $decoded : [];
        }

        $keywords = is_array($rawKeywords) ? $rawKeywords : [];
        $keywords = array_map(fn($kw) => (string) $kw, $keywords);
        $keywords = $this->normalizeKeywords($keywords);
        $keywords = array_values(array_unique(array_filter($keywords, fn($kw) => $kw !== '')));
        $keywords = array_slice($keywords, 0, 100);

        Log::debug('Extracted job keywords', [
            'job_id'        => $jobListing->id,
            'keyword_count' => count($keywords),
        ]);

        return $keywords;
    }

    /**
     * @param  array<int, string>  $keywords
     * @return array<int, string>
     */
    private function normalizeKeywords(array $keywords): array
    {
        $normalized = [];

        foreach ($keywords as $keyword) {
            $keyword = trim((string) $keyword);
            if ($keyword === '') {
                continue;
            }
            $normalized[] = preg_replace('/\s+/', ' ', strtolower($keyword));
        }

        return $normalized;
    }

    /**
     * @param  array<int, string>  $jobKeywords
     * @return array{matched: array<int, string>, missing: array<int, string>}
     */
    private function calculateKeywordMatches(string $resumeText, array $jobKeywords): array
    {
        $resumeText = strtolower($resumeText);
        $matched = [];
        $missing = [];

        foreach ($jobKeywords as $keyword) {
            $keyword = strtolower(trim($keyword));
            if ($keyword === '') {
                continue;
            }

            if (str_contains($keyword, ' ')) {
                if (str_contains($resumeText, $keyword)) {
                    $matched[] = $keyword;
                    continue;
                }
            } else {
                $pattern = '/\b' . preg_quote($keyword, '/') . '\b/u';
                if (preg_match($pattern, $resumeText)) {
                    $matched[] = $keyword;
                    continue;
                }
            }

            $missing[] = $keyword;
        }

        return [
            'matched' => array_values(array_unique($matched)),
            'missing' => array_values(array_unique($missing)),
        ];
    }

    private function calculateATSScore(array $matches, array $jobKeywords): float
    {
        if (empty($jobKeywords)) {
            return 0;
        }

        return (count($matches['matched']) / count($jobKeywords)) * 100;
    }

    /**
     * @return array<string, mixed>
     */
    private function generateAnalysis(array $matches, float $score): array
    {
        if ($score >= 80) {
            $level = 'Excellent';
            $color = 'green';
            $message = 'Your resume strongly matches the job requirements!';
        } elseif ($score >= 60) {
            $level = 'Good';
            $color = 'blue';
            $message = 'Your resume matches many key requirements. Consider highlighting missing keywords.';
        } elseif ($score >= 40) {
            $level = 'Fair';
            $color = 'yellow';
            $message = 'Your resume has some relevant keywords. Consider adding more specific skills.';
        } else {
            $level = 'Needs Improvement';
            $color = 'red';
            $message = 'Your resume could be optimized for this position. Add more relevant keywords from the job description.';
        }

        return [
            'level'         => $level,
            'message'       => $message,
            'color'         => $color,
            'matched_count' => count($matches['matched']),
            'missing_count' => count($matches['missing']),
            'top_matched'   => array_slice($matches['matched'], 0, 10),
            'top_missing'   => array_slice($matches['missing'], 0, 10),
            'suggestions'   => $this->generateSuggestions($matches['missing']),
        ];
    }

    /**
     * @param  array<int, string>  $missingKeywords
     * @return array<int, string>
     */
    private function generateSuggestions(array $missingKeywords): array
    {
        if (empty($missingKeywords)) {
            return ['Your resume includes all detected keywords – great job!'];
        }

        $topMissing = array_slice($missingKeywords, 0, 5);

        return [
            'Highlight these keywords in your resume: ' . implode(', ', $topMissing),
            'Consider adding a dedicated skills section to improve keyword density.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultScore(string $error): array
    {
        return [
            'percentage'                 => 0,
            'matched_keywords'           => [],
            'missing_keywords'           => [],
            'matched_count'              => 0,
            'total_keywords'             => 0,
            'extracted_skills'           => [],
            'extracted_experience_years' => 0,
            'extracted_education'        => 'Not specified',
            'analysis' => [
                'level'         => 'Error',
                'message'       => $error,
                'color'         => 'red',
                'matched_count' => 0,
                'missing_count' => 0,
                'top_matched'   => [],
                'top_missing'   => [],
                'suggestions'   => [
                    'Please ensure your resume is uploaded and in a supported format (PDF, DOC, DOCX).',
                ],
            ],
            'calculated_at' => now()->toDateTimeString(),
            'error'         => $error,
        ];
    }
}
