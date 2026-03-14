"use client"

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Search, Plus, Wifi, Terminal, CreditCard, Activity, CheckCircle2, XCircle, MoreHorizontal, Trash2, Edit, Signal, Power, AlertTriangle, Loader2, ChevronRight } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/Badge'
import { Skeleton } from '@/components/Skeleton'
import { routerService } from '@/services/routers'

function RoutersContent() {
    const [isLoading, setIsLoading] = useState(true)
    const [routers, setRouters] = useState([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editData, setEditData] = useState({})
    const [isSaving, setIsSaving] = useState(false)

    // UI States
    const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' })
    const [selectedRouter, setSelectedRouter] = useState(null)
    const [isActionModalOpen, setIsActionModalOpen] = useState(false)
    const [isRebootConfirmOpen, setIsRebootConfirmOpen] = useState(false)
    const [executingAction, setExecutingAction] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [diagData, setDiagData] = useState(null)

    const BANK_PAYBILLS = {
        'kcb': '522533',
        'equity': '247247',
        'ncba': '880100'
    }

    const showNotification = (type, title, message) => {
        setNotification({ show: true, type, title, message })
        setTimeout(() => setNotification({ show: false, type: 'success', title: '', message: '' }), 3000)
    }

    useEffect(() => {
        loadRouters()
    }, [])

    const loadRouters = async () => {
        setIsLoading(true)
        try {
            const response = await routerService.getRouters({ limit: 100 })
            if (response?.status === 'success') {
                const fetchedRouters = response.data || []
                setRouters(fetchedRouters)

                // Auto-ping logic: Fetch stats for each router after loading
                fetchedRouters.forEach(async (router) => {
                    try {
                        const pingRes = await routerService.pingRouter(
                            router.ip_address,
                            8728
                        )
                        const stats = pingRes?.data || pingRes
                        const isOnline = stats?.status === 'online' || stats?.cpu;
                        const newStatus = isOnline ? 'active' : 'inactive';

                        // Update local state
                        setRouters(prev => prev.map(r =>
                            r.id === router.id ? { ...r, stats: isOnline ? stats : null, status: newStatus } : r
                        ))

                        // Update backend if status changed in the database
                        if (router.status !== newStatus) {
                            try {
                                await routerService.updateRouter(router.id, { status: newStatus })
                            } catch (apiErr) {
                                console.error(`Failed to update status in API for ${router.id}`, apiErr)
                            }
                        }
                    } catch (e) {
                        console.error(`Auto-ping failed for ${router.id}`, e)
                        // Update local state to inactive
                        setRouters(prev => prev.map(r =>
                            r.id === router.id ? { ...r, status: 'inactive', stats: null } : r
                        ))
                        // Update backend if status was active
                        if (router.status !== 'inactive') {
                            try {
                                await routerService.updateRouter(router.id, { status: 'inactive' })
                            } catch (apiErr) {
                                console.error(`Failed to update status in API for ${router.id}`, apiErr)
                            }
                        }
                    }
                })
            }
        } catch (error) {
            console.error("Failed to load routers", error)
            showNotification('error', 'Error', 'Failed to load routers')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateRouter = async () => {
        if (!editData.id || isSaving) return
        setIsSaving(true)
        try {
            const res = await routerService.updateRouter(editData.id, editData)
            if (res.status === 'success') {
                showNotification('success', 'Update Successful', 'Router billing details updated.')
                setIsEditModalOpen(false)
                loadRouters()
            } else {
                showNotification('error', 'Update Failed', res.message || 'Could not save changes.')
            }
        } catch (e) {
            console.error("Update Error:", e)
            showNotification('error', 'Network Error', 'Failed to reach management service.')
        } finally {
            setIsSaving(false)
        }
    }

    const filteredRouters = routers.filter(router =>
        router.router_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        router.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        router.model?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleRestartRouter = async () => {
        if (!selectedRouter || executingAction) return;
        setIsRebootConfirmOpen(false);
        setExecutingAction('restart');
        try {
            const res = await routerService.restartRouter(selectedRouter.ip_address, 8728);
            if (res?.success === true || res?.status === 'success') {
                showNotification('info', 'Command Sent', res.message || "Restart command successfully transmitted.");
            } else {
                showNotification('error', 'Execution Error', res?.message || 'Failed to send command.');
            }
        } catch (err) {
            showNotification('error', 'Network Error', 'Reboot command failed.');
        } finally {
            setExecutingAction(null);
            // Optionally clear stats since router is rebooting
            setRouters(prev => prev.map(r => r.id === selectedRouter.id ? { ...r, stats: null } : r));
        }
    }

    return (
        <div className="space-y-6 font-figtree animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-pace-border pb-5">
                <div className="flex-1">
                    <h1 className="text-xl font-medium text-pace-purple">Routers</h1>
                    <p className="text-[11px] text-admin-dim mt-0.5 flex items-center gap-2 font-medium">
                        <Activity size={14} className="text-pace-purple" />
                        control and MikroTik synchronization status.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-dim" size={16} />
                        <input
                            type="text"
                            placeholder="Search routers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-pace-bg-subtle border border-pace-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:bg-card-bg transition-all placeholder:text-admin-dim text-admin-value font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-card-bg border border-pace-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                        <thead className="bg-card-bg border-b border-pace-border">
                            <tr className="text-admin-dim font-bold uppercase tracking-wider text-[10px]">
                                <th className="px-4 py-3">Router Name</th>
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">System Health</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Options</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pace-border">
                            {isLoading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-3 text-center"><Skeleton className="h-4 w-20 mx-auto" /></td>
                                        <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : routers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                        <Wifi size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-medium text-xs uppercase tracking-wider">No routers found</p>
                                    </td>
                                </tr>
                            ) : filteredRouters.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                        <Search size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="font-medium text-xs uppercase tracking-wider">No results for "{searchTerm}"</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRouters.map((router) => (
                                    <tr key={router.id} className="hover:bg-pace-bg-subtle transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-pace-bg-subtle border border-pace-border flex items-center justify-center transition-transform group-hover:scale-105 p-1.5">
                                                    <Image src="/router.png" alt="Router" width={20} height={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-pace-purple leading-none">{router.router_name.replace(/_/g, ' ')}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-[10px] text-admin-dim font-mono">{router.model}</p>
                                                        {router.stats?.cpu && (
                                                            <div className="flex items-center gap-1 bg-pace-bg-subtle border border-pace-border px-1.5 py-0.5 rounded">
                                                                <Activity size={10} className="text-admin-dim" />
                                                                <span className="text-[9px] font-bold text-admin-value">{router.stats.cpu}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-pace-purple font-medium text-[11px]">
                                                    <Activity size={12} className="text-gray-300" />
                                                    <span>{router.ip_address}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                                                    <Terminal size={12} />
                                                    <span>Port: {router.winbox_port}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {router.stats ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[9px] text-gray-400 font-medium uppercase">Load</span>
                                                                <span className="text-[10px] font-medium text-pace-purple">{router.stats.cpu || '0%'}</span>
                                                            </div>
                                                            <div className="w-full h-0.5 bg-pace-border rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full transition-all duration-1000",
                                                                        parseInt(router.stats.cpu) > 80 ? "bg-red-500" : parseInt(router.stats.cpu) > 50 ? "bg-amber-500" : "bg-green-500"
                                                                    )}
                                                                    style={{ width: router.stats.cpu || '0%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-medium">
                                                        <Activity size={10} className="text-pace-purple" />
                                                        <span>Uptime: {router.stats.uptime || 'N/A'}</span>
                                                        <span className="text-gray-300 mx-1">|</span>
                                                        <span>v{router.stats.version || '---'}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-400 italic">
                                                    <Loader2 size={12} className="animate-spin" />
                                                    <span>Fetching resources...</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                variant={router.status === 'active' ? 'success' : 'error'}
                                                className="text-[9px] px-2 py-0.5 font-medium uppercase"
                                            >
                                                {router.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <p className="text-[10px] text-gray-400 mt-1">{router.last_check_formatted}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditData(router);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-pace-purple hover:bg-pace-purple/5 rounded-lg transition-all"
                                                    title="Edit Config"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRouter(router);
                                                        setDiagData(router.stats || null);
                                                        setIsActionModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-pace-purple hover:bg-gray-100 rounded-lg transition-all"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Router Action Modal */}
            <Modal
                isOpen={isActionModalOpen}
                onClose={() => !executingAction && setIsActionModalOpen(false)}
                title="Router Control"
                description={`Manage operations for ${selectedRouter?.router_name.replace(/_/g, ' ')}`}
                icon={Activity}
                maxWidth="max-w-[400px]"
                showCancel={false}
                footer={
                    <button
                        onClick={() => setIsActionModalOpen(false)}
                        disabled={!!executingAction}
                        className="w-full py-2.5 bg-pace-bg-subtle border border-pace-border text-admin-dim rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-card-bg hover:text-admin-value transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        Close Panel
                    </button>
                }
            >
                {selectedRouter && (
                    <div className="space-y-3">
                        {/* Device Info Card */}
                        <div className="bg-pace-purple/5 p-3 rounded-2xl border border-pace-purple/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-card-bg border border-pace-border flex items-center justify-center p-2">
                                    <Image src="/router.png" alt="Router" width={20} height={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-pace-purple font-medium uppercase tracking-wider mb-0.5">Device Network</p>
                                    <h4 className="text-[12px] font-medium text-pace-purple leading-none">{selectedRouter.ip_address}</h4>
                                </div>
                            </div>
                            <Badge
                                variant={selectedRouter.status === 'active' ? 'success' : 'error'}
                                className="text-[7px] px-1.5 py-0.5 font-medium uppercase"
                            >
                                {selectedRouter.status === 'active' ? 'Online' : 'Offline'}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2">


                            <button
                                onClick={() => setIsRebootConfirmOpen(true)}
                                disabled={!!executingAction}
                                className="flex items-center gap-4 p-3.5 bg-card-bg border border-pace-border rounded-2xl hover:border-red-500 hover:bg-red-500/5 transition-all text-left group disabled:opacity-50"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20">
                                    {executingAction === 'restart' ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-[12px] font-medium text-pace-purple mb-0.5">Restart Hardware</h5>
                                    <p className="text-[10px] text-gray-400 leading-tight">Node reboot. Users will disconnect.</p>
                                </div>
                                <ChevronRight size={12} className="text-gray-200 group-hover:text-red-500 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>

                        {/* Diagnostic Data Display */}
                        {diagData && (
                            <div className="bg-pace-bg-subtle rounded-2xl border border-pace-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="px-3.5 py-2.5 bg-card-bg border-b border-pace-border flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-admin-dim uppercase tracking-wider">Hardware Status</span>
                                    <Badge variant="outline" className="text-[8px] bg-card-bg">v{diagData.version || 'unknown'}</Badge>
                                </div>
                                <div className="p-3.5 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-admin-dim font-bold uppercase leading-none">CPU Usage</p>
                                            <div className="flex items-end gap-1.5">
                                                <span className="text-sm font-bold text-pace-purple leading-none">{diagData.cpu || '0%'}</span>
                                                <div className="flex-1 h-1.5 bg-pace-border rounded-full overflow-hidden mb-0.5">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            parseInt(diagData.cpu) > 80 ? "bg-red-500" : parseInt(diagData.cpu) > 50 ? "bg-amber-500" : "bg-green-500"
                                                        )}
                                                        style={{ width: diagData.cpu || '0%' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-admin-dim font-bold uppercase leading-none">Uptime</p>
                                            <p className="text-sm font-bold text-admin-value leading-none truncate">{diagData.uptime || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase leading-none">Search/Storage</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold text-gray-700">{diagData.storage || diagData.hdd || 'Optimized'}</span>
                                                <Badge className="text-[7px] py-0 px-1 bg-blue-500/10 text-blue-500 border-blue-500/20">Healthy</Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase leading-none">Last Ping</p>
                                            <p className="text-[11px] font-medium text-gray-600 truncate">
                                                {diagData.timestamp ? new Date(diagData.timestamp).toLocaleTimeString() : 'Just now'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning Notice */}
                        <div className="bg-pace-bg-subtle rounded-2xl p-3 border border-pace-border flex gap-3">
                            <AlertTriangle size={14} className="text-admin-dim shrink-0 mt-0.5" />
                            <p className="text-[10px] text-admin-dim font-medium leading-relaxed uppercase tracking-tight">
                                Commands via secure API. Verify remote access status.
                            </p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Reboot Confirmation Modal */}
            <Modal
                isOpen={isRebootConfirmOpen}
                onClose={() => setIsRebootConfirmOpen(false)}
                title="System Reboot"
                description={`Confirm hardware restart for ${selectedRouter?.router_name.replace(/_/g, ' ')}?`}
                type="danger"
                icon={Power}
                maxWidth="max-w-[400px]"
                confirmText="Restart Node"
                cancelText="Keep Online"
                onConfirm={handleRestartRouter}
            >
                <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-[11px] text-red-900 font-bold uppercase tracking-tight">System Warning</p>
                        <p className="text-[10px] text-red-700 leading-relaxed font-medium">
                            This will disconnect all active users. The router will be unreachable for approximately 2-5 minutes during startup.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Custom Notification Modal */}
            {notification.show && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className={cn(
                        "flex items-start gap-3 p-4 rounded-xl shadow-lg border min-w-[320px] max-w-md",
                        notification.type === 'success' && "bg-green-500/10 border-green-500/20",
                        notification.type === 'error' && "bg-red-500/10 border-red-500/20",
                        notification.type === 'info' && "bg-blue-500/10 border-blue-500/20"
                    )}>
                        {notification.type === 'success' && <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />}
                        {notification.type === 'error' && <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />}
                        {notification.type === 'info' && <Activity size={20} className="text-blue-600 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                            <h4 className={cn(
                                "font-bold text-sm",
                                notification.type === 'success' && "text-green-500",
                                notification.type === 'error' && "text-red-500",
                                notification.type === 'info' && "text-blue-500"
                            )}>{notification.title}</h4>
                            <p className={cn(
                                "text-xs mt-0.5",
                                notification.type === 'success' && "text-green-500",
                                notification.type === 'error' && "text-red-500",
                                notification.type === 'info' && "text-blue-500"
                            )}>{notification.message}</p>
                        </div>
                        <button
                            onClick={() => setNotification({ ...notification, show: false })}
                            className={cn(
                                "text-gray-400 hover:text-gray-600 transition-colors",
                                notification.type === 'success' && "hover:text-green-600",
                                notification.type === 'error' && "hover:text-red-600",
                                notification.type === 'info' && "hover:text-blue-600"
                            )}
                        >
                            <XCircle size={16} />
                        </button>
                    </div>
                </div>
            )}
            {/* Edit Router Billing Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => !isSaving && setIsEditModalOpen(false)}
                title="Billing Configuration"
                description={`Update payment details for ${editData.router_name?.replace(/_/g, ' ')}`}
                icon={Edit}
                maxWidth="max-w-[450px]"
                showCancel={true}
                cancelText="Discard"
                confirmText={isSaving ? "Saving..." : "Update Config"}
                onConfirm={handleUpdateRouter}
                isLoading={isSaving}
            >
                <div className="space-y-5 py-2">
                    {/* Identification Info */}
                    <div className="flex items-center gap-3 p-3 bg-pace-bg-subtle rounded-2xl border border-pace-border">
                        <div className="w-10 h-10 rounded-xl bg-card-bg border border-pace-border flex items-center justify-center p-2 shrink-0">
                            <Image src="/router.png" alt="Router" width={24} height={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1"> Node</p>
                            <h4 className="text-sm font-bold text-pace-purple leading-none">{editData.router_name?.replace(/_/g, ' ')}</h4>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Account Type Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                                <CreditCard size={12} className="text-pace-purple" />
                                Payment Gateway / Clearing Bank
                            </label>
                            <div className="grid grid-cols-3 gap-2" >
                                {['kcb', 'equity', 'ncba'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setEditData({ ...editData, accountType: type })}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all gap-1.5",
                                            editData.accountType?.toLowerCase() === type
                                                ? "bg-pace-purple/10 border-pace-purple border-2"
                                                : "bg-pace-bg-subtle border-pace-border hover:border-pace-purple/40"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-tighter",
                                            editData.accountType?.toLowerCase() === type ? "text-pace-purple" : "text-admin-dim"
                                        )}>
                                            {type}
                                        </span>
                                        <span className="text-[9px] text-admin-dim font-bold">#{BANK_PAYBILLS[type]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Account Number Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Terminal size={12} className="text-pace-purple" />
                                M-Pesa Account Reference
                            </label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={editData.accountNumber || ''}
                                    onChange={(e) => setEditData({ ...editData, accountNumber: e.target.value })}
                                    placeholder="e.g. PACE_001"
                                    className="w-full bg-pace-bg-subtle border border-pace-border rounded-2xl px-4 py-3 text-sm font-bold text-pace-purple focus:outline-none focus:ring-4 focus:ring-pace-purple/5 focus:border-pace-purple transition-all placeholder:text-admin-dim"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-card-bg px-2 py-0.5 rounded-lg border border-pace-border opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fixed</span>
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 font-medium pl-1 italic">
                                * This reference will be shown to customers during STK push.
                            </p>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex gap-3">
                        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-500 leading-normal font-medium uppercase tracking-tight">
                            Changes take effect immediately. Ensure the account number matches your bank collection records.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default function RoutersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="animate-spin text-pace-purple" /></div>}>
            <RoutersContent />
        </Suspense>
    )
}
