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
    [key: string]: unknown;
}

export default function ApplicationsIndex() {
    const { props } = usePage<ApplicationsIndexProps>();
    const { applications, filters, jobs, statuses, statusCounts } = props;

    const handleFilterChange = (key: keyof FilterOptions, value: string) => {
        router.get(
            '/ats/applications',
            { ...filters, [key]: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-destructive';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Applications" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-foreground text-3xl font-bold">Applications</h2>
                        <p className="text-muted-foreground mt-1">Review and manage job applications</p>
                    </div>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-card border-border rounded-lg border p-4 shadow">
                        <p className="text-muted-foreground text-sm">Pending</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
                    </div>
                    <div className="bg-card border-border rounded-lg border p-4 shadow">
                        <p className="text-muted-foreground text-sm">Shortlisted</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statusCounts.shortlisted}</p>
                    </div>
                    <div className="bg-card border-border rounded-lg border p-4 shadow">
                        <p className="text-muted-foreground text-sm">Rejected</p>
                        <p className="text-destructive text-2xl font-bold">{statusCounts.rejected}</p>
                    </div>
                    <div className="bg-card border-border rounded-lg border p-4 shadow">
                        <p className="text-muted-foreground text-sm">Hired</p>
                        <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{statusCounts.hired}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border-border space-y-4 rounded-lg border p-4 shadow">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                            className="border-input focus-visible:ring-ring rounded-lg border px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                        />
                        <select
                            defaultValue={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="border-input focus-visible:ring-ring rounded-lg border px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
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
                            className="border-input focus-visible:ring-ring rounded-lg border px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
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
                            className="border-input focus-visible:ring-ring rounded-lg border px-4 py-2 focus-visible:ring-2 focus-visible:ring-offset-2"
                        >
                            <option value="10">10 per page</option>
                            <option value="15">15 per page</option>
                            <option value="25">25 per page</option>
                            <option value="50">50 per page</option>
                        </select>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-card border-border overflow-hidden rounded-lg border shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="divide-border min-w-full divide-y">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Applicant
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">Job</th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        ATS Score
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">Status</th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Applied Date
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-border divide-y">
                                {applications.data.map((app) => (
                                    <tr key={app.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-foreground text-sm font-medium">{app.name}</div>
                                                <div className="text-muted-foreground text-sm">{app.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-foreground text-sm">{app.job.title}</div>
                                            {app.job.category && <div className="text-muted-foreground text-xs">{app.job.category}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-muted h-2.5 w-24 w-full rounded-full">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-muted-foreground ml-2 text-sm font-medium">{app.ats_score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${getStatusBadgeClass(
                                                    app.status,
                                                )}`}
                                            >
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">{app.created_at}</td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => router.visit(`/ats/applications/${app.id}`)}
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    View
                                                </button>
                                                {app.can_update && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                                                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                                        >
                                                            Shortlist
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                                            className="text-destructive hover:text-destructive/80"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleRecalculateATS(app.id)}
                                                    className="text-primary hover:text-primary/80"
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
                                className={`rounded px-4 py-2 ${
                                    link.active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
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
