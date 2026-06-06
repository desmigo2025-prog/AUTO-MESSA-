import { useState } from 'react';
import { MessageSquare, LayoutDashboard, CalendarClock, Settings, Link2, Sparkles, Megaphone, FileText, Menu, X } from 'lucide-react';
import DashboardView from './components/DashboardView';
import AiGeneratorView from './components/AiGeneratorView';
import ConnectionView from './components/ConnectionView';
import CampaignsView from './components/CampaignsView';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'generator', label: 'AI Generator', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-5 h-5" /> },
    { id: 'templates', label: 'Templates', icon: <FileText className="w-5 h-5" /> },
    { id: 'scheduled', label: 'Scheduled', icon: <CalendarClock className="w-5 h-5" /> },
    { id: 'connection', label: 'WhatsApp', icon: <Link2 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <DashboardView />;
      case 'generator': return <AiGeneratorView />;
      case 'connection': return <ConnectionView />;
      case 'campaigns': return <CampaignsView />;
      default: return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
          <p>This module is under construction.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar navigation */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col shrink-0`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-xl text-white">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight whitespace-nowrap">AutoMessage</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                currentTab === item.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 m-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-center text-gray-500 font-medium">AutoMessage v1.0.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">
              {navItems.find(i => i.id === currentTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center text-emerald-700 font-bold overflow-hidden">
              <span className="text-sm">US</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
