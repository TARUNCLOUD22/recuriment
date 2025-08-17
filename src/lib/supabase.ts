import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  tags: string[];
  posted_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'draft' | 'closed';
}

export interface JobInsert {
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  requirements?: string[];
  tags?: string[];
  posted_by?: string; // email
  poster_name?: string;
  status?: 'active' | 'draft' | 'closed';
}

// Job service functions
export const jobService = {
  // Get all active jobs
  async getActiveJobs(): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    return data || [];
  },

  // Get jobs by user
  async getUserJobs(email: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('posted_by', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user jobs:', error);
      throw error;
    }

    return data || [];
  },

  // Create a new job
  async createJob(job: JobInsert, posterEmail: string, posterName: string): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...job,
        posted_by: posterEmail,
        poster_name: posterName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      throw error;
    }

    return data;
  },

  // Update a job
  async updateJob(id: string, updates: Partial<JobInsert>): Promise<Job> {
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      throw error;
    }

    return data;
  },

  // Delete a job
  async deleteJob(id: string): Promise<void> {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  },

  // Search jobs
  async searchJobs(query: string): Promise<Job[]> {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }

    return data || [];
  }
};
