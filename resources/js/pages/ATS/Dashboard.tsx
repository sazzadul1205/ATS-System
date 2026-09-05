import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ATS Dashboard',
        href: '/ats',
    },
];

interface ATSStats {
    avg: number;
    min: number;
    max: number;
}

interface RecentApplication {
    id: number;
    name: string;
    email: string;
    job_title: string;
    status: string;
    ats_score: number;
    created_at: string;
}

interface JobWithApps {
    id: number;
    title: string;
    is_active: boolean;
    applications_count: number;
}

interface DashboardProps {
    statusCounts: {
        pending: number;
        shortlisted: number;
        rejected: number;
        hired: number;
        total: number;
    };
    atsStats: ATSStats;
    recentApplications: RecentApplication[];
    topJobs: JobWithApps[];
    [key: string]: unknown;
}

export default function ATSDashboard() {
    const { props } = usePage<DashboardProps>();
    const { statusCounts, atsStats, recentApplications, topJobs } = props;

    const stats = [
        { label: 'Total Applications', value: statusCounts.total, color: 'text-primary' },
        { label: 'Pending', value: statusCounts.pending, color: 'text-amber-600 dark:text-amber-400' },
        { label: 'Shortlisted', value: statusCounts.shortlisted, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Rejected', value: statusCounts.rejected, color: 'text-destructive' },
    ];

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
            <Head title="ATS Dashboard" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-foreground text-3xl font-bold">ATS Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Overview of your Applicant Tracking System</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-card border-border rounded-lg border p-6 shadow-xs">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ATS Score Stats */}
                <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                    <h3 className="text-foreground mb-4 text-lg font-semibold">ATS Score Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">Average Score</p>
                            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{atsStats.avg}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">Minimum Score</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atsStats.min}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground text-sm">Maximum Score</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{atsStats.max}%</p>
                        </div>
                    </div>
                </div>

                {/* Top Jobs */}
                <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                    <h3 className="text-foreground mb-4 text-lg font-semibold">Top Jobs by Applications</h3>
                    <div className="space-y-3">
                        {topJobs.map((job) => (
                            <div key={job.id} className="flex items-center justify-between border-b py-2 last:border-0">
                                <span className="text-foreground font-medium">{job.title}</span>
                                <span className="rounded-full border-transparent bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-700 dark:text-sky-400">
                                    {job.applications_count} applications
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="bg-card border-border rounded-lg border p-6 shadow-xs">
                    <h3 className="text-foreground mb-4 text-lg font-semibold">Recent Applications</h3>
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
                                        Applied
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-border divide-y">
                                {recentApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-foreground text-sm font-medium">{app.name}</div>
                                                <div className="text-muted-foreground text-sm">{app.email}</div>
                                            </div>
                                        </td>
                                        <td className="text-foreground px-6 py-4 text-sm whitespace-nowrap">{app.job_title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-muted h-2.5 w-24 w-full rounded-full">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-muted-foreground ml-2 text-sm">{app.ats_score}%</span>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
