import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ATS',
        href: '/ats',
    },
    {
        title: 'Applications',
        href: '/ats/applications',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface JobListing {
    id: number;
    title: string;
    description: string;
    requirements: string;
    is_active: boolean;
    employer?: { id: number; name: string };
    category?: { id: number; name: string };
    locations?: { id: number; name: string; country: string }[];
}

interface ApplicantProfile {
    id: number;
    user?: { id: number; name: string; email: string };
    job_histories?: JobHistory[];
    education_histories?: EducationHistory[];
    achievements?: Achievement[];
    cvs?: CV[];
}

interface JobHistory {
    id: number;
    company: string;
    position: string;
    start_date: string;
    end_date: string | null;
    description: string;
}

interface EducationHistory {
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    graduation_date: string;
}

interface Achievement {
    id: number;
    title: string;
    description: string;
    date: string;
}

interface CV {
    id: number;
    file_path: string;
    uploaded_at: string;
}

interface StatusTimeline {
    id: number;
    status: string;
    notes: string | null;
    changed_by: number | null;
    created_at: string;
}

interface ATSAnalysis {
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
}

interface ApplicationShowProps {
    application: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
        status: string;
        ats_score: { percentage: number; analysis?: ATSAnalysis } | null;
        matched_keywords: string[];
        missing_keywords: string[];
        years_of_experience: number | null;
        education_level: string | null;
        expected_salary: string | null;
        facebook_link: string | null;
        linkedin_link: string | null;
        employer_notes: string | null;
        created_at: string;
        job_listing: JobListing;
        applicant_profile: ApplicantProfile;
        status_timelines: StatusTimeline[];
    };
    atsAnalysis: ATSAnalysis | null;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function ApplicationShow() {
    const { props } = usePage<ApplicationShowProps>();
    const { application, atsAnalysis } = props;

    const handleStatusUpdate = (status: string) => {
        router.post(`/ats/applications/${application.id}/status`, { status });
    };

    const handleRecalculateATS = () => {
        router.post(`/ats/applications/${application.id}/recalculate-ats`);
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400';
            case 'shortlisted':
                return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400';
            case 'rejected':
                return 'border-transparent bg-destructive/15 text-destructive';
            case 'hired':
                return 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400';
            default:
                return 'border-transparent bg-muted text-muted-foreground';
        }
    };

    const atsPercentage = application.ats_score?.percentage ?? 0;
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-destructive';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${application.name} - Application`} />
            <div className="space-y-6">
                {props.flash?.success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                        {props.flash.success}
                    </div>
                )}
                {props.flash?.error && (
                    <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
                        {props.flash.error}
                    </div>
                )}
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-foreground text-3xl font-bold">{application.name}</h2>
                        <p className="text-muted-foreground mt-1">Applying for: {application.job_listing.title}</p>
                    </div>
                    <div className="flex gap-2">
                        {application.status !== 'hired' && application.status !== 'rejected' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('shortlisted')}
                                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                                >
                                    Shortlist
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md px-4 py-2 text-sm font-medium"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleRecalculateATS}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium"
                        >
                            Recalculate ATS
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Application Info */}
                        <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                            <h3 className="text-foreground mb-4 text-lg font-semibold">Application Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Email</label>
                                    <p className="text-foreground">{application.email}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Phone</label>
                                    <p className="text-foreground">{application.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Experience</label>
                                    <p className="text-foreground">
                                        {application.years_of_experience ? `${application.years_of_experience} years` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Education</label>
                                    <p className="text-foreground">{application.education_level || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Expected Salary</label>
                                    <p className="text-foreground">{application.expected_salary || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Applied Date</label>
                                    <p className="text-foreground">{new Date(application.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {(application.facebook_link || application.linkedin_link) && (
                                <div className="border-border mt-4 border-t pt-4">
                                    <h4 className="text-muted-foreground mb-2 text-sm font-medium">Social Links</h4>
                                    <div className="flex gap-4">
                                        {application.facebook_link && (
                                            <a
                                                href={application.facebook_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 hover:underline dark:text-sky-400"
                                            >
                                                Facebook Profile
                                            </a>
                                        )}
                                        {application.linkedin_link && (
                                            <a
                                                href={application.linkedin_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 hover:underline dark:text-sky-400"
                                            >
                                                LinkedIn Profile
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ATS Score Analysis */}
                        <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                            <h3 className="text-foreground mb-4 text-lg font-semibold">ATS Score Analysis</h3>
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm font-medium">Match Score</span>
                                    <span className="text-foreground text-lg font-bold">{atsPercentage}%</span>
                                </div>
                                <div className="bg-muted h-4 w-full rounded-full">
                                    <div className={`h-4 rounded-full ${getScoreColor(atsPercentage)}`} style={{ width: `${atsPercentage}%` }}></div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-green-700">Matched Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.matched_keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="rounded border-transparent bg-emerald-500/15 px-2 py-1 text-xs text-emerald-700 dark:text-emerald-400"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-sm font-medium text-red-700">Missing Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.missing_keywords.map((keyword, i) => (
                                            <span key={i} className="bg-destructive/15 text-destructive rounded border-transparent px-2 py-1 text-xs">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {atsAnalysis && (
                                <div className="border-border mt-4 space-y-2 border-t pt-4">
                                    {atsAnalysis.recommendations && (
                                        <div>
                                            <h4 className="text-muted-foreground mb-1 text-sm font-medium">Recommendations</h4>
                                            <ul className="text-muted-foreground list-inside list-disc text-sm">
                                                {atsAnalysis.recommendations.map((rec, i) => (
                                                    <li key={i}>{rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Job Details */}
                        <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                            <h3 className="text-foreground mb-4 text-lg font-semibold">Job Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Title</label>
                                    <p className="text-foreground">{application.job_listing.title}</p>
                                </div>
                                {application.job_listing.category && (
                                    <div>
                                        <label className="text-muted-foreground block text-sm font-medium">Category</label>
                                        <p className="text-foreground">{application.job_listing.category.name}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Description</label>
                                    <p className="text-foreground whitespace-pre-line">{application.job_listing.description}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block text-sm font-medium">Requirements</label>
                                    <p className="text-foreground whitespace-pre-line">{application.job_listing.requirements}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                            <h3 className="text-foreground mb-4 text-lg font-semibold">Current Status</h3>
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadgeClass(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>

                            <div className="mt-4">
                                <label className="text-muted-foreground mb-2 block text-sm font-medium">Update Status</label>
                                <select
                                    value={application.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="border-input focus-visible:ring-ring w-full rounded-lg border px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="hired">Hired</option>
                                </select>
                            </div>
                        </div>

                        {/* Employer Notes */}
                        {application.employer_notes && (
                            <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                                <h3 className="text-foreground mb-2 text-lg font-semibold">Employer Notes</h3>
                                <p className="text-muted-foreground text-sm whitespace-pre-line">{application.employer_notes}</p>
                            </div>
                        )}

                        {/* Status History */}
                        {application.status_timelines.length > 0 && (
                            <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                                <h3 className="text-foreground mb-4 text-lg font-semibold">Status History</h3>
                                <div className="space-y-3">
                                    {application.status_timelines.map((timeline) => (
                                        <div key={timeline.id} className="border-primary border-l-2 pl-4">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(timeline.status)}`}
                                                >
                                                    {timeline.status}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {new Date(timeline.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {timeline.notes && <p className="text-muted-foreground mt-1 text-sm">{timeline.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
