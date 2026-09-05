import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';

export default function JobApplications() {
    const { props } = usePage();
    const { job, applications, statusCounts, filters } = props;

    const handleStatusFilter = (status) => {
        router.get(
            `/ats/jobs/${job.id}/applications`,
            { status },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusUpdate = (id, status) => {
        router.post(`/ats/applications/${id}/status`, { status });
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
            <Head title={`${job.title} - Applications`} />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {job.category && `${job.category.name} • `}
                        {applications.total} applications
                    </p>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`rounded-lg border p-4 shadow-sm transition-colors ${!filters.status
                                ? 'border-indigo-500 bg-white ring-2 ring-indigo-500/20 dark:bg-gray-900'
                                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
                            }`}
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">All</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications.total}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`rounded-lg border p-4 shadow-sm transition-colors ${filters.status === 'pending'
                                ? 'border-amber-500 bg-white ring-2 ring-amber-500/20 dark:bg-gray-900'
                                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
                            }`}
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('shortlisted')}
                        className={`rounded-lg border p-4 shadow-sm transition-colors ${filters.status === 'shortlisted'
                                ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 dark:bg-gray-900'
                                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
                            }`}
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Shortlisted</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statusCounts.shortlisted}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('hired')}
                        className={`rounded-lg border p-4 shadow-sm transition-colors ${filters.status === 'hired'
                                ? 'border-sky-500 bg-white ring-2 ring-sky-500/20 dark:bg-gray-900'
                                : 'border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800'
                            }`}
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hired</p>
                        <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{statusCounts.hired}</p>
                    </button>
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
                                        ATS Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Experience
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
                                                {app.phone && <div className="text-xs text-gray-600 dark:text-gray-400">{app.phone}</div>}
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
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {app.years_of_experience ? `${app.years_of_experience} yrs` : 'N/A'}
                                            </div>
                                            {app.education_level && <div className="text-xs text-gray-600 dark:text-gray-400">{app.education_level}</div>}
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
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.visit(`/ats/applications/${app.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    View
                                                </button>
                                                {app.can_update && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                        >
                                                            Shortlist
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
                                className={`rounded-md px-4 py-2 text-sm font-medium ${link.active
                                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {applications.data.length === 0 && (
                    <div className="py-12 text-center">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No applications found</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {filters.status ? `No ${filters.status} applications for this job` : 'No applications yet for this job'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}