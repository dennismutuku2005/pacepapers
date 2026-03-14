"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import {
    Users, CreditCard, Ticket, Settings,
    Activity, FileText, Network, Receipt,
    UserRoundCheck, MessageSquare, Globe, ChevronDown,
    LogOut, LayoutDashboard, Clock, Smartphone, Bell, Code
} from 'lucide-react'
import { Modal } from '@/components/Modal'
import { cn } from '@/lib/utils'

import authService from '@/lib/auth'

export function Sidebar({ isSidebarOpen, setIsSidebarOpen, isMobile, pathname }) {
    const [openMenus, setOpenMenus] = useState([])
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [mounted, setMounted] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Helper to persist query params
    const createHref = (href) => {
        if (!searchParams) return href
        const params = new URLSearchParams(searchParams)

        // Remove specific identifiers that shouldn't persist across different pages
        const keysToClear = ['phone', 'mac', 'id', 'code', 'v']
        keysToClear.forEach(key => params.delete(key))

        const queryString = params.toString()
        return queryString ? `${href}?${queryString}` : href
    }

    const toggleMenu = (id) => {
        setOpenMenus(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        )
    }

    const user = mounted ? authService.getUser() : null
    const role = user?.type || 'user'
    const isAdmin = role === 'admin'

    const navigation = [
        { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { id: 'entries', name: 'Entries', href: '/dashboard/entries', icon: Clock },

        {
            id: 'prepaid',
            name: 'Prepaid',
            icon: Ticket,
            children: [
                { name: 'Plans', href: '/dashboard/prepaid/plans' },
                { name: 'Prepaid Vouchers', href: '/dashboard/prepaid/vouchers' },
                { name: 'Prepaid Users', href: '/dashboard/prepaid/users' },
            ]
        },

        { id: 'income', name: 'Income', href: '/dashboard/income', icon: CreditCard },
        { id: 'billing', name: 'Your Bill', href: '/dashboard/billing', icon: Receipt },

        {
            id: 'customers',
            name: 'Customers',
            icon: Users,
            children: [
                { name: 'Customer List', href: '/dashboard/customers' },
                { name: 'Block STK', href: '/dashboard/customers/block-stk' },
            ]
        },

        {
            id: 'themes',
            name: 'Themes',
            icon: Globe,
            children: [
                { name: 'Hotspot Theme', href: '/dashboard/themes' },
            ]
        },

        { id: 'routers', name: 'Routers', href: '/dashboard/routers', icon: Network },

        ...(isAdmin ? [
            { id: 'config', name: 'System Config', href: '/dashboard/config', icon: Settings },
            { id: 'mpesa', name: 'M-Pesa Transactions', href: '/dashboard/mpesa', icon: Smartphone },
        ] : []),

        { id: 'notifications', name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { id: 'logs', name: 'System Logs', href: '/dashboard/logs', icon: Activity },

        {
            id: 'utilities',
            name: 'Utilities',
            icon: Code,
            children: [
                { name: 'Scripts', href: '/dashboard/utilities/scripts' },
                { name: 'Helpers', href: '/dashboard/utilities/helpers' },
            ]
        },

        { id: 'settings', name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ]

    const sidebarClass = isMobile
        ? cn(
            "fixed inset-y-0 left-0 z-50 bg-card-bg border-r border-pace-border transition-transform duration-300 w-64 shadow-xl",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )
        : cn(
            "fixed inset-y-0 left-0 z-50 bg-card-bg border-r border-pace-border transition-all duration-300",
            isSidebarOpen ? "w-60" : "w-16"
        );

    const showText = isMobile || isSidebarOpen;

    return (
        <>
            <aside className={sidebarClass}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-center border-b border-pace-border">
                    <Link href={createHref("/dashboard")} className="flex items-center justify-center gap-2">
                        {showText ? (
                            <Image
                                src="/logoc.png"
                                alt="Pace"
                                width={12}
                                height={12}
                                className="h-7 w-auto object-contain"
                                priority
                            />
                        ) : (
                            <Image
                                src="/logoc.png"
                                alt="Pace"
                                width={32}
                                height={32}
                                className="h-6 w-auto object-contain"
                                priority
                            />
                        )}
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || item.children?.some(child => child.href === pathname);
                        const isExpanded = openMenus.includes(item.id);

                        return (
                            <div key={item.id} className="space-y-0.5">
                                {item.children ? (
                                    <div className="space-y-0.5">
                                        <button
                                            onClick={() => toggleMenu(item.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative text-[13px] cursor-pointer",
                                                isActive && !isExpanded ? "bg-pace-purple/10 text-pace-purple font-semibold" : "text-admin-label hover:bg-pace-bg-subtle hover:text-foreground"
                                            )}
                                        >
                                            <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-pace-purple" : "text-admin-dim group-hover:text-admin-label")} />
                                            {showText && (
                                                <div className="flex-1 flex items-center justify-between transition-opacity duration-200">
                                                    <span className="truncate">{item.name}</span>
                                                    <ChevronDown size={14} className={cn("transition-transform duration-200 text-admin-dim", isExpanded ? "rotate-180" : "")} />
                                                </div>
                                            )}
                                        </button>
                                        {/* Submenu */}
                                        {showText && isExpanded && (
                                            <div className="ml-4 space-y-0.5 border-l border-pace-border pl-2 my-1">
                                                {item.children.map((child) => {
                                                    const isChildActive = pathname === child.href;
                                                    return (
                                                        <Link
                                                            key={child.name}
                                                            href={createHref(child.href)}
                                                            className={cn(
                                                                "block px-3 py-2 rounded-lg text-[12px] transition-all",
                                                                isChildActive
                                                                    ? "text-pace-purple font-semibold bg-pace-purple/10"
                                                                    : "text-admin-dim hover:text-foreground hover:bg-pace-bg-subtle"
                                                            )}
                                                        >
                                                            {child.name}
                                                        </Link>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href={createHref(item.href)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative text-[13px]",
                                            isActive
                                                ? "bg-pace-purple text-white shadow-sm font-semibold"
                                                : "text-admin-label hover:bg-pace-bg-subtle hover:text-foreground"
                                        )}
                                    >
                                        <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-white" : "text-admin-dim group-hover:text-admin-label")} />
                                        {showText && (
                                            <div className="flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden transition-opacity duration-200">
                                                <span>{item.name}</span>
                                                {item.badge && (
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center",
                                                        isActive ? "bg-white/20 text-white" : "bg-pace-purple/10 text-pace-purple"
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </nav>

                <div className="absolute bottom-4 w-full px-3">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-admin-dim hover:text-red-500 transition-all rounded-xl hover:bg-red-500/10 text-[13px] font-semibold group cursor-pointer"
                    >
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        {showText && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Standardized Logout Modal */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Confirm Logout"
                description="Are you sure you want to sign out?"
                type="danger"
                icon={LogOut}
                confirmText="Sign Out"
                onConfirm={() => {
                    authService.logout();
                    window.location.href = '/login';
                }}
            />
        </>
    )
}

