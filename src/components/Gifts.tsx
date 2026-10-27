import { useState, FC } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Heart, CreditCard } from 'lucide-react';

interface GiftsProps {
  onNotify: (title: string, message?: string) => void;
}

export const Gifts: FC<GiftsProps> = ({ onNotify }) => {
  const accountDetails = [
    {
      accountName: 'Oreoluwa Okunade',
      bankName: 'Zenith Bank',
      accountNumber: '2209775057',
    },
    {
      accountName: 'Oluwadara Alao',
      bankName: 'Providus Bank',
      accountNumber: '6506945948',
    }
  ];

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onNotify('Copied to Clipboard!', `${fieldName} has been copied.`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleCopyAll = () => {
    const fullText = `Oreoluwa & Oluwadara Wedding Gift Details\n` + 
      accountDetails.map(acc => `\n${acc.accountName}\nBank: ${acc.bankName}\nAccount: ${acc.accountNumber}`).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedField('all');
    onNotify('All Details Copied!', 'Bank gift details copied to clipboard.');
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  return (
    <section id="gifts" className="py-24 sm:py-32 px-4 sm:px-6 bg-brand-cream relative">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.3em] font-sans font-semibold text-brand-goldDark mb-3"
          >
            Registry & Blessings
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl text-brand-espresso font-normal"
          >
            Gifts
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-serif italic text-2xl sm:text-3xl text-brand-goldDark mt-3"
          >
            Your kindness means a lot
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-brand-muted text-[17px] sm:text-lg font-sans mt-5 leading-relaxed max-w-xl mx-auto"
          >
            {import.meta.env.VITE_SITE_MODE === 'public'
              ? 'We are getting married and will be building our home together. If you would like to support us on this journey, we deeply appreciate your kindness and generosity.'
              : 'We are so grateful for your love and generosity. Your presence is the greatest gift, but should you wish to bless us with a gift, we deeply appreciate your kindness.'}
          </motion.p>
        </div>

        {/* Standalone Bank Account Cards - Side-by-Side without Outer Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {accountDetails.map((account, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl hover:shadow-2xl border border-brand-gold/25 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Subtle gold glow */}
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-gold/10 rounded-full blur-2xl group-hover:bg-brand-gold/15 transition-colors pointer-events-none" />

              <div>
                {/* Header with Bank & Naira Icon */}
                <div className="flex items-center justify-between pb-4 border-b border-brand-espresso/10 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-goldDark text-xl font-serif font-bold">
                      ₦
                    </div>
                    <div>
                      <p className="font-serif text-xl sm:text-2xl text-brand-espresso font-medium">
                        {account.bankName}
                      </p>
                      <p className="text-[10px] font-sans tracking-widest uppercase text-brand-goldDark font-semibold">
                        Direct Bank Transfer
                      </p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-brand-goldDark/50" />
                </div>

                {/* Account Name */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted font-sans font-semibold mb-1">
                    Account Name
                  </p>
                  <p className="font-serif text-2xl sm:text-3xl text-brand-espresso font-normal tracking-wide">
                    {account.accountName}
                  </p>
                </div>
              </div>

              {/* Account Number Box */}
              <div className="bg-brand-cream/60 rounded-2xl p-4 sm:p-5 border border-brand-espresso/5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted font-sans font-semibold mb-0.5">
                    Account Number
                  </p>
                  <p className="font-mono text-2xl sm:text-3xl text-brand-espresso font-bold tracking-wider">
                    {account.accountNumber}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(account.accountNumber, `${account.accountName}'s Account Number`)}
                  className="px-4 py-2.5 rounded-xl bg-brand-espresso hover:bg-brand-charcoal text-brand-cream text-xs font-sans font-bold tracking-wider uppercase flex items-center gap-2 transition-all duration-200 shadow-md hover:scale-105 active:scale-95 shrink-0"
                >
                  {copiedField === `${account.accountName}'s Account Number` ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-brand-gold" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Copy Both Action */}
        <div className="mt-8 text-center">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-brand-cream text-brand-espresso border border-brand-sand/60 text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {copiedField === 'all' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>All Account Details Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-brand-gold" />
                <span>Copy Both Account Details</span>
              </>
            )}
          </button>
        </div>

        {/* Heart note */}
        <div className="mt-12 text-center text-brand-muted text-xs sm:text-[17px] font-sans flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-brand-gold" />
          <span>Thank you for celebrating with us and honoring our union.</span>
        </div>
      </div>
    </section>
  );
};
