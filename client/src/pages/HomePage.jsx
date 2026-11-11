import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';
import BrandLogo from '../components/BrandLogo.jsx';
import {
  Package, BarChart3, Truck, Shield, Zap, Globe,
  ArrowRight, ChevronRight, Moon, Sun, Menu, X,
  CheckCircle, TrendingUp, AlertTriangle, Users,
  MapPin, FileText, Activity, Lock, RefreshCw, Database,
  Star, Play, Eye
} from 'lucide-react';

/* ─── animated counter ─────────────────────────────────── */
function Counter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
          else setCount(target);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── feature card ──────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay = 0 }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 dark:border-indigo-500/20 group-hover:border-indigo-400/50',
    green:  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/20 group-hover:border-emerald-400/50',
    amber:  'from-amber-500/20 to-amber-500/5 border-amber-500/20 dark:border-amber-500/20 group-hover:border-amber-400/50',
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/20 dark:border-blue-500/20 group-hover:border-blue-400/50',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 dark:border-purple-500/20 group-hover:border-purple-400/50',
    rose:   'from-rose-500/20 to-rose-500/5 border-rose-500/20 dark:border-rose-500/20 group-hover:border-rose-400/50',
  };
  const iconColors = {
    indigo: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10',
    green:  'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10',
    amber:  'text-amber-500 dark:text-amber-400 bg-amber-500/10',
    blue:   'text-blue-500 dark:text-blue-400 bg-blue-500/10',
    purple: 'text-purple-500 dark:text-purple-400 bg-purple-500/10',
    rose:   'text-rose-500 dark:text-rose-400 bg-rose-500/10',
  };
  return (
    <div
      className={`group relative rounded-xl border bg-gradient-to-br ${colors[color]} p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 cursor-default`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconColors[color]}`}>
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── workflow step ─────────────────────────────────────── */
function Step({ number, title, desc, icon: Icon }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-indigo-500/30">
          {number}
        </div>
        {number < 4 && <div className="w-px flex-1 bg-gradient-to-b from-indigo-600/40 to-transparent mt-2" />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" aria-hidden />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── role card ─────────────────────────────────────────── */
function RoleCard({ role, color, permissions, icon: Icon }) {
  const bg = {
    indigo: 'border-indigo-500/30 bg-indigo-500/5',
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
  };
  const badge = {
    indigo: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className={`rounded-xl border ${bg[color]} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${badge[color]}`}>
          <Icon className="w-4.5 h-4.5" aria-hidden />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge[color]}`}>{role}</span>
      </div>
      <ul className="space-y-1.5">
        {permissions.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── mock dashboard screenshot ────────────────────────── */
function MockDashboard() {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 dark:shadow-black/60 bg-gray-50 dark:bg-[#111]">
      {/* title bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 h-5 bg-gray-100 dark:bg-white/5 rounded text-[10px] flex items-center px-2 text-gray-400">
          localhost:5173/dashboard
        </div>
      </div>
      {/* app shell */}
      <div className="flex h-56">
        {/* sidebar */}
        <div className="w-14 bg-white dark:bg-[#111] border-r border-gray-100 dark:border-white/5 flex flex-col items-center py-3 gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          {[BarChart3, Package, Truck, FileText, Users].map((Icon, i) => (
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-indigo-500/15' : 'bg-transparent'}`}>
              <Icon className={`w-3.5 h-3.5 ${i === 0 ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'}`} />
            </div>
          ))}
        </div>
        {/* content */}
        <div className="flex-1 p-3 space-y-2 overflow-hidden">
          {/* stat cards */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Products', val: '247', color: 'text-indigo-500' },
              { label: 'In Stock', val: '12,840', color: 'text-emerald-500' },
              { label: 'Low Stock', val: '8', color: 'text-amber-500' },
              { label: 'Pending', val: '3', color: 'text-blue-500' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-white/5 rounded-lg p-2 border border-gray-100 dark:border-white/5">
                <p className="text-[8px] text-gray-400 leading-none">{s.label}</p>
                <p className={`text-sm font-bold mt-1 ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          {/* chart + alerts */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2 bg-white dark:bg-white/5 rounded-lg p-2 border border-gray-100 dark:border-white/5 h-24">
              <p className="text-[8px] text-gray-400 mb-2">Stock Movements: 30 Days</p>
              <div className="flex items-end gap-0.5 h-14">
                {[40,65,45,80,55,70,45,90,60,75,50,85,65,55,78,62,88,45,70,56,82,47,69,74,58,83,61,77,53,88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}%`,
                      background: i % 3 === 0 ? '#6366f1' : '#10b981',
                      opacity: 0.7,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-lg p-2 border border-gray-100 dark:border-white/5 h-24">
              <p className="text-[8px] text-gray-400 mb-2">Low Stock</p>
              {['Cement 50kg', 'Solar 300W', 'Generator Kit'].map((item, i) => (
                <div key={i} className="flex items-center justify-between mb-1">
                  <span className="text-[7px] text-gray-500 dark:text-gray-500 truncate max-w-[70%]">{item}</span>
                  <span className="text-[7px] font-bold text-amber-500">{[7, 3, 2][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Features', id: 'features' },
    { label: 'How it Works', id: 'how-it-works' },
    { label: 'Roles', id: 'roles' },
    { label: 'Stats', id: 'stats' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <style>{`
        .hero-grid {
          background-image: linear-gradient(rgba(148,101,20,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(148,101,20,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .dark .hero-grid {
          background-image: linear-gradient(rgba(196,154,70,0.08) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(196,154,70,0.08) 1px, transparent 1px);
        }
      `}</style>

      {/* ══ NAVBAR ══════════════════════════════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#080808]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <BrandLogo className="w-16 h-8" />
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-gray-900 dark:text-white">AGL Rwanda</span>
              <span className="text-xs text-gray-400 ml-1.5">WMIS</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-[#946514] hover:bg-[#80560f] rounded-lg transition-colors"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white dark:bg-[#111] border-t border-gray-100 dark:border-white/10 px-5 py-4 space-y-1">
            {navLinks.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg">
                {link.label}
              </button>
            ))}
            <div className="pt-2">
              <button onClick={() => navigate('/login')}
                className="w-full py-2.5 text-sm font-medium text-white bg-[#946514] rounded-lg">
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO ════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center hero-grid pt-14">
        <div className="relative max-w-6xl mx-auto px-5 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: text */}
            <div>
              {/* pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#946514]/30 bg-[#946514]/5 dark:bg-[#946514]/10 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#946514]" />
                <span className="text-xs font-medium text-[#80560f] dark:text-[#d7b76b]">Africa Global Logistics Rwanda</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white mb-6">
                Warehouse Management{' '}
                <span className="text-[#946514] dark:text-[#d7b76b]">Reimagined</span>{' '}
                for Africa
              </h1>

              <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
                Track stock, manage dispatch orders, generate reports, and keep your warehouse operation moving, all from one clear dashboard.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#946514] hover:bg-[#80560f] rounded-xl transition-all hover:-translate-y-0.5"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/15 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all hover:-translate-y-0.5"
                >
                  <Play className="w-3.5 h-3.5" /> See Features
                </button>
              </div>

              {/* trust bullets */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Role-based access', 'PDF & CSV exports', 'Real-time stock alerts', 'Activity audit logs'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" aria-hidden />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: mock dashboard */}
            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl blur-xl" aria-hidden />
              <MockDashboard />
              {/* floating cards */}
              <div className="absolute -left-10 top-10 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-xl p-3 shadow-xl flex items-center gap-2.5 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Stock In</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+240 units</p>
                </div>
              </div>
              <div className="absolute -right-6 bottom-14 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-xl p-3 shadow-xl flex items-center gap-2.5 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Low Stock Alert</p>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">8 products</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-50">
          <div className="w-5 h-8 rounded-full border border-gray-400 dark:border-gray-600 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
          </div>
          <span className="text-[10px] text-gray-400">Scroll</span>
        </div>
      </section>

      {/* ══ STATS BAND ══════════════════════════════════════ */}
      <section id="stats" className="border-y border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Access roles', value: 3, suffix: '', icon: Shield, color: 'text-indigo-500' },
            { label: 'Workflow steps', value: 4, suffix: '', icon: Truck, color: 'text-blue-500' },
            { label: 'Core capabilities', value: 9, suffix: '', icon: Package, color: 'text-emerald-500' },
            { label: 'Connected workspace', value: 1, suffix: '', icon: BarChart3, color: 'text-purple-500' },
          ].map((s) => (
            <div key={s.label} className="space-y-2">
              <s.icon className={`w-6 h-6 mx-auto ${s.color}`} aria-hidden />
              <div className={`text-3xl font-extrabold ${s.color}`}>
                <Counter target={s.value} suffix={s.suffix} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Everything you need</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Built for real warehouse operations
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xl mx-auto leading-relaxed">
              Every feature was designed for the actual day-to-day flow of a modern warehouse, from receiving goods to dispatching orders.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Package} color="indigo" title="Inventory Management"
              desc="Full product CRUD with SKU, categories, supplier links, and minimum stock levels. Soft-delete with full history preserved." delay={0} />
            <FeatureCard icon={TrendingUp} color="green" title="Real-Time Stock Tracking"
              desc="Every receipt and dispatch updates stock atomically. Automatic low-stock flags when quantity hits the minimum threshold." delay={50} />
            <FeatureCard icon={Truck} color="blue" title="Dispatch Order Workflow"
              desc="Store Keepers request, Managers approve or reject with reasons. Stock is deducted only on dispatch and never goes negative." delay={100} />
            <FeatureCard icon={FileText} color="purple" title="PDF & CSV Reports"
              desc="Generate stock, receipt, and dispatch reports filtered by date, category, and location. Export in one click." delay={150} />
            <FeatureCard icon={Shield} color="rose" title="Role-Based Access Control"
              desc="Administrator, Warehouse Manager, and Store Keeper roles with granular permissions enforced on every API endpoint." delay={200} />
            <FeatureCard icon={Activity} color="amber" title="Full Audit Trail"
              desc="Every login, creation, approval, and deletion is logged with the user, timestamp, and IP address. Never lose accountability." delay={250} />
            <FeatureCard icon={Lock} color="indigo" title="Enterprise Security"
              desc="JWT with refresh tokens, bcrypt hashing, rate limiting, account lockout, Helmet headers, and NoSQL injection protection." delay={300} />
            <FeatureCard icon={MapPin} color="green" title="Storage Locations"
              desc="Organize inventory by Zone → Rack → Bin. Visual occupancy indicators show capacity at a glance." delay={350} />
            <FeatureCard icon={RefreshCw} color="blue" title="Stock Movements Log"
              desc="Every receipt and dispatch creates a movement record with before/after balances, linking back to the source document." delay={400} />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Workflow</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                From receiving to dispatch in 4 steps
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-10 leading-relaxed">
                The entire warehouse cycle is covered: goods in, storage, approval, and goods out, with stock accuracy guaranteed at every step.
              </p>
              <div>
                <Step number={1} icon={Package} title="Record Goods Received"
                  desc="Store Keeper logs incoming goods with product, supplier, quantity, storage location, and reference note. Stock is updated instantly." />
                <Step number={2} icon={MapPin} title="Assign Storage Location"
                  desc="Each receipt is tied to a Zone–Rack–Bin location. The occupancy indicator shows available capacity in real time." />
                <Step number={3} icon={CheckCircle} title="Manager Reviews Dispatch"
                  desc="When a dispatch request arrives, the Warehouse Manager approves (stock is verified) or rejects with a written reason." />
                <Step number={4} icon={Truck} title="Dispatch & Track"
                  desc="On dispatch, stock is deducted atomically across locations. A movement record links every unit change to its order." />
              </div>
            </div>

            {/* visual timeline card */}
            <div className="relative hidden lg:flex flex-col gap-3">
              {[
                { label: 'Goods Received', sub: '240 bags of Portland Cement', tag: 'Receipt', color: 'emerald', Icon: Package },
                { label: 'Assigned to A-R2-B1', sub: 'Zone A · Rack R2 · Bin B1', tag: 'Located', color: 'blue', Icon: MapPin },
                { label: 'Dispatch Approved', sub: '30 bags for Kigali City Council', tag: 'Approved', color: 'indigo', Icon: CheckCircle },
                { label: 'Order Dispatched', sub: 'Stock updated: 240 → 210 bags', tag: 'Done', color: 'purple', Icon: Truck },
              ].map((item, i) => {
                const tagC = {
                  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
                  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
                };
                const iconC = {
                  emerald: 'text-emerald-500 bg-emerald-500/10',
                  blue: 'text-blue-500 bg-blue-500/10',
                  indigo: 'text-indigo-500 bg-indigo-500/10',
                  purple: 'text-purple-500 bg-purple-500/10',
                };
                return (
                  <div key={i} className="bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-4 flex items-center gap-4 hover:shadow-md dark:hover:shadow-black/40 transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconC[item.color]}`}>
                      <item.Icon className="w-5 h-5" aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate">{item.sub}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${tagC[item.color]}`}>{item.tag}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══ ROLES ════════════════════════════════════════════ */}
      <section id="roles" className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Access Control</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Three roles, clear boundaries</h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 max-w-xl mx-auto">
              Each role has precisely the access it needs, with permissions enforced on every API endpoint, not just the UI.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <RoleCard icon={Shield} role="Administrator" color="indigo" permissions={[
              'Full system access',
              'Manage users & roles',
              'Products, suppliers, clients',
              'Storage locations',
              'View all reports & logs',
              'Approve / reject dispatches',
            ]} />
            <RoleCard icon={Eye} role="Warehouse Manager" color="emerald" permissions={[
              'View stock & inventory',
              'Approve / reject dispatches',
              'Mark orders as dispatched',
              'Generate & export reports',
              'View low-stock alerts',
              'View receipts history',
            ]} />
            <RoleCard icon={Database} role="Store Keeper" color="amber" permissions={[
              'Search products & stock',
              'Record goods received',
              'Assign storage locations',
              'Create dispatch requests',
              'View stock overview',
              'View own receipts',
            ]} />
          </div>
        </div>
      </section>

      {/* ══ SECURITY SECTION ════════════════════════════════ */}
      <section className="py-24 bg-gray-50 dark:bg-white/[0.02] border-y border-gray-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* security badges */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Lock, title: 'JWT Auth', sub: '15-min access tokens + 7-day refresh', color: 'indigo' },
                { icon: Shield, title: 'bcrypt Hashing', sub: 'Cost factor 12, industry standard', color: 'emerald' },
                { icon: Activity, title: 'Rate Limiting', sub: '5 login attempts / 15 min per IP', color: 'amber' },
                { icon: Globe, title: 'CORS & Helmet', sub: 'Security headers on every response', color: 'blue' },
                { icon: Database, title: 'Mongo Sanitize', sub: 'NoSQL injection prevention built in', color: 'purple' },
                { icon: Zap, title: 'Account Lockout', sub: '15-min lock after 5 failed attempts', color: 'rose' },
              ].map(({ icon: Icon, title, sub, color }) => {
                const c = {
                  indigo: 'bg-indigo-500/8 border-indigo-500/20 text-indigo-500',
                  emerald: 'bg-emerald-500/8 border-emerald-500/20 text-emerald-500',
                  amber: 'bg-amber-500/8 border-amber-500/20 text-amber-500',
                  blue: 'bg-blue-500/8 border-blue-500/20 text-blue-500',
                  purple: 'bg-purple-500/8 border-purple-500/20 text-purple-500',
                  rose: 'bg-rose-500/8 border-rose-500/20 text-rose-500',
                };
                return (
                  <div key={title} className={`rounded-xl border ${c[color]} p-4 flex items-start gap-3`}>
                    <Icon className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" aria-hidden />
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* text */}
            <div>
              <span className="inline-block text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">Security First</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-5">
                Enterprise-grade protection, out of the box
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                WMIS was built with security as a first-class concern, not an afterthought. Every endpoint is protected, every password is hashed, every action is logged, and nothing sensitive ever reaches the client.
              </p>
              <ul className="space-y-2.5">
                {[
                  'Passwords are never stored, returned, or logged in plain text',
                  'Stack traces never exposed in production responses',
                  'Request body size capped at 10 KB to prevent DoS',
                  'Parameterized queries, no raw string interpolation',
                ].map(point => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden bg-[#102338]">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#c49a46]" aria-hidden />

        <div className="relative max-w-2xl mx-auto px-5 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 mb-6">
            <Star className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" aria-hidden />
            <span className="text-xs font-medium text-white">Warehouse workflows · One shared view</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white mb-5 leading-tight">
            Ready to take control of your warehouse?
          </h2>
          <p className="text-white/75 text-sm mb-10 leading-relaxed">
            Sign in with your organization account to manage goods received, stock, dispatches, and reports.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-[#102338] bg-white hover:bg-[#f4ead3] rounded-xl transition-all shadow-xl hover:-translate-y-0.5"
            >
              Sign In Now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white border border-white/30 rounded-xl hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              Explore Features <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* access note */}
          <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-sm">
            <Users className="w-4 h-4 text-indigo-200 flex-shrink-0" aria-hidden />
            <div className="text-left">
              <p className="text-xs font-medium text-white">Access for your warehouse team</p>
              <p className="text-xs text-indigo-300">Ask your system administrator for an account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 dark:border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">AGL Rwanda · WMIS</p>
                <p className="text-xs text-gray-400">Warehouse Management Information System v1.0</p>
              </div>
            </div>

            {/* links */}
            <div className="flex items-center gap-6">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Africa Global Logistics Rwanda.</p>
            <p>Warehouse operations, clearly in view.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
