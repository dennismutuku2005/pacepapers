"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Phone, Wifi, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/Badge'
import { Skeleton, TableRowSkeleton } from '@/components/Skeleton'

import { customerService } from '@/services/customers'
import { dashboardService } from '@/services/dashboard'

function CustomersContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const serviceFilter = searchParams?.get('service') || null

    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [customers, setCustomers] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState(0)

    const [stats, setStats] = useState({ monthly: 0, online: 0 })

    const observer = useRef()
    const fetchLock = useRef(false)

    // Load metrics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboardService.getWidgets()
                if (res?.status === 'success') {
                    setStats({
                        monthly: res.data.widgets.customers_month?.value || 0,
                        online: res.data.widgets.online_customers?.value || 0
                    })
                }
            } catch (e) {
                console.error("Stats fetch error:", e)
            }
        }
        fetchStats()
    }, [])

    // Load data function
    const loadCustomers = async (pageNum, isAppend = false) => {
        if (fetchLock.current) return
        fetchLock.current = true

        try {
            if (!isAppend) setIsLoading(true)
            else setIsLoadingMore(true)

            const response = await customerService.getCustomers({
                page: pageNum,
                limit: 12,
                search
            })

            if (response?.status === 'success') {
                const newItems = response.data || []
                const serverTotal = response.pagination?.total || 0
                const serverHasMore = response.pagination?.has_more ?? false

                if (isAppend) {
                    setCustomers(prev => [...prev, ...newItems])
                } else {
                    setCustomers(newItems)
                }

                setTotal(serverTotal)
                setHasMore(serverHasMore)
                setPage(pageNum)
            } else {
                setHasMore(false)
            }
        } catch (error) {
            console.error("Failed to load customers", error)
            setHasMore(false)
        } finally {
            setIsLoading(false)
            setIsLoadingMore(false)
            fetchLock.current = false
        }
    }

    // Initial load & Search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setCustomers([])
            setPage(1)
            setHasMore(true)
            loadCustomers(1, false)
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Infinite Scroll Observer
    const lastCustomerElementRef = useCallback(node => {
        if (isLoading || isLoadingMore) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !fetchLock.current) {
                loadCustomers(page + 1, true)
            }
        })
        if (node) observer.current.observe(node)
    }, [isLoading, isLoadingMore, hasMore, page])

    const getStatusVariant = (status) => {
        if (status === 'Active') return 'success'
        if (status === 'Inactive') return 'error'
        return 'default'
    }

    return (
        <div className="space-y-6 font-figtree animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-pace-border pb-6">
                <div>
                    <h1 className="text-lg font-medium text-pace-purple leading-tight uppercase tracking-tight flex items-center gap-2">
                        <Users className="text-pace-purple" size={20} />
                        Customers
                    </h1>
                    <p className="text-[10px] font-medium text-gray-400 mt-1 tracking-widest uppercase italic border-l-2 border-pace-purple/20 pl-2">Manage hotspot users, distinct by phone number.</p>
                </div>

                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex flex-col items-end">
                        <span className="text-[14px] font-bold text-indigo-500 leading-none">{stats.monthly}</span>
                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Monthly Customers</span>
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[14px] font-bold text-emerald-500 leading-none">{stats.online}</span>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Online Now</span>
                    </div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pace-purple transition-colors" size={12} />
                    <input
                        type="text"
                        autoComplete="off"
                        placeholder="Search MAC or mobile number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card-bg border border-pace-border rounded-xl text-[11px] font-bold text-admin-value focus:outline-none focus:border-pace-purple transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto ml-auto px-4 py-1.5 bg-pace-bg-subtle border border-pace-border rounded-xl">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                        {customers.length} of {total} Records
                    </span>
                </div>
            </div>

            {/* Main Data Table */}
            <div className="bg-card-bg border border-pace-border rounded-2xl overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left whitespace-nowrap text-[11px]">
                        <thead>
                            <tr className="bg-pace-bg-subtle border-b border-pace-border font-bold text-admin-dim uppercase tracking-widest text-[9px]">
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4">Latest MAC Address</th>
                                <th className="px-6 py-4">Financial Contribution</th>
                                <th className="px-6 py-4 text-center">Sessions</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Last Visibility</th>
                                <th className="px-6 py-4 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pace-border">
                            {isLoading && customers.length === 0 ? (
                                <TableRowSkeleton cols={7} rows={8} />
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                <Phone size={24} />
                                            </div>
                                            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">No matching records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => {
                                    const isLast = index === customers.length - 1
                                    return (
                                        <tr
                                            key={customer.id}
                                            ref={isLast ? lastCustomerElementRef : null}
                                            onClick={() => router.push(`/dashboard/customer-history?phone=${encodeURIComponent(customer.phone)}`)}
                                            className="hover:bg-pace-bg-subtle transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-medium text-pace-purple tracking-tight">{customer.phone}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-[10px] text-gray-400 uppercase">{customer.mac}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-pace-purple">KES {customer.totalSpent}</span>
                                                    <span className="text-[8px] font-normal text-gray-300 uppercase tracking-widest">Aggregate Spend</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{customer.sessions}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant={getStatusVariant(customer.status)} className="text-[8px] font-medium px-2 py-0.5 border-none uppercase tracking-widest rounded-md">
                                                    {customer.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-gray-500 font-medium text-[9px] uppercase tracking-wide flex items-center gap-1.5">
                                                        <Clock size={10} className="text-gray-300" />
                                                        {customer.lastSeen}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end pr-2">
                                                    <div className="p-1.5 text-gray-300 group-hover:text-gray-900 transition-all font-medium text-[10px] flex items-center gap-1 uppercase tracking-widest opacity-80">
                                                        Profile &rarr;
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}

                            {/* Loading More Indicator */}
                            {isLoadingMore && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-gray-200 border-t-pace-purple rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Synchronizing records...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default function CustomersPage() {
    return (
        <Suspense fallback={
            <div className="space-y-6 font-figtree animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-lg font-medium text-gray-900 uppercase">Customers</h1>
                        <p className="text-xs text-gray-400 mt-1 uppercase">Loading records...</p>
                    </div>
                </div>
            </div>
        }>
            <CustomersContent />
        </Suspense>
    )
}
