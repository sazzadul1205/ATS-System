import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ATS',
        href: '/ats',
    },
    {
        title: 'Jobs',
        href: '/ats/jobs',
    },
    {
        title: 'Applications',
        href: '#',
    },
];

interface JobListing {
    id: number;
    title: string;
    description: string;
    is_active: boolean;
    category?: { id: number; name: string };
}

interface Application {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    ats_score: number;
    years_of_experience: number | null;
    education_level: string | null;
    created_at: string;
    can_update: boolean;
}

interface JobApplicationsProps {
    job: JobListing;
    applications: {
        data: Application[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    statusCounts: {
        pending: number;
        shortlisted: number;
        rejected: number;
        hired: number;
    };
    filters: {
        status?: string;
    };
}

export default function JobApplications() {
    const { props } = usePage<JobApplicationsProps>();
    const { job, applications, statusCounts, filters } = props;

    const handleStatusFilter = (status: string) => {
        router.get(`/ats/jobs/${job.id}/applications`, { status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusUpdate = (id: number, status: string) => {
        router.post(`/ats/applications/${id}/status`, { status });
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${job.title} - Applications`} />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{job.title}</h2>
                    <p className="text-gray-600 mt-1">
                        {job.category && `${job.category.name} • `}
                        {applications.total} applications
                    </p>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`bg-white rounded-lg shadow p-4 border ${
                            !filters.status ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                    >
                        <p className="text-sm text-gray-600">All</p>
                        <p className="text-2xl font-bold text-gray-800">{applications.total}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`bg-white rounded-lg shadow p-4 border ${
                            filters.status === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200'
                        }`}
                    >
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('shortlisted')}
                        className={`bg-white rounded-lg shadow p-4 border ${
                            filters.status === 'shortlisted' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                        }`}
                    >
                        <p className="text-sm text-gray-600">Shortlisted</p>
                        <p className="text-2xl font-bold text-green-600">{statusCounts.shortlisted}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('hired')}
                        className={`bg-white rounded-lg shadow p-4 border ${
                            filters.status === 'hired' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                        }`}
                    >
                        <p className="text-sm text-gray-600">Hired</p>
                        <p className="text-2xl font-bold text-blue-600">{statusCounts.hired}</p>
                    </button>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applicant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ATS Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Experience
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Applied Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.data.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                                <div className="text-sm text-gray-500">{app.email}</div>
                                                {app.phone && (
                                                    <div className="text-xs text-gray-400">{app.phone}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 w-24">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-700">
                                                    {app.ats_score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {app.years_of_experience ? `${app.years_of_experience} yrs` : 'N/A'}
                                            </div>
                                            {app.education_level && (
                                                <div className="text-xs text-gray-500">{app.education_level}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                                    app.status
                                                )}`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.visit(`/ats/applications/${app.id}`)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </button>
                                                {app.can_update && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleStatusUpdate(app.id, 'shortlisted')
                                                            }
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Shortlist
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {applications.links.length > 3 && (
                    <div className="flex justify-center gap-2">
                        {applications.links.map((link, index) => (
                            <button
                                key={index}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                className={`px-4 py-2 rounded ${
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100'
                                } disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {applications.data.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
                        <p className="text-gray-500 mt-1">
                            {filters.status
                                ? `No ${filters.status} applications for this job`
                                : 'No applications yet for this job'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
