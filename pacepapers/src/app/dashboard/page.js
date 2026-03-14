"use client"

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Eye, EyeOff,
    Users, Activity, CreditCard, Network,
    RefreshCw, Smartphone, Hash,
    Wallet, Wifi, ArrowUpRight, ArrowDownRight, Clock, Ticket, Tag, Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CardSkeleton, Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/Badge'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { GlobalFilters } from '@/components/GlobalFilters'
import { dashboardService } from '@/services/dashboard'

const DashboardSkeleton = () => (
    <div className="space-y-6 font-figtree animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10 sm:px-0">
        {/* Title Section Skeleton */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-pace-border pb-6">
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Skeleton */}
            <div className="lg:col-span-8 bg-card-bg border border-pace-border rounded-xl p-3 sm:p-6 shadow-sm">
                <div className="flex justify-between mb-8">
                    <div>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-3 w-64" />
                    </div>
                </div>
                <Skeleton className="h-[250px] sm:h-[320px] w-full rounded-lg" />
            </div>

            {/* List Skeleton */}
            <div className="lg:col-span-4 bg-card-bg border border-pace-border rounded-xl p-5 shadow-sm">
                <Skeleton className="h-6 w-32 mb-6" />
                <div className="space-y-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-pace-border last:border-0">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <div>
                                    <Skeleton className="h-4 w-24 mb-1" />
                                    <Skeleton className="h-2 w-16" />
                                </div>
                            </div>
                            <div className="text-right">
                                <Skeleton className="h-4 w-12 mb-1 ml-auto" />
                                <Skeleton className="h-3 w-16 rounded-full ml-auto" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

function DashboardContent() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isWidgetsLoading, setIsWidgetsLoading] = useState(true)
    const [isChartsLoading, setIsChartsLoading] = useState(true)
    const [isTxLoading, setIsTxLoading] = useState(true)
    const [isRoutersLoading, setIsRoutersLoading] = useState(true)

    const [widgets, setWidgets] = useState(null)
    const [charts, setCharts] = useState([])
    const [transactions, setTransactions] = useState([])
    const [routers, setRouters] = useState([])

    const [txPagination, setTxPagination] = useState({ page: 1, hasMore: false })
    const [routerPagination, setRouterPagination] = useState({ page: 1, hasMore: false })

    const [isRevenueBlurred, setIsRevenueBlurred] = useState(true)
    const [filters, setFilters] = useState({ router: 'All Routers', dateRange: 'Today' })

    // Voucher Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPlansLoading, setIsPlansLoading] = useState(false)
    const [plans, setPlans] = useState([])
    const [modalRouters, setModalRouters] = useState([])
    const [formData, setFormData] = useState({
        router_name: '',
        plan: '',
        count: 1
    })

    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams?.get('token') || null

    // Helper to parse date ranges
    const parseDateRange = (range) => {
        const today = new Date();
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (range === 'Today') return { startDate: formatDate(today), endDate: formatDate(today) };
        if (range === 'Yesterday') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
        }
        if (range === 'This Week') {
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 6);
            return { startDate: formatDate(lastWeek), endDate: formatDate(today) };
        }
        if (range === 'This Month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: formatDate(firstDay), endDate: formatDate(today) };
        }

        if (range.includes(' - ')) {
            const parts = range.split(' - ');
            if (parts.length === 2) {
                const currentYear = new Date().getFullYear();
                const d1 = new Date(`${parts[0]} ${currentYear}`);
                const d2 = new Date(`${parts[1]} ${currentYear}`);
                if (!isNaN(d1) && !isNaN(d2)) return { startDate: formatDate(d1), endDate: formatDate(d2) };
            }
        } else if (range.match(/^[A-Z][a-z]{2} \d{4}$/)) {
            const d = new Date(range);
            if (!isNaN(d)) {
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                return { startDate: formatDate(start), endDate: formatDate(end) };
            }
        }

        const d = new Date(range);
        if (!isNaN(d.getTime())) {
            return { startDate: formatDate(d), endDate: formatDate(d) };
        }

        return {};
    };

    const fetchWidgets = async (apiFilters) => {
        setIsWidgetsLoading(true);
        try {
            const res = await dashboardService.getWidgets(apiFilters);
            if (res?.status === 'success') setWidgets(res.data.widgets);
        } catch (e) { console.error("Widgets fetch error:", e); }
        finally { setIsWidgetsLoading(false); }
    };

    const fetchCharts = async (apiFilters) => {
        setIsChartsLoading(true);
        try {
            const res = await dashboardService.getCharts(apiFilters);
            if (res?.status === 'success') setCharts(res.data.charts.revenue_over_time || []);
        } catch (e) { console.error("Charts fetch error:", e); }
        finally { setIsChartsLoading(false); }
    };

    const fetchTransactions = async (apiFilters, page = 1) => {
        setIsTxLoading(true);
        try {
            const res = await dashboardService.getRecentTransactions({ ...apiFilters, page, limit: 5 });
            if (res?.status === 'success') {
                setTransactions(res.data.recent_transactions || []);
                setTxPagination({ page: res.pagination.page, hasMore: res.pagination.has_more });
            }
        } catch (e) { console.error("Transactions fetch error:", e); }
        finally { setIsTxLoading(false); }
    };

    const fetchRouters = async (page = 1) => {
        setIsRoutersLoading(true);
        try {
            const res = await dashboardService.getRouterStatus({ page, limit: 5 });
            if (res?.status === 'success') {
                setRouters(res.data.router_status || []);
                setRouterPagination({ page: res.pagination.page, hasMore: res.pagination.has_more });
            }
        } catch (e) { console.error("Routers fetch error:", e); }
        finally { setIsRoutersLoading(false); }
    };

    const fetchData = async () => {
        setIsRefreshing(true);
        const apiFilters = { router: filters.router, ...parseDateRange(filters.dateRange) };

        // Widgets (Cards) FIRST - and alone if possible for instant response
        await fetchWidgets(apiFilters);

        // Then everything else in parallel
        Promise.all([
            fetchCharts(apiFilters),
            fetchTransactions(apiFilters, 1),
            fetchRouters(1)
        ]);

        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, [filters])

    const metrics = widgets ? [
        { label: "Today's Earnings", value: `KSH ${(widgets.todays_earnings.value || 0).toLocaleString()}`, note: 'Last 24 hours', icon: Wallet, color: 'text-pace-purple', bg: 'bg-pace-purple/10' },
        { label: "Month Revenue", value: `KSH ${(widgets.month_revenue.value || 0).toLocaleString()}`, note: 'Current cycle', icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: "Entries", value: (widgets.active_users.value || 0).toString(), note: 'Todays Entries', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: "Monthly Customers", value: (widgets.customers_month?.value || 0).toString(), note: 'Distinct MACs', icon: Users, color: 'text-admin-dim', bg: 'bg-pace-bg-subtle' },
        { label: "Online Customers", value: (widgets.online_customers?.value || 0).toString(), note: 'Live Now', icon: Wifi, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: "System Health", value: widgets.system_health.value || '98%', note: 'Network uptime', icon: Network, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ] : [];

    return (
        <div className="space-y-6 font-figtree animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10 sm:px-0">
            {/* Title Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-pace-border pb-6">
                <div>
                    <h1 className="text-xl font-medium text-pace-purple uppercase tracking-tight">Dashboard</h1>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 tracking-widest uppercase">Performance Summary</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <GlobalFilters onFilterChange={(f) => setFilters(prev => ({ ...prev, ...f }))} />
                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pace-purple/5 text-pace-purple border border-pace-purple/10 rounded-xl hover:bg-pace-purple/10 transition-all text-xs font-medium uppercase tracking-widest w-full sm:w-auto justify-center disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
                    </button>
                    <button
                        onClick={() => router.push('/dashboard/prepaid/vouchers?create=true')}
                        className="flex items-center gap-2 px-6 py-2.5 bg-pace-purple text-white rounded-xl hover:bg-pace-purple/90 transition-all text-xs font-medium uppercase tracking-widest shadow-lg shadow-pace-purple/20 w-full sm:w-auto justify-center"
                    >
                        <Plus size={14} /> New Voucher
                    </button>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {isWidgetsLoading && !widgets ? (
                    [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
                ) : metrics.map((metric, i) => (
                    <div
                        key={i}
                        className={cn(
                            "bg-card-bg border border-pace-border rounded-xl p-3 sm:p-5 hover:border-pace-purple/30 hover:shadow-lg hover:shadow-pace-purple/5 transition-all group",
                            metric.label === "Month Revenue" && "cursor-pointer"
                        )}
                        onClick={() => metric.label === "Month Revenue" && setIsRevenueBlurred(!isRevenueBlurred)}
                    >
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="w-8 h-8 rounded-lg bg-pace-bg-subtle border border-pace-border flex items-center justify-center transition-all group-hover:border-pace-purple/30 group-hover:bg-pace-purple/5">
                                <metric.icon size={14} className="text-admin-dim group-hover:text-pace-purple transition-colors" />
                            </div>
                        </div>
                        <div className="relative">
                            <h3 className={cn(
                                "text-lg sm:text-2xl font-medium text-pace-purple tracking-tight transition-all",
                                metric.label === "Month Revenue" && isRevenueBlurred && "blur-md select-none"
                            )}>
                                {metric.value}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 mt-0.5 sm:mt-1 uppercase tracking-wider">
                                {metric.label}
                                {metric.label === "Month Revenue" && (
                                    <span className="ml-2 text-[8px] sm:text-[9px] text-gray-300 italic">
                                        {isRevenueBlurred ? "(reveal)" : "(hide)"}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions Management Center */}
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                <button
                    onClick={() => {
                        loadModalData();
                        setIsCreateModalOpen(true);
                    }}
                    className="p-4 bg-card-bg border border-pace-border rounded-2xl flex items-center gap-4 hover:border-pace-purple hover:shadow-xl hover:shadow-pace-purple/5 transition-all group text-left relative overflow-hidden min-w-[240px] sm:min-w-0 flex-shrink-0 snap-start"
                >
                    <div className="w-12 h-12 bg-pace-purple/10 rounded-xl flex items-center justify-center text-pace-purple group-hover:scale-110 transition-transform">
                        <Ticket size={22} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-pace-purple uppercase tracking-tight">Generate Vouchers</p>
                        <p className="text-[10px] text-gray-400 font-medium">Bulk prepaid production</p>
                    </div>
                    <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-300 group-hover:text-pace-purple transition-colors" />
                </button>

                <Link href="/dashboard/prepaid/plans" className="p-4 bg-card-bg border border-pace-border rounded-2xl flex items-center gap-4 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/5 transition-all group text-left relative overflow-hidden min-w-[240px] sm:min-w-0 flex-shrink-0 snap-start">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Tag size={22} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-blue-600 uppercase tracking-tight">Active Plans</p>
                        <p className="text-[10px] text-gray-400 font-medium">Manage bandwidth tiers</p>
                    </div>
                    <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </Link>

                <Link href="/dashboard/routers" className="p-4 bg-card-bg border border-pace-border rounded-2xl flex items-center gap-4 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/5 transition-all group text-left relative overflow-hidden min-w-[240px] sm:min-w-0 flex-shrink-0 snap-start">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Network size={22} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-tight">Station Node</p>
                        <p className="text-[10px] text-gray-400 font-medium">Core hardware hub</p>
                    </div>
                    <ArrowUpRight size={14} className="absolute top-3 right-3 text-gray-300 group-hover:text-orange-500 transition-colors" />
                </Link>

                <div className="p-4 bg-pace-bg-subtle border border-dashed border-pace-border rounded-2xl flex items-center gap-4 opacity-60 min-w-[240px] sm:min-w-0 flex-shrink-0 snap-start">
                    <div className="w-12 h-12 bg-card-bg border border-pace-border rounded-xl flex items-center justify-center text-admin-dim">
                        <Activity size={22} />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-tight">Smart Logger</p>
                        <p className="text-[10px] text-gray-400 font-medium">Real-time diagnostics</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Income Chart */}
                <div className="lg:col-span-8 bg-card-bg border border-pace-border rounded-xl p-3 sm:p-6 shadow-sm min-w-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                        <div>
                            <h4 className="text-sm font-medium text-pace-purple uppercase">Activity & Growth</h4>
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider">System utilization trends</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-pace-purple" /><span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Revenue</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-gray-300" /><span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">Activity</span></div>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[320px] w-full relative">
                        {isChartsLoading ? <Skeleton className="w-full h-full rounded-lg" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.map(c => ({ label: c.day, amount: c.amount, entries: c.entries }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '11px', fontWeight: '700' }} formatter={(v, n) => [n === 'amount' ? `KSH ${v.toLocaleString()}` : v, n === 'amount' ? 'Revenue' : 'Entries']} />
                                    <Area type="monotone" dataKey="amount" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" animationDuration={1000} />
                                    <Area type="monotone" dataKey="entries" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEntries)" animationDuration={1500} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Recent Entries - Paginated Table */}
                <div className="lg:col-span-4 bg-card-bg border border-pace-border rounded-xl p-5 shadow-sm flex flex-col h-full uppercase">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h4 className="text-sm font-medium text-pace-purple uppercase">Recent Activity</h4>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Live Connections</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pace-purple/5 rounded-full border border-pace-purple/10">
                            <span className="text-[10px] font-bold text-pace-purple uppercase tracking-tighter">P{txPagination.page} - Limit 5</span>

                        </div>
                    </div>

                    <div className="flex-1 space-y-0.5 overflow-hidden">
                        {isTxLoading && transactions.length === 0 ? (
                            [...Array(6)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-pace-border last:border-0">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-4 w-24 mb-1" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Skeleton className="h-4 w-12 mb-1 ml-auto" />
                                        <Skeleton className="h-3 w-16 rounded-full ml-auto" />
                                    </div>
                                </div>
                            ))
                        ) :
                            transactions.length === 0 ? (
                                <div className="text-center text-gray-400 text-[10px] py-10 uppercase font-semibold">No transactions found</div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-pace-border last:border-0 hover:bg-pace-bg-subtle -mx-1 px-1 rounded-lg transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-pace-bg-subtle border border-pace-border flex items-center justify-center text-admin-dim group-hover:text-pace-purple transition-all"><Smartphone size={13} /></div>
                                            <div>
                                                <p className="text-xs font-medium text-pace-purple font-mono tracking-tight">{tx.user_phone}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-medium text-admin-dim uppercase">{tx.plan_name?.split('_')[0]}</span>
                                                    <span className="text-[9px] text-admin-dim flex items-center gap-1"><Clock size={9} /> {tx.time_ago}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-admin-value transition-colors">KES {tx.amount}</p>
                                            <div className={cn("inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest mt-0.5", parseInt(tx.amount) > 50 ? "bg-pace-purple text-white shadow-lg shadow-pace-purple/20" : "bg-pace-bg-subtle text-admin-dim border border-pace-border")}>{tx.mpesa_code}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-auto border-t border-pace-border">
                        <button
                            onClick={() => fetchTransactions({ router: filters.router, ...parseDateRange(filters.dateRange) }, txPagination.page - 1)}
                            disabled={txPagination.page <= 1 || isTxLoading}
                            className="p-2 border border-pace-border rounded-lg text-admin-dim disabled:opacity-30 hover:bg-pace-bg-subtle transition-colors"
                        ><ArrowUpRight className="rotate-[225deg]" size={14} /></button>
                        <span className="text-[10px] font-bold text-admin-dim uppercase">Page {txPagination.page}</span>
                        <button
                            onClick={() => fetchTransactions({ router: filters.router, ...parseDateRange(filters.dateRange) }, txPagination.page + 1)}
                            disabled={!txPagination.hasMore || isTxLoading}
                            className="p-2 border border-pace-border rounded-lg text-admin-dim disabled:opacity-30 hover:bg-pace-bg-subtle transition-colors"
                        ><ArrowUpRight size={14} /></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Router Table - Paginated */}
                <div className="lg:col-span-4 bg-card-bg border border-pace-border rounded-xl p-5 shadow-sm flex flex-col order-2 lg:order-1">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h4 className="text-sm font-medium text-pace-purple uppercase">Stations</h4>
                            <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">Hardware Health</p>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    </div>

                    <div className="space-y-2 flex-1">
                        {isRoutersLoading && routers.length === 0 ? (
                            [...Array(4)].map((_, i) => (
                                <div key={i} className="p-2.5 border border-pace-border rounded-xl flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-lg" />
                                        <div>
                                            <Skeleton className="h-3 w-20 mb-1" />
                                            <Skeleton className="h-2 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-12 rounded-full" />
                                </div>
                            ))
                        ) :
                            routers.map((device, idx) => (
                                <div key={idx} className="p-2.5 border border-pace-border rounded-xl hover:bg-pace-bg-subtle transition-all group flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 bg-pace-bg-subtle rounded-lg opacity-80"><Image src="/router.png" alt="R" width={20} height={20} /></div>
                                        <div>
                                            <p className="text-[10px] font-medium text-pace-purple uppercase tracking-tight">{device.name}</p>
                                            <p className="text-[8px] font-medium text-admin-dim font-mono">{device.ip}</p>
                                        </div>
                                    </div>
                                    <Badge variant="success" className="text-[8px] font-medium uppercase tracking-wider px-2 py-0.5 bg-green-500/10 border-none text-green-500">{device.status}</Badge>
                                </div>
                            ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                        <button
                            onClick={() => fetchRouters(routerPagination.page - 1)}
                            disabled={routerPagination.page <= 1 || isRoutersLoading}
                            className="p-2 border border-pace-border rounded-lg text-admin-dim disabled:opacity-30 hover:bg-pace-bg-subtle transition-colors"
                        ><ArrowUpRight className="rotate-[225deg]" size={14} /></button>
                        <span className="text-[10px] font-bold text-admin-dim uppercase">Page {routerPagination.page}</span>
                        <button
                            onClick={() => fetchRouters(routerPagination.page + 1)}
                            disabled={!routerPagination.hasMore || isRoutersLoading}
                            className="p-2 border border-pace-border rounded-lg text-admin-dim disabled:opacity-30 hover:bg-pace-bg-subtle transition-colors"
                        ><ArrowUpRight size={14} /></button>
                    </div>

                    <div className="pt-4">
                        <Link href={token ? `/dashboard/routers?token=${token}` : '/dashboard/routers'} className="w-full py-2 flex items-center justify-center border border-dashed border-pace-border rounded-xl text-[9px] font-bold text-admin-dim uppercase tracking-widest hover:border-pace-purple hover:text-pace-purple transition-all">Go to Full View</Link>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="lg:col-span-8 bg-card-bg border border-pace-border rounded-xl p-3 sm:p-6 shadow-sm order-1 lg:order-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
                        <div>
                            <h4 className="text-base font-bold text-pace-purple uppercase">Revenue Trend</h4>
                            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Earnings Growth</p>
                        </div>
                        <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[9px] font-bold rounded-full uppercase tracking-widest border border-green-500/20">+12.5% vs Prev</div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full relative">
                        {isChartsLoading ? <Skeleton className="w-full h-full rounded-lg" /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 'bold' }} />
                                    <Bar dataKey="amount" radius={[4, 4, 4, 4]} barSize={32} fill="#7c3aed">
                                        {charts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === charts.length - 1 ? '#7c3aed' : '#e5e7eb'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    )
}
