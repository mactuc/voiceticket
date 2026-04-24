import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function SettingsView() {
  const { user, fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Fetch Jira connection status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetchWithAuth('/api/jira/status');
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.is_connected);
        }
      } catch (err) {
        console.error("Failed to fetch Jira status", err);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [fetchWithAuth]);

  // Fetch projects when connected
  useEffect(() => {
    if (isConnected) {
      setProjectsLoading(true);
      fetchWithAuth('/api/jira/projects')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed response');
        })
        .then(data => {
          if (data.status === 'success' && data.projects) {
            setProjects(data.projects);
          }
        })
        .catch(err => console.error('Failed to fetch projects', err))
        .finally(() => setProjectsLoading(false));
    } else {
      setProjects([]);
    }
  }, [isConnected, fetchWithAuth]);

  // Check if we just returned from OAuth flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'jira') {
      handleJiraCallback(code);
    }
  }, []);

  const handleJiraCallback = async (code) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/jira/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: window.location.origin + window.location.pathname // Must match exact redirect URI
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Jira');
      }

      setSuccess('Successfully connected to Jira!');
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectJira = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      const response = await fetchWithAuth(`/api/jira/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      const data = await response.json();
      // the backend should be using our exact redirect uri, but Atlassian requires it to match exactly what's registered.
      // We will redirect to the URL from the backend.
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDisconnectJira = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetchWithAuth(`/api/jira/connection`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to disconnect Jira');
      }
      setIsConnected(false);
      setSuccess('Successfully disconnected from Jira.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col items-center justify-center p-8 relative z-10">
      <div className="w-full max-w-2xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4 tracking-tight">Settings</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Configure your integrations and preferences.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-display font-semibold text-white mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[28px]">integration_instructions</span>
              Integrations
            </h3>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {success && (
              <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {success}
              </div>
            )}

            <div className="flex flex-col gap-4 p-5 bg-background-dark/50 rounded-2xl border border-slate-700/50 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <span className="material-symbols-outlined text-[24px]">dataset_linked</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-lg">Atlassian Jira</h4>
                    <p className="text-slate-400 text-sm">Sync your generated tickets directly to your Jira projects.</p>
                  </div>
                </div>
                
                {!statusLoading && (
                  isConnected ? (
                    <button
                      onClick={handleDisconnectJira}
                      disabled={loading}
                      className={`px-5 py-2.5 rounded-xl font-medium transition-all border ${
                        loading 
                          ? 'border-slate-700 text-slate-500 cursor-not-allowed' 
                          : 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500'
                      }`}
                    >
                      {loading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectJira}
                      disabled={loading}
                      className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                        loading 
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                          : 'bg-primary text-background-dark hover:bg-primary-light hover:shadow-lg hover:shadow-primary/20'
                      }`}
                    >
                      {loading ? 'Connecting...' : 'Connect to Jira'}
                    </button>
                  )
                )}
              </div>
              
              {/* Project Key Configuration */}
              <div className="mt-2 pt-4 border-t border-slate-700/50 flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-300">Default Jira Project</label>
                <div className="flex items-center gap-3">
                  {!isConnected ? (
                    <span className="text-sm text-slate-500 italic">Connect to Jira to select a project.</span>
                  ) : projectsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Loading projects...
                    </div>
                  ) : projects && projects.length > 0 ? (
                    <select
                      defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('jiraProjectKey') || '') : ''}
                      onChange={(e) => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('jiraProjectKey', e.target.value);
                        }
                      }}
                      className="bg-background-dark/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary max-w-[250px] truncate"
                    >
                      <option value="" disabled>Select a project...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.key}>
                          {p.name} ({p.key})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      defaultValue={typeof window !== 'undefined' ? (localStorage.getItem('jiraProjectKey') || 'VT') : 'VT'}
                      onChange={(e) => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('jiraProjectKey', e.target.value.toUpperCase());
                        }
                      }}
                      placeholder="e.g. VT, PROJ"
                      className="bg-background-dark/80 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary uppercase max-w-[200px]"
                    />
                  )}
                  {isConnected && !projectsLoading && (
                    <span className="text-xs text-slate-500">Tickets will be created in this project.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
