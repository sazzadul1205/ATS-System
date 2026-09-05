import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

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
                return 'bg-yellow-100 text-yellow-800';
            case 'shortlisted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'hired':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const atsPercentage = application.ats_score?.percentage ?? 0;
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${application.name} - Application`} />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">{application.name}</h2>
                        <p className="text-gray-600 mt-1">
                            Applying for: {application.job_listing.title}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {application.status !== 'hired' && application.status !== 'rejected' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('shortlisted')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Shortlist
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Reject
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleRecalculateATS}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            Recalculate ATS
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Application Info */}
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-800">{application.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                                    <p className="text-gray-800">{application.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Experience</label>
                                    <p className="text-gray-800">
                                        {application.years_of_experience
                                            ? `${application.years_of_experience} years`
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Education</label>
                                    <p className="text-gray-800">{application.education_level || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Expected Salary</label>
                                    <p className="text-gray-800">{application.expected_salary || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Applied Date</label>
                                    <p className="text-gray-800">{new Date(application.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {(application.facebook_link || application.linkedin_link) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Social Links</h4>
                                    <div className="flex gap-4">
                                        {application.facebook_link && (
                                            <a
                                                href={application.facebook_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Facebook Profile
                                            </a>
                                        )}
                                        {application.linkedin_link && (
                                            <a
                                                href={application.linkedin_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                LinkedIn Profile
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ATS Score Analysis */}
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">ATS Score Analysis</h3>
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Match Score</span>
                                    <span className="text-lg font-bold text-gray-800">{atsPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                        className={`h-4 rounded-full ${getScoreColor(atsPercentage)}`}
                                        style={{ width: `${atsPercentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <h4 className="text-sm font-medium text-green-700 mb-2">Matched Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.matched_keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-red-700 mb-2">Missing Keywords</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {application.missing_keywords.map((keyword, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded"
                                            >
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {atsAnalysis && (
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                    {atsAnalysis.recommendations && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-1">Recommendations</h4>
                                            <ul className="list-disc list-inside text-sm text-gray-600">
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
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Details</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Title</label>
                                    <p className="text-gray-800">{application.job_listing.title}</p>
                                </div>
                                {application.job_listing.category && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Category</label>
                                        <p className="text-gray-800">{application.job_listing.category.name}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Description</label>
                                    <p className="text-gray-800 whitespace-pre-line">
                                        {application.job_listing.description}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Requirements</label>
                                    <p className="text-gray-800 whitespace-pre-line">
                                        {application.job_listing.requirements}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Status</h3>
                            <span
                                className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadgeClass(
                                    application.status
                                )}`}
                            >
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Update Status
                                </label>
                                <select
                                    value={application.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Employer Notes</h3>
                                <p className="text-gray-600 text-sm whitespace-pre-line">
                                    {application.employer_notes}
                                </p>
                            </div>
                        )}

                        {/* Status History */}
                        {application.status_timelines.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status History</h3>
                                <div className="space-y-3">
                                    {application.status_timelines.map((timeline) => (
                                        <div key={timeline.id} className="border-l-2 border-blue-500 pl-4">
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                                                        timeline.status
                                                    )}`}
                                                >
                                                    {timeline.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(timeline.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {timeline.notes && (
                                                <p className="text-sm text-gray-600 mt-1">{timeline.notes}</p>
                                            )}
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
