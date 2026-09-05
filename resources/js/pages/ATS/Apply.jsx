import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';


const educationLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'PhD' },
];

export default function Apply({ job }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        years_of_experience: '',
        education_level: 'bachelor',
        expected_salary: '',
        cv: null,
    });

    const submit = (e) => {
        e.preventDefault();

        post(`/ats/jobs/${job.id}/apply`, {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout>
            <Head title="Test ATS with your CV" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Test the ATS with your own CV</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fill in your details, upload your CV (PDF, DOC or DOCX), and the ATS will score how well it matches{' '}
                        <Link
                            href={`/ats/jobs/${job.id}/applications`}
                            className="text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
                        >
                            {job.title}
                        </Link>
                        .
                    </p>
                </div>

                {job.is_active ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Job summary */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-1">
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {job.category ? job.category : ''}
                                    {job.locations.length > 0 ? ` · ${job.locations.join(', ')}` : ''}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        {job.job_type}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        Active
                                    </span>
                                </div>

                                {job.description && (
                                    <div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">About this role</h4>
                                        <p className="whitespace-pre-line text-sm text-gray-900 dark:text-white">{job.description}</p>
                                    </div>
                                )}

                                {job.requirements && (
                                    <div>
                                        <h4 className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">What we are looking for</h4>
                                        <p className="whitespace-pre-line text-sm text-gray-900 dark:text-white">{job.requirements}</p>
                                    </div>
                                )}

                                {job.keywords.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Tracked keywords</h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {job.keywords.map((keyword) => (
                                                <span
                                                    key={keyword}
                                                    className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
                                                >
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Application form */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Your application</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your CV is scored against the tracked keywords for this role.</p>
                            </div>

                            <form onSubmit={submit} className="space-y-4" encType="multipart/form-data">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Full name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Jane Doe"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        />
                                        {errors.name && <p className="text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="jane@example.com"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        />
                                        {errors.email && <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Phone (optional)
                                        </label>
                                        <input
                                            id="phone"
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="+1 555-0100"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        />
                                        {errors.phone && <p className="text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
                                    </div>

                                    {/* Years of Experience */}
                                    <div className="space-y-2">
                                        <label htmlFor="years_of_experience" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Years of experience
                                        </label>
                                        <input
                                            id="years_of_experience"
                                            type="number"
                                            min={0}
                                            max={60}
                                            value={data.years_of_experience}
                                            onChange={(e) => setData('years_of_experience', e.target.value)}
                                            placeholder="e.g. 4"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        />
                                        {errors.years_of_experience && <p className="text-sm text-red-600 dark:text-red-400">{errors.years_of_experience}</p>}
                                    </div>

                                    {/* Education Level */}
                                    <div className="space-y-2">
                                        <label htmlFor="education_level" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Highest education
                                        </label>
                                        <select
                                            id="education_level"
                                            value={data.education_level}
                                            onChange={(e) => setData('education_level', e.target.value)}
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        >
                                            {educationLevels.map((level) => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.education_level && <p className="text-sm text-red-600 dark:text-red-400">{errors.education_level}</p>}
                                    </div>

                                    {/* Expected Salary */}
                                    <div className="space-y-2">
                                        <label htmlFor="expected_salary" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Expected salary ($USD, optional)
                                        </label>
                                        <input
                                            id="expected_salary"
                                            type="number"
                                            min={0}
                                            value={data.expected_salary}
                                            onChange={(e) => setData('expected_salary', e.target.value)}
                                            placeholder="e.g. 90000"
                                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
                                        />
                                        {errors.expected_salary && <p className="text-sm text-red-600 dark:text-red-400">{errors.expected_salary}</p>}
                                    </div>

                                    {/* CV Upload */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="cv" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            CV / Resume (PDF, DOC or DOCX · max 5 MB)
                                        </label>
                                        <div className="flex items-center gap-3 rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
                                            <label
                                                htmlFor="cv"
                                                className="inline-flex h-9 cursor-pointer items-center rounded-md bg-gray-100 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                            >
                                                Choose file
                                            </label>
                                            <input
                                                id="cv"
                                                type="file"
                                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                onChange={(e) => setData('cv', e.target.files?.[0] ?? null)}
                                                className="sr-only"
                                            />
                                            <span className="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
                                                {data.cv ? data.cv.name : 'No file chosen'}
                                            </span>
                                            {data.cv && (
                                                <button
                                                    type="button"
                                                    onClick={() => setData('cv', null)}
                                                    className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {errors.cv && <p className="text-sm text-red-600 dark:text-red-400">{errors.cv}</p>}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => router.visit('/ats/jobs')}
                                        className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                    >
                                        {processing ? 'Scoring your CV...' : 'Test my CV · Get ATS Score'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Job Inactive Message */
                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="py-10">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                This job is no longer accepting applications
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Browse other open roles to test your CV with.
                            </p>
                            <button
                                onClick={() => router.visit('/ats/jobs')}
                                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                Browse jobs
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}