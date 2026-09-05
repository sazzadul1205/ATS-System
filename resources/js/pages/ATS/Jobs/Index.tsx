import { Button } from '@/components/ui/button';
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
    [key: string]: unknown;
}

export default function JobsIndex() {
    const { props } = usePage<JobsIndexProps>();
    const { jobs } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Jobs" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-foreground text-3xl font-bold">Jobs</h2>
                        <p className="text-muted-foreground mt-1">Manage job postings and track applications</p>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.data.map((job) => (
                        <div
                            key={job.id}
                            className="bg-card border-border cursor-pointer rounded-lg border p-6 shadow-xs transition-shadow hover:shadow-xs"
                            onClick={() => router.visit(`/ats/jobs/${job.id}/applications`)}
                        >
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-foreground text-xl font-semibold">{job.title}</h3>
                                    {job.category && <p className="text-muted-foreground">{job.category.name}</p>}
                                </div>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                        job.is_active
                                            ? 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-destructive/15 text-destructive border-transparent'
                                    }`}
                                >
                                    {job.is_active ? 'Active' : 'Closed'}
                                </span>
                            </div>

                            <div className="mb-4 space-y-2">
                                <div className="text-muted-foreground flex items-center text-sm">
                                    <span className="mr-2 font-medium">Applications:</span>
                                    {job.applications_count}
                                </div>
                                <div className="text-muted-foreground flex items-center text-sm">
                                    <span className="mr-2 font-medium">Posted:</span>
                                    {new Date(job.created_at).toLocaleDateString()}
                                </div>
                                {job.locations && job.locations.length > 0 && (
                                    <div className="text-muted-foreground flex items-center text-sm">
                                        <span className="mr-2 font-medium">Locations:</span>
                                        {job.locations.map((loc) => loc.name).join(', ')}
                                    </div>
                                )}
                            </div>

                            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{job.description}</p>

                            <div className="border-border space-y-2 border-t pt-4">
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.visit(`/ats/jobs/${job.id}/apply`);
                                    }}
                                >
                                    Test ATS · Apply with my CV
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.visit(`/ats/jobs/${job.id}/applications`);
                                    }}
                                >
                                    View Applications ({job.applications_count})
                                </Button>
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
                                className={`rounded px-4 py-2 ${
                                    link.active ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                                } disabled:opacity-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}

                {jobs.data.length === 0 && (
                    <div className="py-12 text-center">
                        <h3 className="text-foreground text-lg font-medium">No jobs found</h3>
                        <p className="text-muted-foreground mt-1">Create a new job posting to get started</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
