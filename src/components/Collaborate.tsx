import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendEmail } from '../utils/email';

interface CollaborateProps {
  onNotify: (title: string, message?: string) => void;
}

export const Collaborate: FC<CollaborateProps> = ({ onNotify }) => {
  const [formData, setFormData] = useState({ name: '', brandPage: '', contact: '', offer: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Create HTML email body
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">
          <h2 style="color: #2b2b2b; margin-bottom: 20px;">New Vendor Collaboration Request</h2>
          <p><strong>Name / Brand:</strong> ${formData.name}</p>
          <p><strong>Brand Page (IG, TikTok):</strong> ${formData.brandPage || 'None provided'}</p>
          <p><strong>Contact Info:</strong> ${formData.contact}</p>
          <p><strong>Offer Details:</strong><br/> ${formData.offer.replace(/\\n/g, '<br/>')}</p>
        </div>
      `;

      // Send to Ore's email
      const res = await sendEmail({
        to: 'oreokunade@gmail.com',
        subject: `Wedding Collab: ${formData.name}`,
        html,
      });

      if (res.success) {
        setSubmitted(true);
        onNotify('Thank you!', 'Your request has been sent. We will be in touch shortly.');
      } else {
        throw new Error(res.error || 'Failed to send email');
      }
    } catch (err: any) {
      console.error('Collaboration form error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="collaborate" className="py-24 sm:py-32 px-4 sm:px-6 bg-white relative border-t border-brand-espresso/10">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
        {/* Text Side */}
        <div className="w-full md:w-1/2">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs tracking-[0.3em] uppercase text-brand-goldDark font-semibold font-sans mb-4"
          >
            Partner With Us
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-serif text-brand-espresso mb-6"
          >
            Creative Collaborations
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-brand-muted text-base sm:text-lg font-sans leading-relaxed space-y-4"
          >
            <p>
              We believe that a beautiful wedding is built by a community of passionate people, and the truth is, we can't do it alone. As we plan our special day, we are incredibly grateful for any support to help bring our dream to life.
            </p>
            <p>
              We are excited to collaborate with talented vendors, artisans, and creatives who are willing to share their craft. Whether you are looking to showcase new ideas, expand your portfolio, or simply bless our union with your talent, your generosity would mean the world to us.
            </p>
            <p className="font-serif italic text-brand-goldDark pt-2">
              If you’d love to be a part of our story, let's connect.
            </p>
          </motion.div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 bg-brand-cream p-8 sm:p-10 rounded-3xl shadow-xl border border-brand-gold/20">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-goldDark">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif text-brand-espresso mb-2">Message Sent</h3>
                <p className="text-brand-muted font-sans">
                  Thank you for reaching out! We are so excited to read your message and will get back to you soon.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-sans text-center">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold tracking-widest uppercase text-brand-espresso/70 mb-2">Name / Brand Name</label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white border border-brand-espresso/10 rounded-xl px-4 py-3 text-brand-espresso font-sans focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-shadow"
                    placeholder="E.g. Jane Doe Photography"
                  />
                </div>
                <div>
                  <label htmlFor="brandPage" className="block text-xs font-semibold tracking-widest uppercase text-brand-espresso/70 mb-2">Brand Page (IG, TikTok)</label>
                  <input
                    type="text"
                    id="brandPage"
                    value={formData.brandPage}
                    onChange={(e) => setFormData(prev => ({ ...prev, brandPage: e.target.value }))}
                    className="w-full bg-white border border-brand-espresso/10 rounded-xl px-4 py-3 text-brand-espresso font-sans focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-shadow"
                    placeholder="E.g. @yourbrand or link to page"
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-xs font-semibold tracking-widest uppercase text-brand-espresso/70 mb-2">Email or Phone Number</label>
                  <input
                    type="text"
                    id="contact"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full bg-white border border-brand-espresso/10 rounded-xl px-4 py-3 text-brand-espresso font-sans focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-shadow"
                    placeholder="How can we reach you?"
                  />
                </div>
                <div>
                  <label htmlFor="offer" className="block text-xs font-semibold tracking-widest uppercase text-brand-espresso/70 mb-2">What you'd love to offer</label>
                  <textarea
                    id="offer"
                    required
                    rows={4}
                    value={formData.offer}
                    onChange={(e) => setFormData(prev => ({ ...prev, offer: e.target.value }))}
                    className="w-full bg-white border border-brand-espresso/10 rounded-xl px-4 py-3 text-brand-espresso font-sans focus:outline-none focus:ring-2 focus:ring-brand-gold/50 transition-shadow resize-none"
                    placeholder="Tell us a bit about your services and how you'd like to collaborate..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-espresso text-brand-cream rounded-xl px-6 py-4 font-sans font-semibold tracking-widest uppercase text-sm hover:bg-brand-charcoal transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-brand-cream/30 border-t-brand-cream rounded-full animate-spin" />
                  ) : (
                    "Send Message"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
