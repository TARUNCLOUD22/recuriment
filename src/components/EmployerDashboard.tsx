import React, { useState } from 'react';
import OnboardingOverlay from './OnboardingOverlay';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SalaryBenchmark from './SalaryBenchmark';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  DollarSign, 
  FileText, 
  Sparkles, 
  Loader2, 
  Save, 
  Eye,
  Users,
  Briefcase,
  CheckCircle,
  Plus,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

interface EmployerDashboardProps {
  onBack: () => void;
  onAddJob: (job: Omit<Job, 'id' | 'posted'>) => void;
}

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  requirements: string[];
  description: string;
  type: string;
  posted: string;
  status: 'active' | 'draft' | 'closed';
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  posted: string;
  description: string;
  requirements: string[];
  tags: string[];
}

const EmployerDashboard: React.FC<EmployerDashboardProps> = ({ onBack, onAddJob }) => {
  const categories = [
    'Actuarial & Underwriting',
    'Data Science & Data Engineering', 
    'Product Management',
    'Catastrophe Modeling',
    'Machine Learning & Predictive Modeling'
  ];

  const [activeTab, setActiveTab] = useState('post-job');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('employer-onboarding-completed');
  });
  const [salaryRating, setSalaryRating] = useState<any>(null);

  const onboardingSteps = [
    {
      id: 'post-job',
      target: '[data-onboarding="post-job"]',
      title: 'Post New Job',
      description: 'Create attractive job postings to find the perfect candidates for your company.',
      position: 'left' as const
    },
    {
      id: 'ai-generate',
      target: '[data-onboarding="ai-generate"]',
      title: 'AI Job Description',
      description: 'Use AI to generate professional job descriptions based on your requirements.',
      position: 'left' as const
    },
    {
      id: 'manage-jobs',
      target: '[data-onboarding="manage-jobs"]',
      title: 'Manage Jobs',
      description: 'View and manage all your job postings, track applications, and monitor performance.',
      position: 'left' as const
    }
  ];

  const handleOnboardingComplete = () => {
    localStorage.setItem('employer-onboarding-completed', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('employer-onboarding-completed', 'true');
    setShowOnboarding(false);
  };
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    requirements: '',
    description: '',
    type: 'Full-time',
    category: 'Actuarial & Underwriting'
  });
  const [postedJobs, setPostedJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      salary: '$120k - $160k',
      requirements: ['React', 'TypeScript', 'Node.js', '5+ years experience'],
      description: 'We are looking for a talented Senior Frontend Developer...',
      type: 'Full-time',
      posted: '2 days ago',
      status: 'active'
    }
  ]);

  const genAI = new GoogleGenerativeAI('AIzaSyDcESYR34GEMPJlOT_3ByoFHvY7VPPqly0');

  const handleInputChange = (field: string, value: string) => {
    setJobForm(prev => ({ ...prev, [field]: value }));
  };

  const generateJobDescription = async () => {
    if (!jobForm.title || !jobForm.company) {
      alert('Please fill in at least the job title and company name to generate a description.');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `
        Generate a comprehensive and professional job description for the following position:

        Job Title: ${jobForm.title}
        Company: ${jobForm.company}
        Location: ${jobForm.location || 'Not specified'}
        Salary Range: ${jobForm.salary || 'Competitive'}
        Requirements: ${jobForm.requirements || 'Standard requirements for this role'}

        Please create a detailed job description that includes:
        1. A compelling overview of the role and company
        2. Key responsibilities and duties
        3. Required qualifications and skills
        4. Preferred qualifications
        5. Benefits and what makes this opportunity attractive
        6. Company culture highlights

        Make it professional, engaging, and tailored to attract top talent. The description should be 3-4 paragraphs long and highlight why candidates would want to work for this company.
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Add timeout and better error handling
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        )
      ]);
      
      const response = await result.response;
      let generatedDescription = response.text();
      
      // Clean up the response text
      generatedDescription = generatedDescription.replace(/^\*\*.*?\*\*\s*/gm, '');
      generatedDescription = generatedDescription.replace(/^#+\s*/gm, '');
      generatedDescription = generatedDescription.trim();

      setJobForm(prev => ({ ...prev, description: generatedDescription }));
    } catch (error) {
      console.error('Error generating job description:', error);
      
      let errorMessage = 'Failed to generate job description. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again with a shorter prompt.';
        } else if (error.message.includes('503') || error.message.includes('overloaded')) {
          errorMessage = 'The AI service is currently busy. Please try again in a few moments.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          errorMessage = 'API quota exceeded. Please check your API key limits.';
        } else if (error.message.includes('invalid') || error.message.includes('key')) {
          errorMessage = 'Invalid API key. Please check your configuration.';
        }
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostJob = () => {
    if (!jobForm.title || !jobForm.company || !jobForm.location || !jobForm.description) {
      alert('Please fill in all required fields.');
      return;
    }

    // Add job to global state for job seekers to see
    const jobForJobSeekers: Omit<Job, 'id' | 'posted'> = {
      title: jobForm.title,
      company: jobForm.company,
      location: jobForm.location,
      type: jobForm.type,
      salary: jobForm.salary,
      description: jobForm.description,
      requirements: jobForm.requirements.split(',').map(req => req.trim()).filter(req => req),
      tags: [
        jobForm.type,
        jobForm.location.includes('Remote') ? 'Remote' : 'On-site',
        jobForm.salary.includes('$') ? 'Competitive Salary' : 'Salary Negotiable'
      ].filter(tag => tag)
    };
    
    // Add to global jobs state
    onAddJob(jobForJobSeekers);

    const newJob: JobPosting = {
      id: Date.now().toString(),
      title: jobForm.title,
      company: jobForm.company,
      location: jobForm.location,
      salary: jobForm.salary,
      requirements: jobForm.requirements.split(',').map(req => req.trim()).filter(req => req),
      description: jobForm.description,
      type: jobForm.type,
      posted: 'Just now',
      status: 'active'
    };

    setPostedJobs(prev => [newJob, ...prev]);
    setJobForm({
      title: '',
      company: '',
      location: '',
      salary: '',
      requirements: '',
      description: '',
      type: 'Full-time',
      category: 'Actuarial & Underwriting'
    });
    alert('Job posted successfully!');
    setActiveTab('manage-jobs');
  };

  const renderPostJob = () => (
    <div className="max-w-4xl mx-auto px-4 lg:px-0">
      <div className="mb-8">
        <div className="text-center">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Post a New Job</h1>
          <p className="text-sm lg:text-base text-gray-600">Create an attractive job posting to find the perfect candidate</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={jobForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Senior Frontend Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={jobForm.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., TechCorp Inc."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={jobForm.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., San Francisco, CA or Remote"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={jobForm.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expertise Category *
            </label>
            <select
              value={jobForm.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salary Range
            </label>
            <input
              type="text"
              value={jobForm.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., $80k - $120k or Competitive"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements & Skills
            </label>
            <textarea
              rows={3}
              value={jobForm.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., React, TypeScript, 5+ years experience, Bachelor's degree (separate with commas)"
            />
          </div>

          {/* Job Description with AI Generation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Job Description *
              </label>
              <button
                data-onboarding="ai-generate"
                onClick={generateJobDescription}
                disabled={isGenerating || !jobForm.title || !jobForm.company}
                className="px-3 py-2 lg:px-4 lg:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all flex items-center space-x-2 text-xs lg:text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                    <span className="sm:hidden">Gen...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Generate</span>
                    <span className="sm:hidden">AI</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={6}
              value={jobForm.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Describe the role, responsibilities, company culture, and what makes this opportunity attractive..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Tip: Use the AI Generate button to create a professional job description based on your inputs
            </p>
          </div>

          {/* Salary Benchmark */}
          {jobForm.salary && jobForm.title && (
            <div>
              <SalaryBenchmark
                jobTitle={jobForm.title}
                location={jobForm.location}
                salary={jobForm.salary}
                jobType={jobForm.type}
                requirements={jobForm.requirements}
                onRatingReceived={setSalaryRating}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="px-4 py-2 lg:px-6 lg:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm lg:text-base"
            >
              Back to Home
            </button>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => {
                  // Save as draft functionality
                  alert('Job saved as draft!');
                }}
                className="px-4 py-2 lg:px-6 lg:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <Save className="w-5 h-5" />
                <span className="hidden sm:inline">Save Draft</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={handlePostJob}
                className="px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center space-x-2 text-sm lg:text-base"
              >
                <Briefcase className="w-5 h-5" />
                <span>Post Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderManageJobs = () => (
    <div className="max-w-6xl mx-auto px-4 lg:px-0">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">Manage Job Postings</h1>
            <p className="text-sm lg:text-base text-gray-600">View and manage your active job listings</p>
          </div>
          <button
            onClick={() => setActiveTab('post-job')}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2 text-sm lg:text-base"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Post New Job</span>
            <span className="sm:hidden">Post Job</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {postedJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 lg:p-6">
            {/* Salary Rating Display */}
            {salaryRating && (
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Salary Rating</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-blue-600">{salaryRating.score}/10</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {salaryRating.score >= 8 ? 'Excellent' : 
                       salaryRating.score >= 6 ? 'Competitive' : 
                       salaryRating.score >= 4 ? 'Average' : 'Below Market'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 pr-2">{job.title}</h3>
                <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-sm lg:text-base text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-4 h-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'active' ? 'bg-green-100 text-green-800' :
                    job.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">Posted {job.posted}</span>
                </div>
              </div>
              <div className="flex space-x-1 lg:space-x-2">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <FileText className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm lg:text-base text-gray-700 line-clamp-3">{job.description}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.requirements.map((req, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {req}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>24 Applications</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>156 Views</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Edit
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base">
                  <span className="hidden sm:inline">View Applications</span>
                  <span className="sm:hidden">Applications</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {showOnboarding && (
        <OnboardingOverlay
          steps={onboardingSteps}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
            
            <button
              onClick={onBack}
              className="hidden lg:flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="text-lg lg:text-xl font-bold text-gray-800">Employer Dashboard</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                data-onboarding="post-job"
                onClick={() => setActiveTab('post-job')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'post-job' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Post Job
              </button>
              <button
                data-onboarding="manage-jobs"
                onClick={() => setActiveTab('manage-jobs')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'manage-jobs' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                Manage Jobs
              </button>
            </div>
          </div>
          
          {/* Mobile Navigation Overlay */}
          {isMobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="fixed top-0 left-0 right-0 bg-white z-50 p-4 shadow-lg lg:hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Navigation</h3>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={onBack}
                    className="w-full flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Home</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('post-job');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'post-job' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Post Job</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('manage-jobs');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'manage-jobs' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    <span>Manage Jobs</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="h-screen flex bg-gray-50">
        {activeTab === 'post-job' && renderPostJob()}
        {activeTab === 'manage-jobs' && renderManageJobs()}
      </main>
    </div>
  );
};

export default EmployerDashboard;
