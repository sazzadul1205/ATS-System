import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ATS', href: '/ats' },
    { title: 'Jobs', href: '/ats/jobs' },
    { title: 'Apply', href: '#' },
];

interface ApplyJob {
    id: number;
    title: string;
    description: string | null;
    requirements: string | null;
    keywords: string[];
    category: string | null;
    locations: string[];
    job_type: string;
    is_active: boolean;
}

interface ApplyProps {
    job: ApplyJob;
}

const educationLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' },
];

export default function Apply({ job }: ApplyProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        years_of_experience: '',
        education_level: 'bachelor',
        expected_salary: '',
        cv: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post(`/ats/jobs/${job.id}/apply`, {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    const inputClass = 'w-full border-input bg-background focus-visible:ring-ring';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Test ATS with your CV" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-foreground text-3xl font-bold">Test the ATS with your own CV</h2>
                    <p className="text-muted-foreground">
                        Fill in your details, upload your CV (PDF, DOC or DOCX), and the ATS will score how well it matches{' '}
                        <Link href={`/ats/jobs/${job.id}/applications`} className="text-primary underline-offset-4 hover:underline">
                            {job.title}
                        </Link>
                        .
                    </p>
                </div>

                {job.is_active ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Job summary */}
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-xl">{job.title}</CardTitle>
                                <CardDescription>
                                    {job.category ? job.category : ''}
                                    {job.locations.length > 0 ? ` · ${job.locations.join(', ')}` : ''}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">{job.job_type}</Badge>
                                    <Badge variant="secondary">Active</Badge>
                                </div>

                                {job.description && (
                                    <div>
                                        <h3 className="text-muted-foreground mb-1 text-sm font-medium">About this role</h3>
                                        <p className="text-foreground text-sm whitespace-pre-line">{job.description}</p>
                                    </div>
                                )}

                                {job.requirements && (
                                    <div>
                                        <h3 className="text-muted-foreground mb-1 text-sm font-medium">What we are looking for</h3>
                                        <p className="text-foreground text-sm whitespace-pre-line">{job.requirements}</p>
                                    </div>
                                )}

                                {job.keywords.length > 0 && (
                                    <div>
                                        <h3 className="text-muted-foreground mb-2 text-sm font-medium">Tracked keywords</h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {job.keywords.map((keyword) => (
                                                <Badge key={keyword} variant="outline">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>{' '}
                        {/* Application form */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-xl">Your application</CardTitle>
                                <CardDescription>Your CV is scored against the tracked keywords for this role.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Jane Doe"
                                                className={inputClass}
                                            />
                                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="jane@example.com"
                                                className={inputClass}
                                            />
                                            {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone (optional)</Label>
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+1 555-0100"
                                                className={inputClass}
                                            />
                                            {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="years_of_experience">Years of experience</Label>
                                            <Input
                                                id="years_of_experience"
                                                type="number"
                                                min={0}
                                                max={60}
                                                value={data.years_of_experience}
                                                onChange={(e) => setData('years_of_experience', e.target.value)}
                                                placeholder="e.g. 4"
                                                className={inputClass}
                                            />
                                            {errors.years_of_experience && <p className="text-destructive text-sm">{errors.years_of_experience}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="education_level">Highest education</Label>{' '}
                                            <select
                                                id="education_level"
                                                value={data.education_level}
                                                onChange={(e) => setData('education_level', e.target.value)}
                                                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
                                            >
                                                {educationLevels.map((level) => (
                                                    <option key={level.value} value={level.value}>
                                                        {level.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.education_level && <p className="text-destructive text-sm">{errors.education_level}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="expected_salary">Expected salary ($USD, optional)</Label>
                                            <Input
                                                id="expected_salary"
                                                type="number"
                                                min={0}
                                                value={data.expected_salary}
                                                onChange={(e) => setData('expected_salary', e.target.value)}
                                                placeholder="e.g. 90000"
                                                className={inputClass}
                                            />
                                            {errors.expected_salary && <p className="text-destructive text-sm">{errors.expected_salary}</p>}
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="cv">CV / Resume (PDF, DOC or DOCX · max 5 MB)</Label>
                                            <div className="border-input bg-background flex items-center gap-3 rounded-md border p-2">
                                                <label
                                                    htmlFor="cv"
                                                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-9 cursor-pointer items-center rounded-md px-3 text-sm font-medium transition-colors"
                                                >
                                                    Choose file
                                                </label>
                                                <Input
                                                    id="cv"
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                    onChange={(e) => setData('cv', e.target.files?.[0] ?? null)}
                                                    className="sr-only"
                                                />
                                                <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm" aria-live="polite">
                                                    {data.cv ? data.cv.name : 'No file chosen'}
                                                </span>
                                                {data.cv && (
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setData('cv', null)}>
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            {errors.cv && <p className="text-destructive text-sm">{errors.cv}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <Button type="button" variant="ghost" onClick={() => router.visit('/ats/jobs')}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Scoring your CV...' : 'Test my CV · Get ATS Score'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-10 text-center">
                            <h3 className="text-foreground text-lg font-semibold">This job is no longer accepting applications</h3>
                            <p className="text-muted-foreground mt-1 text-sm">Browse other open roles to test your CV with.</p>
                            <Button className="mt-4" onClick={() => router.visit('/ats/jobs')}>
                                Browse jobs
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
