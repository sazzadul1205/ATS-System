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
}

export default function ATSDashboard() {
    const { props } = usePage<DashboardProps>();
    const { statusCounts, atsStats, recentApplications, topJobs } = props;

    const stats = [
        { label: 'Total Applications', value: statusCounts.total, color: 'blue' },
        { label: 'Pending', value: statusCounts.pending, color: 'yellow' },
        { label: 'Shortlisted', value: statusCounts.shortlisted, color: 'green' },
        { label: 'Rejected', value: statusCounts.rejected, color: 'red' },
    ];

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
            <Head title="ATS Dashboard" />
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">ATS Dashboard</h2>
                    <p className="text-gray-600 mt-1">Overview of your Applicant Tracking System</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className={`text-3xl font-bold mt-2 text-${stat.color}-600`}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ATS Score Stats */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">ATS Score Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Average Score</p>
                            <p className="text-2xl font-bold text-blue-600">{atsStats.avg}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Minimum Score</p>
                            <p className="text-2xl font-bold text-yellow-600">{atsStats.min}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Maximum Score</p>
                            <p className="text-2xl font-bold text-green-600">{atsStats.max}%</p>
                        </div>
                    </div>
                </div>

                {/* Top Jobs */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Jobs by Applications</h3>
                    <div className="space-y-3">
                        {topJobs.map((job) => (
                            <div key={job.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                <span className="font-medium text-gray-800">{job.title}</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                    {job.applications_count} applications
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Applications</h3>
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
                                        Applied
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                                <div className="text-sm text-gray-500">{app.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {app.job_title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 w-24">
                                                    <div
                                                        className={`h-2.5 rounded-full ${getScoreColor(app.ats_score)}`}
                                                        style={{ width: `${app.ats_score}%` }}
                                                    ></div>
                                                </div>
                                                <span className="ml-2 text-sm text-gray-600">{app.ats_score}%</span>
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
