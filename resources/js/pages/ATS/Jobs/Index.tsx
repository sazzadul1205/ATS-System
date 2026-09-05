import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ATS',
        href: '/ats',
    },
    {
        title: 'Jobs',
        href: '/ats/jobs',
    },
];

interface JobCategory {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
    country: string;
}

interface Job {
    id: number;
    title: string;
    description: string;
    requirements: string;
    is_active: boolean;
    category?: JobCategory;
    locations?: Location[];
    applications_count: number;
    created_at: string;
}

interface JobsIndexProps {
    jobs: {
        data: Job[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
}

export default function JobsIndex() {
    const { props } = usePage<JobsIndexProps>();
    const { jobs } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jobs" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Jobs</h2>
                        <p className="text-gray-600 mt-1">Manage job postings and track applications</p>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.data.map((job) => (
                        <div
                            key={job.id}
                            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => router.visit(`/ats/jobs/${job.id}/applications`)}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                                    {job.category && (
                                        <p className="text-gray-600">{job.category.name}</p>
                                    )}
                                </div>
                                <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        job.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {job.is_active ? 'Active' : 'Closed'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium mr-2">Applications:</span>
                                    {job.applications_count}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <span className="font-medium mr-2">Posted:</span>
                                    {new Date(job.created_at).toLocaleDateString()}
                                </div>
                                {job.locations && job.locations.length > 0 && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span className="font-medium mr-2">Locations:</span>
                                        {job.locations.map((loc) => loc.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>

                            <div className="pt-4 border-t border-gray-200">
                                <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                                    View Applications ({job.applications_count})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {jobs.links.length > 3 && (
                    <div className="flex justify-center gap-2">
                        {jobs.links.map((link, index) => (
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

                {jobs.data.length === 0 && (
                    <div className="text-center py-12">
                        <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                        <p className="text-gray-500 mt-1">Create a new job posting to get started</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
