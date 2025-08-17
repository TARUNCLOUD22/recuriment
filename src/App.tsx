import React, { useState } from 'react';
import { useEffect } from 'react';
import LandingPage from './components/LandingPage';
import JobSeekerDashboard from './components/JobSeekerDashboard';
import EmployerDashboard from './components/EmployerDashboard';
import { supabase, jobService, Job as SupabaseJob } from './lib/supabase';

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

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'job-seeker' | 'employer'>('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([
  ]);

  // Initialize and load jobs
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load jobs
        await loadJobs();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadJobs = async () => {
    try {
      const supabaseJobs = await jobService.getActiveJobs();
      const formattedJobs: Job[] = supabaseJobs.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        salary: job.salary,
        posted: formatDate(job.created_at),
        description: job.description,
        requirements: job.requirements,
        tags: job.tags
      }));
      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const addJob = (newJob: Omit<Job, 'id' | 'posted'>) => {
    // Reload jobs after adding
    loadJobs();
  };

  const handleGetJob = () => {
    setCurrentView('job-seeker');
  };

  const handlePostJob = () => {
    setCurrentView('employer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
      {currentView === 'landing' && (
        <LandingPage 
          onGetJob={handleGetJob}
          onPostJob={handlePostJob}
        />
      )}
      {currentView === 'job-seeker' && (
        <JobSeekerDashboard 
          onBack={() => setCurrentView('landing')} 
          jobs={jobs}
        />
      )}
      {currentView === 'employer' && (
        <EmployerDashboard 
          onBack={() => setCurrentView('landing')} 
          onAddJob={addJob}
          onJobCreated={loadJobs}
        />
      )}
      </div>
    </>
  );
}

export default App;