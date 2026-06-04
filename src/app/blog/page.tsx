import type { Metadata } from 'next';
import Link from 'next/link';
import { Receipt, ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-posts';

export const metadata: Metadata = {
  title: 'Blog — Invoicing & GST Guides for Indian Freelancers',
  description: 'Read the latest guides, GST compliance tips, tax hacks, and invoicing checklists for Indian freelancers, developers, designers, and consultants.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogIndexPage() {
  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-[#6C63FF] rounded-lg">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Invoice<span className="text-[#6C63FF]">Wala</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-[#6C63FF] transition-colors px-3 py-2">
                Login
              </Link>
              <Link href="/signup" className="text-sm font-semibold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-sm hover:shadow transition-all px-4 py-2.5 rounded-lg">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-50/40 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#6C63FF] rounded-full text-xs font-semibold tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base & Resources
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Invoicing & Tax compliance made <span className="text-[#6C63FF]">Simple</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Practical guides and insights written specifically to help Indian freelancers, consultants, and independent agencies navigate GST, invoicing, and local business finances.
          </p>
        </div>
      </section>

      {/* Blog Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <article 
              key={post.slug} 
              className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/20 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-slate-600">
                    <Tag className="w-3 h-3 text-[#6C63FF]" />
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 hover:text-[#6C63FF] transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>

              <div className="p-6 pt-0 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {post.publishDate}
                </span>
                <Link 
                  href={`/blog/${post.slug}`}
                  className="text-xs font-bold text-[#6C63FF] hover:text-[#554ce6] flex items-center gap-1 hover:underline group"
                >
                  Read article
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* high-converting CTA banner */}
      <section className="bg-slate-900 text-slate-100 py-16 sm:py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop wasting hours on Excel invoicing
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            InvoiceWala is built specifically for Indian service providers. Generate GST-compliant invoices, automatically compute CGST/SGST/IGST, and track collections.
          </p>
          <div>
            <Link 
              href="/signup"
              className="inline-flex items-center gap-2 text-base font-bold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all px-8 py-3.5 rounded-xl group"
            >
              Start Billing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-slate-900 text-center text-xs">
        <div className="space-y-4">
          <p>&copy; {new Date().getFullYear()} InvoiceWala. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
