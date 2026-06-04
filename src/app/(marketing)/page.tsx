'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Menu, 
  X, 
  ChevronDown, 
  Check, 
  ArrowRight, 
  Star, 
  FileText, 
  Send, 
  Percent, 
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const planPrices = {
    free: 0,
    pro: isAnnual ? Math.round(299 * 0.8) : 299,
    business: isAnnual ? Math.round(599 * 0.8) : 599
  };

  const faqs = [
    {
      question: "Is it really free?",
      answer: "Yes! Our Free plan allows you to create up to 5 GST invoices per month with all essential billing calculations and basic templates. No credit card is required to sign up."
    },
    {
      question: "Is my data safe?",
      answer: "Absolutely. We secure your details using industry-standard SSL encryption and host our database on Supabase with restricted Row Level Security (RLS) policies. Your financial data is accessible only by you."
    },
    {
      question: "Does it work for unregistered (composition) businesses?",
      answer: "Yes, InvoiceWala works perfectly for both GST-registered and unregistered/composition businesses. You can leave the GSTIN field blank during onboarding and generate plain bills of supply."
    },
    {
      question: "Can I customize the invoice template?",
      answer: "Yes, you can upload your business logo, authorized signature, choose from 6 professional color themes, and set default payment terms or custom notes inside your invoice settings dashboard."
    },
    {
      question: "How do I pay — UPI/card?",
      answer: "We support all major payment modes in India, including UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Net Banking, and wallets, processed securely via Razorpay."
    }
  ];

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. NAVBAR */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Invoice<span className="text-[#6C63FF]">Wala</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-[#6C63FF] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#6C63FF] transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-[#6C63FF] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#6C63FF] transition-colors">FAQ</a>
            </nav>

            {/* CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-semibold text-slate-700 hover:text-[#6C63FF] transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="text-sm font-semibold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-sm hover:shadow transition-all px-4 py-2.5 rounded-lg"
              >
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-[#6C63FF] hover:bg-slate-50 rounded-lg"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-[#6C63FF] hover:bg-slate-50 rounded-lg"
            >
              How It Works
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-[#6C63FF] hover:bg-slate-50 rounded-lg"
            >
              Pricing
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-[#6C63FF] hover:bg-slate-50 rounded-lg"
            >
              FAQ
            </a>
            <hr className="border-slate-100" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Link 
                href="/login" 
                className="text-center font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors py-2.5 rounded-lg text-sm"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="text-center font-semibold text-white bg-[#6C63FF] hover:bg-[#574ee6] transition-colors py-2.5 rounded-lg text-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left animate-fade-in-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#6C63FF] rounded-full text-xs font-semibold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Invoicing Built for Bharat
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                GST Invoices in <span className="text-[#6C63FF] relative">30 Seconds</span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Stop making invoices in Excel. InvoiceWala generates professional GST invoices, sends them to clients, and tracks payments — all in one place.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/signup" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all px-8 py-3.5 rounded-xl group"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a 
                  href="#features" 
                  className="w-full sm:w-auto text-center text-base font-semibold text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-8 py-3.5 rounded-xl transition-all"
                >
                  See how it works
                </a>
              </div>

              {/* Social Proof */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                {/* Avatars */}
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-indigo-200 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700">AS</div>
                  <div className="w-9 h-9 rounded-full bg-emerald-200 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">PP</div>
                  <div className="w-9 h-9 rounded-full bg-amber-200 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700">RV</div>
                  <div className="w-9 h-9 rounded-full bg-sky-200 border-2 border-white flex items-center justify-center text-xs font-bold text-sky-700">JD</div>
                </div>
                <div className="text-sm font-medium text-slate-600">
                  Join <span className="font-bold text-slate-950">2,000+</span> Indian freelancers & consultants
                </div>
              </div>
            </div>

            {/* Hero Right Mockup */}
            <div className="lg:col-span-6 animate-fade-in-up animation-delay-200">
              <div className="relative mx-auto max-w-[540px] lg:max-w-none">
                {/* Gradient Glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#6C63FF] to-indigo-400 rounded-2xl blur-lg opacity-20" />
                
                {/* Simulated Invoice Mockup UI */}
                <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-xs">
                  {/* Browser Header */}
                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white border border-slate-200 rounded-md py-1 px-3 text-[10px] text-slate-400 truncate max-w-xs mx-auto text-center font-mono">
                      invoicewala.in/dashboard/invoices/new
                    </div>
                  </div>

                  {/* Mock Invoice Form Content */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Invoice Meta */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[#6C63FF] text-sm flex items-center gap-1">
                          <Receipt className="w-4 h-4" />
                          InvoiceWala
                        </div>
                        <p className="text-slate-400 text-[10px] mt-0.5">Freelancer Billing Suite</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                          Tax Invoice
                        </span>
                        <div className="font-semibold text-slate-900 mt-1">INV-2026-008</div>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* From & Bill To */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">From</span>
                        <div className="font-bold text-slate-800 mt-0.5">Acme Design Studio</div>
                        <div className="text-slate-500 text-[10px]">Mumbai, MH (GSTIN: 27AAAAA0000A1Z)</div>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Bill To</span>
                        <div className="font-bold text-slate-800 mt-0.5">Bharat Digital Corp</div>
                        <div className="text-slate-500 text-[10px]">Bengaluru, KA (GSTIN: 29BBBBB1111B2Z)</div>
                      </div>
                    </div>

                    {/* Table mockup */}
                    <div className="border border-slate-100 rounded-lg overflow-hidden mt-3">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold text-[9px] uppercase tracking-wide border-b border-slate-100">
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-1 text-right">Qty</th>
                            <th className="py-2 px-1 text-right">Rate</th>
                            <th className="py-2 px-1 text-right">GST</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-800">UI/UX Design Consultation</td>
                            <td className="py-2 px-1 text-right text-slate-600">1</td>
                            <td className="py-2 px-1 text-right text-slate-600">₹80,000</td>
                            <td className="py-2 px-1 text-right text-slate-600 font-semibold text-indigo-600">18%</td>
                            <td className="py-2 px-3 text-right text-slate-800 font-semibold">₹94,400</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-800">Frontend React Development</td>
                            <td className="py-2 px-1 text-right text-slate-600">1</td>
                            <td className="py-2 px-1 text-right text-slate-600">₹50,000</td>
                            <td className="py-2 px-1 text-right text-slate-600 font-semibold text-indigo-600">18%</td>
                            <td className="py-2 px-3 text-right text-slate-800 font-semibold">₹59,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* GST Summary & Grand Total */}
                    <div className="flex justify-between items-end pt-2">
                      <div className="text-[10px] text-slate-500 italic">
                        Place of Supply: 29-Karnataka (IGST Applied)
                      </div>
                      <div className="w-1/2 space-y-1.5 text-right font-medium text-slate-600">
                        <div className="flex justify-between text-[11px]">
                          <span>Subtotal:</span>
                          <span className="font-semibold text-slate-800">₹1,30,000.00</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>IGST (18%):</span>
                          <span className="font-semibold text-[#6C63FF]">₹23,400.00</span>
                        </div>
                        <hr className="border-slate-100" />
                        <div className="flex justify-between text-xs font-bold text-slate-900">
                          <span>Grand Total:</span>
                          <span className="text-[#6C63FF] text-sm">₹1,53,400.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRUST BAR */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
            Used by top Indian freelancers at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 md:gap-x-16 text-slate-500 font-extrabold text-sm sm:text-base select-none">
            <span className="hover:text-slate-800 transition-colors tracking-tight">RAZORPAY</span>
            <span className="hover:text-slate-800 transition-colors tracking-tight">SWIGGY</span>
            <span className="hover:text-slate-800 transition-colors tracking-tight">ZOMATO</span>
            <span className="hover:text-slate-800 transition-colors tracking-tight font-sans italic">cred</span>
            <span className="hover:text-slate-800 transition-colors tracking-tight">WIPRO</span>
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to manage business billing
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Ditch complicated spreadsheets. Create GST compliant templates, invoice buyers directly, and get paid with simple integrations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/30 p-8 rounded-2xl transition-all group animate-fade-in-up animation-delay-100">
              <div className="w-12 h-12 bg-indigo-50 text-[#6C63FF] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">One-click PDF</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate professional, tax-ready, and GST-compliant invoices as clean A4 PDF documents instantly to share with customers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/30 p-8 rounded-2xl transition-all group animate-fade-in-up animation-delay-200">
              <div className="w-12 h-12 bg-indigo-50 text-[#6C63FF] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Percent className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Auto GST Calculation</h3>
              <p className="text-slate-600 leading-relaxed">
                Intelligently computes CGST/SGST for local trade or IGST for interstate business transactions automatically based on place of supply.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/30 p-8 rounded-2xl transition-all group animate-fade-in-up animation-delay-300">
              <div className="w-12 h-12 bg-indigo-50 text-[#6C63FF] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Send & Track</h3>
              <p className="text-slate-600 leading-relaxed">
                Email generated invoices directly to clients through beautiful templates and keep track of status (draft, sent, paid, overdue).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Get paid in 3 simple steps
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Designed to be intuitive, clean, and simple. Set up your brand within minutes.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Connective Line */}
            <div className="hidden md:block absolute top-1/2 left-4 px-4 w-[calc(100%-8rem)] h-0.5 bg-indigo-100 z-0 -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/55 text-center flex flex-col items-center animate-fade-in-up animation-delay-100">
                <div className="w-12 h-12 bg-[#6C63FF] text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-indigo-100 mb-6">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create your account</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Sign up for free in seconds. Log in directly using email or instant one-click authentication.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/55 text-center flex flex-col items-center animate-fade-in-up animation-delay-200">
                <div className="w-12 h-12 bg-[#6C63FF] text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-indigo-100 mb-6">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Add your details & GSTIN</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Input your business details, address, bank info, and upload your brand logo or authorized signature.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/55 text-center flex flex-col items-center animate-fade-in-up animation-delay-300">
                <div className="w-12 h-12 bg-[#6C63FF] text-white rounded-full flex items-center justify-center font-extrabold text-lg shadow-lg shadow-indigo-100 mb-6">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create & send invoice</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                  Select a client, add line items with GST details, and download the PDF or email it straight to client&apos;s inbox.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Start billing for free, and upgrade seamlessly as your business customer volume expands.
            </p>

            {/* Pricing Toggle */}
            <div className="pt-4 flex items-center justify-center gap-4">
              <span className={`text-sm font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
              <button 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 bg-indigo-100 text-[#6C63FF] rounded-full p-1 transition-colors relative flex items-center focus:outline-none"
              >
                <div className={`w-4 h-4 bg-[#6C63FF] rounded-full transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-semibold ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}>Annual</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Save 20%
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            
            {/* Free Plan */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all animate-fade-in-up animation-delay-100">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Free</h3>
                  <p className="text-slate-500 text-sm mt-1">Perfect for solo freelancers just starting out</p>
                </div>
                
                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-extrabold tracking-tight">₹0</span>
                  <span className="text-slate-500 text-sm font-semibold ml-1">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="space-y-3.5 text-slate-600 text-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Create up to <strong>5 invoices</strong> / month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Auto GST Calculation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Download PDF invoices</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-350 line-through">
                    <Check className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Send emails directly</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-slate-350 line-through">
                    <Check className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Razorpay Subscription link</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link 
                  href="/signup" 
                  className="block text-center text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl transition-colors"
                >
                  Start Billing Free
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-[#6C63FF] p-8 rounded-2xl flex flex-col justify-between hover:shadow-2xl transition-all relative animate-fade-in-up animation-delay-200">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#6C63FF] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Most Popular
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pro</h3>
                  <p className="text-slate-500 text-sm mt-1">For active freelancers needing unlimited bills</p>
                </div>
                
                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-extrabold tracking-tight">₹{planPrices.pro}</span>
                  <span className="text-slate-500 text-sm font-semibold ml-1">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="space-y-3.5 text-slate-600 text-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#6C63FF] shrink-0" />
                    <span>Create <strong>Unlimited Invoices</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#6C63FF] shrink-0" />
                    <span>Auto GST Calculation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#6C63FF] shrink-0" />
                    <span>Download PDF + Send Email</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#6C63FF] shrink-0" />
                    <span>Razorpay Subscription link</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#6C63FF] shrink-0" />
                    <span>Automated payment reminders</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link 
                  href="/signup" 
                  className="block text-center text-sm font-bold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-md shadow-indigo-100 hover:shadow-indigo-200 py-3 rounded-xl transition-all"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </div>

            {/* Business Plan */}
            <div className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col justify-between hover:shadow-xl transition-all animate-fade-in-up animation-delay-300">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Business</h3>
                  <p className="text-slate-500 text-sm mt-1">For growing consultancies and small firms</p>
                </div>
                
                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-extrabold tracking-tight">₹{planPrices.business}</span>
                  <span className="text-slate-500 text-sm font-semibold ml-1">/month</span>
                </div>

                <hr className="border-slate-100" />

                <ul className="space-y-3.5 text-slate-600 text-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span><strong>Everything in Pro plan</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom domain (billing.yourbrand.in)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Custom logo + signature storage</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Multi-member logins (up to 3 users)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>24/7 Premium Whatsapp support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link 
                  href="/signup" 
                  className="block text-center text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl transition-colors"
                >
                  Get Business
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Loved by Indian freelancers
            </h2>
            <p className="text-base sm:text-lg text-slate-500">
              Here is what consultants and creators across Bharat say about us.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white border border-slate-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-fade-in-up animation-delay-100 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  &ldquo;Calculated CGST and SGST correctly for my clients in Bangalore, while applying IGST for North India. It saves me so much spreadsheet headache every month.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-bold flex items-center justify-center text-sm">
                  AS
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Amit Sharma</h4>
                  <p className="text-slate-500 text-xs">UI Designer, Mumbai</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white border border-slate-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-fade-in-up animation-delay-200 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  &ldquo;Perfect for sending PDFs directly to accounts departments. The automatic conversion of amounts into words (Rupees format) is beautiful and compliant.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-bold flex items-center justify-center text-sm">
                  PP
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Priya Patel</h4>
                  <p className="text-slate-500 text-xs">Software Consultant, Bengaluru</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white border border-slate-150 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow animate-fade-in-up animation-delay-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-650 text-sm leading-relaxed">
                  &ldquo;The Razorpay billing integrations let my clients complete outstanding fees via UPI in just one click. My collections have never been this fast.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] font-bold flex items-center justify-center text-sm">
                  RV
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Rahul Verma</h4>
                  <p className="text-slate-500 text-xs">Marketing Consultant, New Delhi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-[#6C63FF]" />
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-500">
              Clear answers to common questions about GST invoicing and compliance.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100 max-w-3xl mx-auto animate-fade-in-up">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div key={index} className="py-5">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center text-left focus:outline-none group"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-[#6C63FF] transition-colors pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 group-hover:text-[#6C63FF] transition-all shrink-0 ${isOpen ? 'rotate-180 text-[#6C63FF]' : ''}`} 
                    />
                  </button>
                  <div 
                    className={`mt-2 text-slate-500 text-sm leading-relaxed overflow-hidden transition-all duration-300 max-h-0 ${isOpen ? 'max-h-40 mt-3' : ''}`}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            
            {/* Logo and Tagline */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center gap-2 text-white">
                <div className="p-1.5 bg-[#6C63FF] rounded-lg">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  Invoice<span className="text-[#6C63FF]">Wala</span>
                </span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">
                Superfast GST billing platform built for modern Indian small businesses, freelancers, and consultants.
              </p>
              <div className="text-xs text-slate-500 font-medium">
                Made with ❤️ in India 🇮🇳
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="font-bold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

          </div>

          <hr className="border-slate-800 my-8" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} InvoiceWala. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300">Privacy</a>
              <span>&middot;</span>
              <a href="#" className="hover:text-slate-300">Terms</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
