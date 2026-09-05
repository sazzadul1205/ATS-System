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
];

interface JobInfo {
    id: number;
    title: string;
    category: string | null;
}

interface Application {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    job: JobInfo;
    status: string;
    ats_score: number;
    matched_keywords: string[];
    missing_keywords: string[];
    experience_years: number | null;
    education_level: string | null;
    expected_salary: string | null;
    created_at: string;
    can_update: boolean;
}

interface FilterOptions {
    status?: string;
    job_id?: string;
    search?: string;
    min_ats_score?: string;
    per_page?: string;
}

interface ApplicationsIndexProps {
    applications: {
        data: Application[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: FilterOptions;
    jobs: { id: number; title: string }[];
    statuses: string[];
    statusCounts: {
        pending: number;
        shortlisted: number;
        rejected: number;
        hired: number;
    };
}

export default function ApplicationsIndex() {
    const { props } = usePage<ApplicationsIndexProps>();
    const { applications, filters, jobs, statuses, statusCounts } = props;

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        router.get('/ats/applications', { ...filters, [key]: value }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleStatusUpdate = (id: number, status: string) => {
        router.post(`/ats/applications/${id}/status`, { status });
    };

    const handleRecalculateATS = (id: number) => {
        router.post(`/ats/applications/${id}/recalculate-ats`);
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
            <Head title="Applications" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Applications</h2>
                        <p className="text-gray-600 mt-1">Review and manage job applications</p>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Shortlisted</p>
                        <p className="text-2xl font-bold text-green-600">{statusCounts.shortlisted}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Hired</p>
                        <p className="text-2xl font-bold text-blue-600">{statusCounts.hired}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            defaultValue={filters.search}
                            onBlur={(e) => handleFilterChange('search', e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilterChange('search', (e.target as HTMLInputElement).value);
                                }
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            defaultValue={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                            ))}
                        </select>
                        <select
                            defaultValue={filters.job_id || ''}
                            onChange={(e) => handleFilterChange('job_id', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Jobs</option>
                            {jobs.map((job) => (
                                <option key={job.id} value={job.id}>
                                    {job.title}
                                </option>
                            ))}
                        </select>
                        <select
                            defaultValue={filters.per_page || '15'}
                            onChange={(e) => handleFilterChange('per_page', e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="10">10 per page</option>
                            <option value="15">15 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                    </div>
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
                                        Job
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ATS Score
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
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{app.job.title}</div>
                                            {app.job.category && (
                                                <div className="text-xs text-gray-500">{app.job.category}</div>
                                            )}
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
                                            <span
                                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                                    app.status
                                                )}`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {app.created_at}
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
                                                <button
                                                    onClick={() => handleRecalculateATS(app.id)}
                                                    className="text-purple-600 hover:text-purple-900"
                                                    title="Recalculate ATS Score"
                                                >
                                                    Refresh ATS
                                                </button>
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
            </div>
        </AppLayout>
    );
}
