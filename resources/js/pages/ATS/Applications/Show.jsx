import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    RefreshCw,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    DollarSign,
    Calendar,
    Facebook,
    Linkedin,
    FileText,
    Target,
    AlertCircle,
    CheckCheck,
    X,
    History,
    StickyNote,
    User,
} from 'lucide-react';

export default function ApplicationShow() {
    const { props } = usePage();
    const { application, atsAnalysis } = props;

    const handleStatusUpdate = (status) => {
        router.post(`/ats/applications/${application.id}/status`, { status });
    };

    const handleRecalculateATS = () => {
        router.post(`/ats/applications/${application.id}/recalculate-ats`);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
            case 'shortlisted':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'hired':
                return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const atsPercentage = application.ats_score?.percentage ?? 0;
    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <AppLayout>
            <Head title={`${application.name} - Application`} />
            <div className="space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.visit('/ats/applications')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Applications
                </button>

                {/* Flash Messages */}
                {props.flash?.success && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        {props.flash.success}
                    </div>
                )}
                {props.flash?.error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {props.flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                            <User className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{application.name}</h2>
                            <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Briefcase className="h-4 w-4" />
                                Applying for: {application.job_listing.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {application.status !== 'hired' && application.status !== 'rejected' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('shortlisted')}
                                    className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Shortlist
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reject
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleRecalculateATS}
                            className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Recalculate ATS
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Application Info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                Application Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <Mail className="h-3.5 w-3.5" />
                                        Email
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{application.email}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <Phone className="h-3.5 w-3.5" />
                                        Phone
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{application.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        Experience
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">
                                        {application.years_of_experience ? `${application.years_of_experience} years` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        Education
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{application.education_level || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        Expected Salary
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{application.expected_salary || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Applied Date
                                    </label>
                                    <p className="mt-1 text-gray-900 dark:text-white">
                                        {new Date(application.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {(application.facebook_link || application.linkedin_link) && (
                                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Social Links</h4>
                                    <div className="flex gap-4">
                                        {application.facebook_link && (
                                            <a
                                                href={application.facebook_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                <Facebook className="h-4 w-4" />
                                                Facebook Profile
                                            </a>
                                        )}
                                        {application.linkedin_link && (
                                            <a
                                                href={application.linkedin_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                                            >
                                                <Linkedin className="h-4 w-4" />
                                                LinkedIn Profile
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ATS Score Analysis */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                ATS Score Analysis
                            </h3>
                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Match Score</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{atsPercentage}%</span>
                                </div>
                                <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-4 rounded-full ${getScoreColor(atsPercentage)}`}
                                        style={{ width: `${atsPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                        <CheckCheck className="h-4 w-4" />
                                        Matched Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.matched_keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-2 flex items-center gap-1 text-sm font-medium text-red-700 dark:text-red-400">
                                        <X className="h-4 w-4" />
                                        Missing Keywords
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.missing_keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="rounded bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {atsAnalysis && (
                                <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                    {atsAnalysis.recommendations && (
                                        <div>
                                            <h4 className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                <AlertCircle className="h-4 w-4" />
                                                Recommendations
                                            </h4>
                                            <ul className="list-inside list-disc text-sm text-gray-600 dark:text-gray-400">
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
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                Job Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Title</label>
                                    <p className="text-gray-900 dark:text-white">{application.job_listing.title}</p>
                                </div>
                                {application.job_listing.category && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                                        <p className="text-gray-900 dark:text-white">{application.job_listing.category.name}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Description</label>
                                    <p className="whitespace-pre-line text-gray-900 dark:text-white">{application.job_listing.description}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Requirements</label>
                                    <p className="whitespace-pre-line text-gray-900 dark:text-white">{application.job_listing.requirements}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Current Status</h3>
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusBadgeClass(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>

                            <div className="mt-4">
                                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-400">Update Status</label>
                                <select
                                    value={application.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
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
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <StickyNote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    Employer Notes
                                </h3>
                                <p className="whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{application.employer_notes}</p>
                            </div>
                        )}

                        {/* Status History */}
                        {application.status_timelines.length > 0 && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    Status History
                                </h3>
                                <div className="space-y-3">
                                    {application.status_timelines.map((timeline) => (
                                        <div key={timeline.id} className="border-l-2 border-indigo-500 pl-4 dark:border-indigo-400">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(timeline.status)}`}
                                                >
                                                    {timeline.status}
                                                </span>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {new Date(timeline.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {timeline.notes && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{timeline.notes}</p>}
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