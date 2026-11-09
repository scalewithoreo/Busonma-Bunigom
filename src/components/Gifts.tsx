import { useState, FC } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CreditCard } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';

interface GiftsProps {
  onNotify: (title: string, message?: string) => void;
}

export const Gifts: FC<GiftsProps> = ({ onNotify }) => {
  const { wedding } = useWedding();
  const accountDetails = wedding.bankAccounts;
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
    const fullText = `${wedding.couple.title} Wedding Gift Details\n` + 
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
            className="font-serif italic text-2xl sm:text-3xl text-brand-goldDark font-normal mt-2"
          >
            Bless Our New Beginning
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="font-sans text-brand-muted text-[17px] sm:text-lg mt-5 leading-relaxed"
          >
            Your presence at our celebration is the greatest gift of all. If you wish to honor us with a gift, we have provided our bank details below.
          </motion.p>
        </div>

        {/* Bank Account Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto mb-10">
          {accountDetails.map((account, idx) => (
            <motion.div
              key={account.accountNumber}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-brand-sand/40 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs uppercase font-mono tracking-widest text-brand-goldDark font-semibold">
                  {account.bankName}
                </span>
                <CreditCard className="w-5 h-5 text-brand-goldDark" />
              </div>

              <div className="mb-8">
                <p className="font-serif text-2xl sm:text-3xl text-brand-espresso mb-1">
                  {account.accountName}
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="font-mono text-2xl sm:text-3xl tracking-widest text-brand-goldDark font-bold">
                    {account.accountNumber}
                  </span>
                  <button
                    onClick={() => handleCopy(account.accountNumber, `${account.accountName}'s Account Number`)}
                    className="p-2.5 rounded-full hover:bg-brand-cream text-brand-espresso transition-colors"
                    aria-label="Copy Account Number"
                  >
                    {copiedField === `${account.accountName}'s Account Number` ? (
                      <Check className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-brand-muted hover:text-brand-espresso" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleCopy(account.accountNumber, `${account.accountName}'s Account Number`)}
                className="w-full py-3 rounded-xl border border-brand-sand hover:border-brand-goldDark text-brand-espresso text-xs uppercase tracking-wider font-semibold transition-all hover:bg-brand-cream"
              >
                {copiedField === `${account.accountName}'s Account Number` ? 'Copied!' : 'Copy Account Number'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Copy All Details Button */}
        <div className="text-center">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-espresso hover:bg-brand-charcoal text-brand-cream font-sans text-xs uppercase font-semibold tracking-widest transition-all duration-300 shadow-md"
          >
            {copiedField === 'all' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>All Details Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-brand-gold" />
                <span>Copy All Account Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
