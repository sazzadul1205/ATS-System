import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Briefcase,
    MapPin,
    Calendar,
    Users,
    FileText,
    Eye,
    CheckCircle,
    XCircle,
} from 'lucide-react';

export default function JobsIndex() {
    const { props } = usePage();
    const { jobs } = props;

    return (
        <AppLayout>
            <Head title="Jobs" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                            <Briefcase className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            Jobs
                        </h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage job postings and track applications</p>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.data.map((job) => (
                        <div
                            key={job.id}
                            className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                            onClick={() => router.visit(`/ats/jobs/${job.id}/applications`)}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                    {job.category && <p className="text-sm text-gray-600 dark:text-gray-400">{job.category.name}</p>}
                                </div>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${job.is_active
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                        }`}
                                >
                                    {job.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    {job.is_active ? 'Active' : 'Closed'}
                                </span>
                            </div>

                            <div className="mb-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">Applications:</span>
                                    {job.applications_count}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">Posted:</span>
                                    {new Date(job.created_at).toLocaleDateString()}
                                </div>
                                {job.locations && job.locations.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium">Locations:</span>
                                        {job.locations.map((loc) => loc.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{job.description}</p>

                            <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                                <button
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.visit(`/ats/jobs/${job.id}/apply`);
                                    }}
                                >
                                    <FileText className="h-4 w-4" />
                                    Test ATS · Apply with my CV
                                </button>
                                <button
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.visit(`/ats/jobs/${job.id}/applications`);
                                    }}
                                >
                                    <Eye className="h-4 w-4" />
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
                                className={`rounded-md px-4 py-2 text-sm font-medium ${link.active
                                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {jobs.data.length === 0 && (
                    <div className="py-12 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No jobs found</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Create a new job posting to get started</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}