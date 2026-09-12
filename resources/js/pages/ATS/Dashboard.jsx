import AppLayout from '@/layouts/AppLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Users,
    Clock,
    UserCheck,
    UserX,
    TrendingUp,
    Award,
    Target,
    Briefcase,
    Calendar,
} from 'lucide-react';

export default function ATSDashboard() {
    const { props } = usePage();
    const { statusCounts, atsStats, recentApplications, topJobs } = props;

    const stats = [
        { label: 'Total Applications', value: statusCounts.total, color: 'text-indigo-600 dark:text-indigo-400', icon: Users },
        { label: 'Pending', value: statusCounts.pending, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
        { label: 'Shortlisted', value: statusCounts.shortlisted, color: 'text-emerald-600 dark:text-emerald-400', icon: UserCheck },
        { label: 'Rejected', value: statusCounts.rejected, color: 'text-red-600 dark:text-red-400', icon: UserX },
    ];

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
            <Head title="ATS Dashboard" />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                        <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        ATS Dashboard
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Overview of your Applicant Tracking System</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* ATS Score Stats */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        ATS Score Statistics
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30">
                                <TrendingUp className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{atsStats.avg}%</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Minimum Score</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{atsStats.min}%</p>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Maximum Score</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{atsStats.max}%</p>
                        </div>
                    </div>
                </div>

                {/* Top Jobs */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Top Jobs by Applications
                    </h3>
                    <div className="space-y-3">
                        {topJobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center justify-between border-b border-gray-200 py-2 last:border-0 dark:border-gray-700"
                            >
                                <span className="font-medium text-gray-900 dark:text-white">{job.title}</span>
                                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                    {job.applications_count} applications
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                        <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Recent Applications
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Applicant
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Job
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        ATS Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                                        Applied
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                {recentApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{app.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">{app.job_title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-2.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{app.ats_score}%</span>
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
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">{app.created_at}</td>
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