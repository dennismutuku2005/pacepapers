"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Printer, 
  Download, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Image as ImageIcon,
  History,
  LayoutDashboard
} from 'lucide-react'
import Image from 'next/image'

export default function PacePapers() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    amount: '',
    description: 'First payment after installation',
    invoiceNumber: 'INV-000000',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isStamped: true,
    docType: 'Invoice', // 'Invoice' or 'Receipt'
    paymentMethod: 'Paybill', // 'Mobile', 'Till', 'Paybill'
    paybillNumber: '400200',
    accountNumber: '',
    tillNumber: '',
    mobileNumber: '',
    verificationHash: '00000000-0000',
    terms: 'This is an electronically generated document. No signature is required.',
    policy: 'Payment is non-refundable once service is activated.'
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const invoiceRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    setFormData(prev => ({
      ...prev,
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      verificationHash: Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    }))
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col md:flex-row h-screen overflow-hidden print:bg-white print:p-0">
      {/* Sidebar / Form Section */}
      <div className="w-full md:w-[400px] bg-[#F9FAFB] border-r border-[#E5E7EB] flex flex-col h-full print:hidden">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pace-purple rounded-xl flex items-center justify-center text-white font-bold text-xl">
              P
            </div>
            <div>
              <h1 className="text-lg font-bold text-pace-purple leading-tight">PacePapers</h1>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">Document Generator</p>
            </div>
          </div>
          <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-[#9CA3AF]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#374151] flex items-center gap-2">
              <FileText className="w-4 h-4 text-pace-purple" />
              Invoice Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Document Type</label>
                <div className="flex bg-white border border-[#D1D5DB] rounded-lg p-1">
                  {['Invoice', 'Receipt'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, docType: type }))}
                      className={`flex-1 py-1.5 text-xs font-black rounded-md transition-all ${formData.docType === type ? 'bg-pace-purple text-white shadow-md' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter name"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Phone Number</label>
                  <input 
                    type="text" 
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="07..."
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Customer Email</label>
                  <input 
                    type="email" 
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Amount (KES)</label>
                  <input 
                    type="number" 
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Date</label>
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase mb-1 block">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pace-purple/20 focus:border-pace-purple transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#E5E7EB] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${formData.isStamped ? 'bg-pace-green' : 'bg-[#9CA3AF]'}`}></div>
                  <span className="text-xs font-semibold text-[#374151]">Apply Official Stamp</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isStamped"
                    checked={formData.isStamped}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pace-purple"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <h2 className="text-sm font-black text-[#374151] flex items-center gap-2 uppercase tracking-tight">
              <Settings className="w-4 h-4 text-pace-purple" />
              Payment Details
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-black text-[#6B7280] uppercase mb-1 block">Method</label>
                <div className="grid grid-cols-3 gap-1 bg-white border border-[#D1D5DB] rounded-lg p-1">
                  {['Paybill', 'Till', 'Mobile'].map(m => (
                    <button
                      key={m}
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: m }))}
                      className={`py-1.5 text-[10px] font-black rounded-md transition-all ${formData.paymentMethod === m ? 'bg-pace-purple text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {formData.paymentMethod === 'Paybill' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-[#6B7280] uppercase mb-1 block">Paybill</label>
                    <input 
                      type="text" 
                      name="paybillNumber"
                      value={formData.paybillNumber}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-black focus:outline-none focus:border-pace-purple"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[#6B7280] uppercase mb-1 block">Account No</label>
                    <input 
                      type="text" 
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="e.g PACE"
                      className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-black focus:outline-none focus:border-pace-purple"
                    />
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'Till' && (
                <div>
                  <label className="text-[11px] font-black text-[#6B7280] uppercase mb-1 block">Till Number</label>
                  <input 
                    type="text" 
                    name="tillNumber"
                    value={formData.tillNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-black focus:outline-none focus:border-pace-purple"
                  />
                </div>
              )}

              {formData.paymentMethod === 'Mobile' && (
                <div>
                  <label className="text-[11px] font-black text-[#6B7280] uppercase mb-1 block">Mobile Number</label>
                  <input 
                    type="text" 
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm font-black focus:outline-none focus:border-pace-purple"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#E5E7EB]">
            <h2 className="text-sm font-black text-[#374151] flex items-center gap-2 uppercase tracking-tight">
              <History className="w-4 h-4 text-pace-purple" />
              Quick Presets
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {['New Install', 'Monthly', 'Router Fee', 'Support'].map((preset) => (
                <button 
                  key={preset}
                  onClick={() => setFormData(p => ({...p, description: `${preset} Payment`}))}
                  className="px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[10px] font-black text-[#4B5563] hover:border-pace-purple hover:text-pace-purple transition-all text-left uppercase"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-[#E5E7EB] space-y-3">
          <button 
            onClick={handlePrint}
            className="w-full bg-pace-purple text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#3d1774] transition-all shadow-lg shadow-pace-purple/10 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button className="w-full bg-white border border-[#E5E7EB] text-[#4B5563] rounded-xl py-3 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#F9FAFB] transition-all">
            <Download className="w-4 h-4" />
            Save as Draft
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex-1 bg-[#F3F4F6] overflow-y-auto flex items-center justify-center p-4 md:p-12 print:p-0 print:bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[800px] bg-white shadow-2xl rounded-none md:rounded-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none"
        >
          {/* Invoice Canvas */}
          <div id="invoice-paper" className="p-10 md:p-16 space-y-10 min-h-[900px] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 transition-all hover:scale-105 duration-500">
                    <img src="/logo.png" alt="Pace" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-pace-purple tracking-tighter font-figtree uppercase leading-none">PACE WISP</h2>
                    <p className="text-[11px] text-[#4B5563] uppercase tracking-[0.25em] font-black">FAST • RELIABLE • UNLIMITED</p>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <h1 className="text-4xl font-black text-[#111827] tracking-tight mb-2 uppercase">{formData.docType}</h1>
                <p className="text-xs text-[#6B7280] font-bold">#{formData.invoiceNumber}</p>
                <p className="text-xs text-[#6B7280] font-bold">{new Date(formData.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Address Grid */}
            <div className="grid grid-cols-2 gap-12 pt-10 border-t border-[#F3F4F6]">
              <div className="space-y-4">
                <h3 className="text-[11px] font-black text-[#9CA3AF] uppercase tracking-widest font-figtree mb-2">Issued By</h3>
                <div className="space-y-0.5 text-sm">
                  <p className="font-black text-[#111827] text-xl">Pace Wisp</p>
                  <p className="text-pace-purple font-black text-xs pt-1 uppercase tracking-tight">Digital Services Provider</p>
                  <p className="text-[#374151] font-black text-sm pt-2">Contact: 07...</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest text-right font-figtree mb-2">Bill To</h3>
                <div className="space-y-0.5 text-sm text-right">
                  <p className="font-extrabold text-[#111827] text-lg leading-tight">{formData.customerName || 'Walking Customer'}</p>
                  <p className="text-[#374151] font-black">{formData.customerPhone || 'Mobile: Not provided'}</p>
                  {formData.customerEmail && (
                    <p className="text-[#6B7280] text-xs font-bold italic">{formData.customerEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description Row (The Dotted Design) */}
            <div className="flex-1 pt-10">
              <div className="w-full border-t-[1.5px] border-[#111827] mb-6"></div>
              
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1 max-w-[70%]">
                    <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Description</h4>
                    <p className="text-lg font-bold text-[#111827]">{formData.description}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Price</h4>
                    <p className="text-2xl font-black text-pace-purple tracking-tight">KES {parseFloat(formData.amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* The "---------" line design */}
                <div className="py-4 overflow-hidden select-none opacity-20 text-[#6B7280] italic text-xs tracking-[0.5em] whitespace-nowrap">
                  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-[#F9FAFB] rounded-xl print:bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Payment Method</p>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-pace-purple truncate">
                        {formData.paymentMethod === 'Paybill' && `PB: ${formData.paybillNumber}`}
                        {formData.paymentMethod === 'Till' && `Till: ${formData.tillNumber}`}
                        {formData.paymentMethod === 'Mobile' && `Mob: ${formData.mobileNumber}`}
                      </p>
                      {formData.paymentMethod === 'Paybill' && formData.accountNumber && (
                        <p className="text-[10px] font-black text-[#374151]">Acc: {formData.accountNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl print:bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xs font-black text-pace-green flex items-center gap-1.5 uppercase transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </p>
                  </div>
                  <div className="p-4 bg-[#F9FAFB] rounded-xl print:bg-[#F9FAFB] border border-[#E5E7EB]">
                    <p className="text-[9px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Due Date</p>
                    <p className="text-xs font-black text-[#111827]">{new Date(formData.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stamp Simulation */}
            <div className="relative h-24 flex items-center justify-end">
              <AnimatePresence>
                {formData.isStamped && (
                  <motion.div 
                    initial={{ scale: 2, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 0.9, rotate: -15 }}
                    className="absolute -top-10 right-20 w-32 h-32 border-4 border-[#86198f]/60 rounded-full flex flex-col items-center justify-center p-2 select-none pointer-events-none"
                    style={{ filter: 'contrast(1.2) brightness(1.1) saturate(1.2)' }}
                  >
                    <div className="text-[10px] font-black text-[#86198f]/70 uppercase tracking-tighter">OFFICIAL STAMP</div>
                    <div className="text-base font-black text-[#86198f] tracking-tighter leading-none my-0.5">PACE WISP</div>
                    <div className="text-[8px] font-bold text-[#86198f]/70">{formData.date}</div>
                    <div className="absolute inset-0 border-t-4 border-[#86198f]/20 rotate-45 scale-[1.2]"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="pt-10 border-t border-[#F3F4F6] space-y-4">
              <div className="bg-pace-purple/[0.03] p-6 rounded-2xl print:bg-[#F4F0FF] border-l-4 border-pace-purple">
                <p className="text-[12px] font-black text-pace-purple mb-1 uppercase tracking-wider">Terms and Policy:</p>
                <p className="text-[11px] text-[#111827] font-black leading-relaxed opacity-80">
                  {formData.terms} {formData.policy}
                </p>
              </div>
              <div className="flex justify-between items-center opacity-60">
                <p className="text-[9px] font-medium text-[#9CA3AF]">
                  Generated by PacePapers Systems • VERIFY: <span className="font-mono font-bold">{formData.verificationHash}</span>
                </p>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB]"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #invoice-paper {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          .md\\:rounded-2xl {
            border-radius: 0 !important;
          }
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
