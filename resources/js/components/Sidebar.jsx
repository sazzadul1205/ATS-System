import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User,
} from 'lucide-react';

export default function Sidebar() {
  const { url } = usePage();
  const [isOpen, setIsOpen] = useState(false);

  // Theme toggle (simple fallback)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const isActive = (href) => url.startsWith(href);

  const navigation = [
    { name: 'Dashboard', href: route('ats.dashboard'), icon: LayoutDashboard },
    { name: 'Applications', href: route('ats.applications.index'), icon: FileText },
    { name: 'Jobs', href: route('ats.jobs.index'), icon: Briefcase },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
                    fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0 lg:static lg:z-auto
                `}
      >
        <div className="flex h-full flex-col">
          {/* Logo / Brand */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                ATS
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                System
              </span>
            </Link>
            <button
              onClick={closeSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                                        flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                        ${active
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                                    `}
                  onClick={closeSidebar}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${active
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 dark:text-gray-400'
                      }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section: User + Theme toggle */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    admin@ats.com
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            {/* Optional logout button */}
            <button className="mt-3 flex w-full items-center rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <LogOut className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}