import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    RefreshCw,
    Users,
    Clock,
    UserCheck,
    UserX,
    Briefcase,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

export default function ApplicationsIndex() {
    const { props } = usePage();
    const { applications, filters, jobs, statuses, statusCounts } = props;

    const handleFilterChange = (key, value) => {
        router.get(
            '/ats/applications',
            { ...filters, [key]: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusUpdate = (id, status) => {
        router.post(`/ats/applications/${id}/status`, { status });
    };

    const handleRecalculateATS = (id) => {
        router.post(`/ats/applications/${id}/recalculate-ats`);
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

    const getScoreColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <AppLayout>
            <Head title="Applications" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                            <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            Applications
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Review and manage job applications</p>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statusCounts.shortlisted}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.rejected}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">Hired</p>
                        </div>
                        <p className="mt-1 text-2xl font-bold text-sky-600 dark:text-sky-400">{statusCounts.hired}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Filter className="h-4 w-4" />
                        Filters
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                defaultValue={filters.search}
                                onBlur={(e) => handleFilterChange('search', e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleFilterChange('search', e.target.value);
                                    }
                                }}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                            />
                        </div>
                        <select
                            defaultValue={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
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
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
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
                            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                        >
                            <option value="10">10 per page</option>
                            <option value="15">15 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Applicant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Job
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        ATS Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Applied Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {applications.data.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{app.email}</div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <div className="text-sm text-gray-900 dark:text-white">{app.job.title}</div>
                                                    {app.job.category && <div className="text-xs text-gray-600 dark:text-gray-400">{app.job.category}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-2.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">{app.ats_score}%</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeClass(
                                                    app.status,
                                                )}`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{app.created_at}</td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => router.visit(`/ats/applications/${app.id}`)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {app.can_update && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                            title="Shortlist"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleRecalculateATS(app.id)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                    title="Recalculate ATS Score"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
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
                                className={`inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium ${
                                    link.active
                                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}