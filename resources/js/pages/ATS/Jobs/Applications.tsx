import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';

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
    [key: string]: unknown;
}

export default function JobApplications() {
    const { props } = usePage<JobApplicationsProps>();
    const { job, applications, statusCounts, filters } = props;

    const handleStatusFilter = (status: string) => {
        router.get(
            `/ats/jobs/${job.id}/applications`,
            { status },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusUpdate = (id: number, status: string) => {
        router.post(`/ats/applications/${id}/status`, { status });
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
            <Head title={`${job.title} - Applications`} />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-foreground text-3xl font-bold">{job.title}</h2>
                    <p className="text-muted-foreground mt-1">
                        {job.category && `${job.category.name} • `}
                        {applications.total} applications
                    </p>
                </div>

                {/* Status Summary */}
                <div className="grid grid-cols-4 gap-4">
                    <button
                        onClick={() => handleStatusFilter('')}
                        className={`bg-card rounded-lg border p-4 shadow ${
                            !filters.status ? 'border-primary ring-primary/20 ring-2' : 'border-border'
                        }`}
                    >
                        <p className="text-muted-foreground text-sm">All</p>
                        <p className="text-foreground text-2xl font-bold">{applications.total}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('pending')}
                        className={`bg-card rounded-lg border p-4 shadow ${
                            filters.status === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border'
                        }`}
                    >
                        <p className="text-muted-foreground text-sm">Pending</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statusCounts.pending}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('shortlisted')}
                        className={`bg-card rounded-lg border p-4 shadow ${
                            filters.status === 'shortlisted' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-border'
                        }`}
                    >
                        <p className="text-muted-foreground text-sm">Shortlisted</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statusCounts.shortlisted}</p>
                    </button>
                    <button
                        onClick={() => handleStatusFilter('hired')}
                        className={`bg-card rounded-lg border p-4 shadow ${
                            filters.status === 'hired' ? 'border-primary ring-primary/20 ring-2' : 'border-border'
                        }`}
                    >
                        <p className="text-muted-foreground text-sm">Hired</p>
                        <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{statusCounts.hired}</p>
                    </button>
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
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        ATS Score
                                    </th>
                                    <th className="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase">
                                        Experience
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
                                                {app.phone && <div className="text-muted-foreground text-xs">{app.phone}</div>}
                                            </div>
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
                                            <div className="text-foreground text-sm">
                                                {app.years_of_experience ? `${app.years_of_experience} yrs` : 'N/A'}
                                            </div>
                                            {app.education_level && <div className="text-muted-foreground text-xs">{app.education_level}</div>}
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
                                        <td className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
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

                {applications.data.length === 0 && (
                    <div className="py-12 text-center">
                        <h3 className="text-foreground text-lg font-medium">No applications found</h3>
                        <p className="text-muted-foreground mt-1">
                            {filters.status ? `No ${filters.status} applications for this job` : 'No applications yet for this job'}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
