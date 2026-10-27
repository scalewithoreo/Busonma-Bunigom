import { useState, useEffect, FC } from 'react';
import { Menu, X, Heart, Users, Image as ImageIcon, Palette, ShoppingBag, HelpCircle, VolumeX } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audio';

interface NavbarProps {
  onOpenRsvp: () => void;
}

export const Navbar: FC<NavbarProps> = ({ onOpenRsvp }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(audioManager.isPlaying);
  const [isMuted, setIsMuted] = useState(audioManager.isMuted);
  const [activeSection, setActiveSection] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    audioManager.init();
    const unsubscribe = audioManager.subscribe(() => {
      setIsPlaying(audioManager.isPlaying);
      setIsMuted(audioManager.isMuted);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isPublicMode = import.meta.env.VITE_SITE_MODE === 'public';

  const navLinks = [
    { name: 'Welcome', href: '/#welcome', icon: Heart },
    ...(!isPublicMode ? [{ name: 'Programme', href: '/#programme', icon: Heart }] : []),
    ...(!isPublicMode ? [{ name: 'Colours', href: '/#colours', icon: Palette }] : []),
    { name: 'Wishlist', href: '/wishlist', icon: ShoppingBag },
    ...(!isPublicMode ? [{ name: 'Q & A', href: '/#qa', icon: HelpCircle }] : []),
    ...(!isPublicMode ? [{ name: 'RSVP', href: '/#rsvp', icon: Users }] : []),
    { name: 'Gallery', href: '/#gallery', icon: ImageIcon },
  ];

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    navLinks.forEach((link) => {
      if (link.href.startsWith('/#')) {
        const id = link.href.replace('/#', '');
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      }
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href === '/wishlist') {
      if (location.pathname === '/wishlist') {
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        navigate('/wishlist');
        window.scrollTo(0, 0);
      }
    } else if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      if (location.pathname === '/') {
        const element = document.getElementById(id);
        if (element) {
          if ((window as any).lenis) {
            (window as any).lenis.scrollTo(element, { offset: -20 });
          } else {
            element.scrollIntoView({ behavior: 'smooth' });
          }
          window.history.pushState(null, '', href);
        }
      } else {
        navigate(href);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled || location.pathname !== '/'
            ? 'bg-brand-espresso/95 backdrop-blur-md py-3 shadow-xl'
            : 'bg-gradient-to-b from-black/75 via-black/35 to-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center group transition-transform duration-300 hover:scale-105"
          >
            <img  decoding="sync" 
              src="/assets/logo.png" 
              alt="O & D Logo" 
              className="h-16 sm:h-[90px] w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isWishlist = link.href === '/wishlist';
              const sectionId = link.href.replace('/#', '');
              const isActive = isWishlist 
                ? location.pathname === '/wishlist' 
                : location.pathname === '/' && activeSection === sectionId;
                
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-xs font-sans tracking-[0.2em] uppercase transition-colors duration-200 relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-brand-gold after:transition-all after:duration-300 ${
                    isActive 
                      ? 'text-brand-gold after:w-full' 
                      : 'text-brand-cream/80 hover:text-brand-gold after:w-0 hover:after:w-full'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* CTA Button - Clean, Borderless */}
          <div className="hidden sm:flex items-center gap-4">
            {!isPublicMode && (
              <button
                onClick={onOpenRsvp}
                className="px-6 py-2.5 rounded-full bg-brand-gold hover:bg-brand-cream text-brand-espresso text-xs font-sans font-semibold tracking-widest uppercase transition-all duration-300 shadow-md hover:scale-105"
              >
                RSVP Now
              </button>
            )}
          </div>

          {/* Mobile Right Actions: Music Button & Burger Menu horizontally aligned */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => audioManager.toggle()}
              aria-label={isMuted || !isPlaying ? 'Play wedding song' : 'Mute wedding song'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-espresso/90 border border-brand-gold/35 text-brand-cream text-[10px] font-sans font-semibold tracking-wider uppercase shadow-md active:scale-95 transition-all"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold shrink-0">
                {isMuted ? (
                  <VolumeX className="w-2.5 h-2.5 text-brand-muted" />
                ) : (
                  <div className="flex items-end justify-center gap-0.5 h-2.5 w-2.5">
                    <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-full" />
                    <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_1.1s_ease-in-out_infinite] h-2/3" />
                    <span className="w-0.5 bg-brand-gold rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-4/5" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-brand-cream tracking-wider">
                {isMuted || !isPlaying ? 'MUTED' : 'PLAYING'}
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-brand-cream hover:text-brand-gold transition-colors flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-[#1a1410] flex flex-col justify-center items-center p-6 md:hidden animate-fade-in">
          <div className="text-center mb-8">
            <h3 className="font-alex text-4xl text-brand-cream">Oreoluwa & Oluwadara</h3>
            <p className="text-brand-gold text-xs tracking-widest uppercase mt-2">
              {isPublicMode ? 'December 2026' : 'December 12, 2026'}
            </p>
          </div>

          <div className="flex flex-col gap-6 text-center w-full max-w-xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center justify-center gap-3 text-lg font-serif text-brand-cream hover:text-brand-gold transition-colors py-2"
                >
                  <Icon className="w-4 h-4 text-brand-gold" />
                  <span>{link.name}</span>
                </a>
              );
            })}

            {!isPublicMode && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenRsvp();
                }}
                className="mt-4 w-full py-3.5 rounded-full bg-brand-gold text-brand-espresso font-sans text-[17px] font-semibold tracking-widest uppercase hover:bg-brand-cream transition-colors shadow-lg"
              >
                Confirm Attendance
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
