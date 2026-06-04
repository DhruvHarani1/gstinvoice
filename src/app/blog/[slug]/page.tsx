import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Receipt, ArrowLeft, Clock, Calendar, ChevronRight, Check } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/blog-posts';

interface PostPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

export default function BlogPostPage({ params }: PostPageProps) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

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

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none">
          <Link href="/" className="hover:text-slate-600">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-slate-600">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-500 truncate max-w-[200px] sm:max-w-sm">{post.title}</span>
        </nav>

        {/* Back navigation */}
        <div>
          <Link 
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#6C63FF] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Articles
          </Link>
        </div>

        {/* Header Block */}
        <div className="space-y-6">
          <span className="inline-block bg-indigo-50 border border-indigo-100 text-[#6C63FF] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Metadata info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 border-y border-slate-100 py-3 select-none">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-350" />
              {post.publishDate}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-350" />
              {post.readTime}
            </span>
          </div>
        </div>

        {/* Blog Post Content Body */}
        <div 
          className="text-slate-600 text-sm sm:text-base leading-relaxed space-y-6 
            [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-extrabold [&>h2]:text-slate-900 [&>h2]:pt-6 [&>h2]:border-t [&>h2]:border-slate-50 [&>h2]:mt-8 [&>h2]:mb-3
            [&>p]:mb-4
            [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:mb-6
            [&>strong]:text-slate-900 [&>strong]:font-bold"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Side/Bottom Signup CTA Box */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 sm:p-8 mt-12 grid sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-8 space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              Are you an Indian freelancer ready to simplify your billing?
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              Create compliant GST invoices, automatically split local/interstate taxes, print PDFs, and get paid via Razorpay integrations.
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 text-[11px] sm:text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Free up to 5 invoices/mo
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Auto CGST/SGST/IGST splits
              </li>
            </ul>
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto text-center text-sm font-bold text-white bg-[#6C63FF] hover:bg-[#574ee6] shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all px-6 py-3 rounded-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </main>

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
