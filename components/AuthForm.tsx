import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../utils/storage';
import { Loader2, Lock, User as UserIcon, ArrowRight, Settings, Server } from 'lucide-react';
import { getBaseUrl } from '../utils/api';
import { Capacitor } from '@capacitor/core';
import myLogo from "../assets/logo.png"; // 依據你的實際路徑修改

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
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    // If on mobile app and NO url is saved, force open settings
    // because localhost won't work.
    if (native && !localStorage.getItem('lexideck_server_url')) {
        setShowServerConfig(true);
    }
    
    setServerUrl(getBaseUrl() || 'http://192.168.1.XXX:3001');
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

    // Validate format roughly
    if (!cleaned.includes(':') || cleaned.split(':').length < 2) {
        alert("Warning: URL usually requires a port (e.g., :3001)");
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
      // Auto open settings on connection failure in Native mode
      if (isNative && err.message.includes('Could not connect')) {
         setTimeout(() => setShowServerConfig(true), 1500);
      }
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
             <h2 className="text-xl font-bold text-slate-800">伺服器連線設定</h2>
             <p className="text-sm text-slate-500 mt-2">
               {isNative 
                 ? "Since you are on the Mobile App, you must connect to your PC's IP address."
                 : "輸入顯示在你電腦提示字元(cmd)上的 IP 位址。"
               }
             </p>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">伺服器IP</label>
               <input 
                 type="url" 
                 value={serverUrl}
                 onChange={e => setServerUrl(e.target.value)}
                 className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
                 placeholder="http://192.168.1.XXX:3001"
               />
               <p className="text-xs text-slate-400 mt-1 ml-1">
                 檢查你的電腦的命令提示字元(cmd)，應該會有一行是  <b>Network: http://...</b>
               </p>
             </div>
             
             <button 
               onClick={saveServerUrl}
               className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
             >
               儲存 & 連線
             </button>
             
             {/* Only allow cancel if we already have a valid URL stored, otherwise forcing setup prevents broken state */}
             {localStorage.getItem('lexideck_server_url') && (
               <button 
                 onClick={() => setShowServerConfig(false)}
                 className="w-full py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
               >
                 Cancel
               </button>
             )}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <img 
            src={myLogo} 
            alt="App Logo" 
            className="w-full h-full object-cover rounded-2xl shadow-xl" 
          />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">LexiDeck</h1>
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
            登入
          </button>
          <button 
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isRegister ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            註冊
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">使用者名稱</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="輸入使用者名稱"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">密碼</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                placeholder="輸入密碼"
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
                {isRegister ? '創建帳號' : '登入'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
           <p className="text-xs text-slate-400 truncate px-4">
             Target: <span className="font-mono text-slate-600">{getBaseUrl() || '(Not Configured)'}</span>
           </p>
        </div>
      </div>
    </div>
  );
};