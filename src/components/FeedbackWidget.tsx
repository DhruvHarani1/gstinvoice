'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpen = () => {
    setRating(0);
    setComment('');
    setSubmitted(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmitted(true);
      toast.success('Feedback submitted successfully!');
      
      // Auto close after 2.5 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err: unknown) {
      console.error('Error submitting feedback:', err);
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="select-none">
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold py-2.5 px-4 rounded-full shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2 text-xs border border-indigo-400/20"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Share feedback</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !submitting && handleClose()}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-sm bg-white border border-slate-100 rounded-2xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={submitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {submitted ? (
              /* Success Screen */
              <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-center">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-lg">Thank you!</h3>
                  <p className="text-xs text-slate-500 font-semibold px-4">
                    We read every response. Your feedback helps us shape InvoiceWala!
                  </p>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1 pr-6">
                  <h3 className="font-bold text-slate-900 text-base">Share your feedback</h3>
                  <p className="text-xs text-slate-400">
                    How is your experience with InvoiceWala? Let us know!
                  </p>
                </div>

                {/* Stars Rating Selector */}
                <div className="space-y-1.5 text-center py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Your Rating</span>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional comment input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider" htmlFor="feedback-comment">
                    Any suggestions?
                  </label>
                  <textarea
                    id="feedback-comment"
                    rows={3}
                    placeholder="Tell us what you like or what we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:border-[#6C63FF] resize-none"
                  />
                </div>

                {/* Actions */}
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="w-full bg-[#6C63FF] hover:bg-[#5b52eb] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs shadow-md shadow-indigo-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Feedback...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
