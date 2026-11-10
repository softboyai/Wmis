import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Building2, Users, MapPin, ReceiptText,
  Truck, BarChart3, FileText, ClipboardList, ChevronLeft, ChevronRight,
  Sun, Moon, Search, LogOut, User, Menu, X, Keyboard,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import CommandPalette from '../components/CommandPalette.jsx';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrator', 'manager', 'storekeeper'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['administrator', 'manager', 'storekeeper'] },
  { to: '/suppliers', label: 'Suppliers', icon: Building2, roles: ['administrator'] },
  { to: '/clients', label: 'Clients', icon: Users, roles: ['administrator'] },
  { to: '/locations', label: 'Locations', icon: MapPin, roles: ['administrator'] },
  { to: '/receipts', label: 'Goods Received', icon: ReceiptText, roles: ['administrator', 'manager', 'storekeeper'] },
  { to: '/dispatches', label: 'Dispatch Orders', icon: Truck, roles: ['administrator', 'manager', 'storekeeper'] },
  { to: '/stock', label: 'Stock', icon: BarChart3, roles: ['administrator', 'manager', 'storekeeper'] },
  { to: '/reports', label: 'Reports', icon: FileText, roles: ['administrator', 'manager'] },
  { to: '/logs', label: 'Activity Logs', icon: ClipboardList, roles: ['administrator'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['administrator'] },
];

function Breadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          <span className={i === parts.length - 1 ? 'text-gray-800 dark:text-gray-200 font-medium' : ''}>
            {part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ')}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user?.role));

  // Keyboard shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimer;
    const handleKey = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === '/') { e.preventDefault(); setPaletteOpen(true); return; }
      if (e.key === '?') { setShortcutsOpen((s) => !s); return; }
      if (e.key === 'Escape') { setUserMenuOpen(false); return; }
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }
      if (gPressed) {
        if (e.key === 'd' || e.key === 'D') navigate('/dashboard');
        if (e.key === 'p' || e.key === 'P') navigate('/products');
        gPressed = false;
        clearTimeout(gTimer);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const roleLabel = { administrator: 'Administrator', manager: 'Warehouse Manager', storekeeper: 'Store Keeper' }[user?.role] || user?.role;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-surface-0 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-surface-1 border-r border-gray-100 dark:border-border transition-all duration-200
          ${collapsed ? 'w-14' : 'w-56'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-gray-100 dark:border-border flex-shrink-0`}>
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-white" aria-hidden />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">AGL Rwanda</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate">WMIS v1.0</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
              }
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex px-2 pb-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="sidebar-item w-full"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-surface-1 border-b border-gray-100 dark:border-border flex-shrink-0">
          <button
            className="lg:hidden btn-ghost p-1.5"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-surface-2 border border-gray-200 dark:border-border rounded hover:border-gray-300 dark:hover:border-border-strong transition-colors"
            aria-label="Open command palette"
          >
            <Search className="w-3.5 h-3.5" aria-hidden />
            <span>Search...</span>
            <kbd className="text-[10px] bg-white dark:bg-surface-3 border border-gray-200 dark:border-border rounded px-1">⌘K</kbd>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="btn-ghost p-1.5"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Shortcuts help */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="hidden lg:flex btn-ghost p-1.5"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((s) => !s)}
              className="flex items-center gap-2 btn-ghost px-2 py-1.5"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent">
                  {user?.fullName?.[0]?.toUpperCase()}
                </span>
              </div>
              <span className="hidden md:block text-xs text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                {user?.fullName}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-surface-2 border border-gray-100 dark:border-border rounded-lg shadow-md py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-border">
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{user?.email}</p>
                  <p className="text-xs text-accent mt-0.5">{roleLabel}</p>
                </div>
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                  className="sidebar-item w-full text-left px-3 py-2 rounded-none"
                >
                  <User className="w-3.5 h-3.5" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="sidebar-item w-full text-left px-3 py-2 rounded-none text-danger hover:text-danger"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Shortcuts dialog */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShortcutsOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-surface-1 rounded-lg shadow-overlay border border-gray-100 dark:border-border p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
              <button onClick={() => setShortcutsOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
            </div>
            {[
              ['⌘K / /', 'Open command palette'],
              ['G D', 'Go to Dashboard'],
              ['G P', 'Go to Products'],
              ['Esc', 'Close dialogs'],
              ['?', 'Show shortcuts'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <kbd className="bg-gray-100 dark:bg-surface-3 border border-gray-200 dark:border-border px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
