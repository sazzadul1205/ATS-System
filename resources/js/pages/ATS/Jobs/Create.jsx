import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Briefcase, Plus, X, Save, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function CreateJob() {
    const { props } = usePage();
    const { categories, locations, jobTypes, experienceLevels } = props;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        job_type: 'full-time',
        salary_min: '',
        salary_max: '',
        is_salary_negotiable: false,
        as_per_companies_policy: false,
        category_id: categories[0]?.id || '',
        experience_level: 'mid-level',
        education_requirement: '',
        education_details: '',
        benefits: [],
        skills: [],
        responsibilities: [],
        keywords: [],
        application_deadline: '',
        publish_at: '',
        is_active: true,
        required_facebook_link: false,
        required_linkedin_link: false,
        location_ids: [],
    });

    const [benefitInput, setBenefitInput] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [responsibilityInput, setResponsibilityInput] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post('/ats/jobs', formData, {
            onError: (errors) => setErrors(errors),
            onSuccess: () => {
                // Flash message will be shown by Inertia
            },
        });
    };

    const addToArray = (field, value, setInput) => {
        if (!value.trim()) return;
        setFormData((prev) => ({
            ...prev,
            [field]: [...prev[field], value.trim()],
        }));
        setInput('');
    };

    const removeFromArray = (field, index) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const handleKeyDown = (e, field, value, setInput) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addToArray(field, value, setInput);
        }
    };

    const toggleLocation = (locationId) => {
        setFormData((prev) => ({
            ...prev,
            location_ids: prev.location_ids.includes(locationId)
                ? prev.location_ids.filter((id) => id !== locationId)
                : [...prev.location_ids, locationId],
        }));
    };

    return (
        <AppLayout>
            <Head title="Create New Job" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit('/ats/jobs')}
                            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
                                <Briefcase className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                Create New Job
                            </h2>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Fill in the details to create a new job posting
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Job Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`mt-1 w-full rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                    placeholder="e.g., Senior Software Engineer"
                                />
                                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Category *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className={`mt-1 w-full rounded-md border ${errors.category_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id}</p>}
                            </div>

                            {/* Job Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Job Type *
                                </label>
                                <select
                                    value={formData.job_type}
                                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                    className={`mt-1 w-full rounded-md border ${errors.job_type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                >
                                    {jobTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                                {errors.job_type && <p className="mt-1 text-xs text-red-500">{errors.job_type}</p>}
                            </div>

                            {/* Experience Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Experience Level *
                                </label>
                                <select
                                    value={formData.experience_level}
                                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                                    className={`mt-1 w-full rounded-md border ${errors.experience_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                >
                                    {experienceLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                                {errors.experience_level && <p className="mt-1 text-xs text-red-500">{errors.experience_level}</p>}
                            </div>

                            {/* Locations */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Locations
                                </label>
                                <div className="mt-2 space-y-2">
                                    {locations.map((loc) => (
                                        <label key={loc.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.location_ids.includes(loc.id)}
                                                onChange={() => toggleLocation(loc.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            {loc.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Job Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className={`mt-1 w-full rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                placeholder="Describe the role, responsibilities, and company culture..."
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                        </div>

                        {/* Requirements */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Requirements *
                            </label>
                            <textarea
                                value={formData.requirements}
                                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                rows={4}
                                className={`mt-1 w-full rounded-md border ${errors.requirements ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white`}
                                placeholder="List the required qualifications, skills, and experience..."
                            />
                            {errors.requirements && <p className="mt-1 text-xs text-red-500">{errors.requirements}</p>}
                        </div>
                    </div>

                    {/* Salary & Benefits */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Salary & Benefits
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Min Salary
                                </label>
                                <input
                                    type="number"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Max Salary
                                </label>
                                <input
                                    type="number"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_salary_negotiable}
                                        onChange={(e) => setFormData({ ...formData, is_salary_negotiable: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Negotiable
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.as_per_companies_policy}
                                        onChange={(e) => setFormData({ ...formData, as_per_companies_policy: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    As per policy
                                </label>
                            </div>
                        </div>

                        {/* Benefits */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Benefits
                            </label>
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={benefitInput}
                                    onChange={(e) => setBenefitInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'benefits', benefitInput, setBenefitInput)}
                                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="Add a benefit and press Enter"
                                />
                                <button
                                    type="button"
                                    onClick={() => addToArray('benefits', benefitInput, setBenefitInput)}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.benefits.map((benefit, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                    >
                                        {benefit}
                                        <button
                                            type="button"
                                            onClick={() => removeFromArray('benefits', index)}
                                            className="hover:text-indigo-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Skills & Keywords */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Skills & Keywords
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Skills */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Required Skills
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'skills', skillInput, setSkillInput)}
                                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                        placeholder="Add a skill and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addToArray('skills', skillInput, setSkillInput)}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                                        >
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('skills', index)}
                                                className="hover:text-emerald-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Keywords */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Keywords (for ATS)
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'keywords', keywordInput, setKeywordInput)}
                                        className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                        placeholder="Add a keyword and press Enter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addToArray('keywords', keywordInput, setKeywordInput)}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {formData.keywords.map((keyword, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                                        >
                                            {keyword}
                                            <button
                                                type="button"
                                                onClick={() => removeFromArray('keywords', index)}
                                                className="hover:text-amber-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Settings */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Additional Settings
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Education */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Education Requirement
                                </label>
                                <input
                                    type="text"
                                    value={formData.education_requirement}
                                    onChange={(e) => setFormData({ ...formData, education_requirement: e.target.value })}
                                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="e.g., Bachelor's degree in Computer Science"
                                />
                            </div>

                            {/* Application Deadline */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Application Deadline
                                </label>
                                <input
                                    type="date"
                                    value={formData.application_deadline}
                                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Publish Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Publish Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.publish_at}
                                    onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Active (visible to applicants)
                                </label>
                            </div>

                            {/* Social Links Requirements */}
                            <div className="md:col-span-2 flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.required_facebook_link}
                                        onChange={(e) => setFormData({ ...formData, required_facebook_link: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Require Facebook Profile
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.required_linkedin_link}
                                        onChange={(e) => setFormData({ ...formData, required_linkedin_link: e.target.checked })}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Require LinkedIn Profile
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.visit('/ats/jobs')}
                            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                        >
                            <Save className="h-4 w-4" />
                            Create Job Posting
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
