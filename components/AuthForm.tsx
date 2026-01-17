import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../utils/storage';
import { Loader2, Lock, User as UserIcon, ArrowRight, Settings, Server } from 'lucide-react';
import { getBaseUrl } from '../utils/api';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Server Config State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getBaseUrl());

  useEffect(() => {
    setServerUrl(getBaseUrl());
  }, []);

  const saveServerUrl = () => {
    // 1. Trim whitespace/newlines (Fixes "Failed to parse URL" error)
    let cleaned = serverUrl.trim();
    
    // 2. Remove trailing slashes
    cleaned = cleaned.replace(/\/+$/, "");
    
    // 3. Auto-add http:// if missing
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `http://${cleaned}`;
    }

    localStorage.setItem('lexideck_server_url', cleaned);
    setShowServerConfig(false);
    
    // Force reload to ensure API instance picks up new URL
    window.location.reload(); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isRegister) {
        user = await StorageService.register(username, password);
      } else {
        user = await StorageService.login(username, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Connection failed. Check Server URL.');
    } finally {
      setLoading(false);
    }
  };

  if (showServerConfig) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200">
           <div className="text-center mb-6">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
               <Server className="w-6 h-6" />
             </div>
             <h2 className="text-xl font-bold text-slate-800">Server Configuration</h2>
             <p className="text-sm text-slate-500 mt-2">
               Enter the IP address displayed on your computer's terminal.
             </p>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Server URL</label>
               <input 
                 type="url" 
                 value={serverUrl}
                 onChange={e => setServerUrl(e.target.value)}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                 placeholder="http://192.168.1.X:3001"
               />
               <p className="text-xs text-slate-400 mt-1 ml-1">
                 Ensure you use the <b>Node.js Port (3001)</b>.
               </p>
             </div>
             
             <button 
               onClick={saveServerUrl}
               className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
             >
               Save & Connect
             </button>
             <button 
               onClick={() => setShowServerConfig(false)}
               className="w-full py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
             >
               Cancel
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl mb-4">L</div>
        <h1 className="text-3xl font-extrabold text-slate-800">LexiDeck <span className="text-brand-600">Local</span></h1>
        <p className="text-slate-500 mt-2">Your vocabulary, on your network.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 relative">
        <button 
          onClick={() => setShowServerConfig(true)}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-brand-600 transition-colors"
          title="Server Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Enter username"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium break-words">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Connect'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
           <p className="text-xs text-slate-400">
             Connecting to: <span className="font-mono text-slate-600">{getBaseUrl()}</span>
           </p>
        </div>
      </div>
    </div>
  );
};