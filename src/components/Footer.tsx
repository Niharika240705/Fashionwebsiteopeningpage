import { Instagram, Youtube, Linkedin } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribe:', email);
    setEmail('');
  };

  return (
    <footer className="w-full bg-black border-t border-white/10">
      {/* Main Footer Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl tracking-tighter text-white">PERSONA</h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto sm:mx-0">
              Discover your style identity through personalized fashion curation
            </p>
            <p className="text-xs text-white/50 italic">
              Where style meets substance
            </p>
          </div>

          {/* About & Info */}
          <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-4 sm:mb-5 text-white">
              About & Info
            </h3>
            <nav className="flex flex-col space-y-3">
              <a 
                href="#about" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                About Us
              </a>
              <a 
                href="#story" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Our Story
              </a>
              <a 
                href="#careers" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Careers
              </a>
              <a 
                href="#press" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Press
              </a>
            </nav>
          </div>

          {/* Support & Legal */}
          <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-4 sm:mb-5 text-white">
              Support & Legal
            </h3>
            <nav className="flex flex-col space-y-3">
              <a 
                href="#help" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Help Center
              </a>
              <a 
                href="#faq" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                FAQs
              </a>
              <a 
                href="#contact" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Contact Us
              </a>
              <a 
                href="#privacy" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#terms" 
                className="text-sm text-white hover:text-[#CCCCCC] transition-colors"
              >
                Terms & Conditions
              </a>
            </nav>
          </div>

          {/* Social & Community */}
          <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
            <h3 className="text-xs tracking-[0.2em] uppercase mb-4 sm:mb-5 text-white">
              Social & Community
            </h3>
            
            {/* Social Icons */}
            <div className="flex gap-4 justify-center sm:justify-start mb-6">
              <motion.a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} className="text-white" />
              </motion.a>
              
              <motion.a
                href="https://pinterest.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Pinterest"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446C17.523 22 22 17.523 22 12S17.523 2 12 2z"/>
                </svg>
              </motion.a>
              
              <motion.a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="YouTube"
              >
                <Youtube size={18} strokeWidth={1.5} className="text-white" />
              </motion.a>
              
              <motion.a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-white/20 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="LinkedIn"
              >
                <Linkedin size={18} strokeWidth={1.5} className="text-white" />
              </motion.a>
            </div>

            {/* Newsletter */}
            <div className="space-y-3">
              <p className="text-sm text-white/60">
                Stay updated with the latest trends
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="flex-1 px-4 py-2.5 bg-transparent border border-white/20 rounded-full text-sm outline-none focus:border-white/40 transition-colors text-white placeholder:text-white/40"
                  required
                />
                <motion.button
                  type="submit"
                  className="px-6 py-2.5 bg-white text-black rounded-full text-sm tracking-wide hover:bg-[#CCCCCC] transition-colors shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-6">
          <p className="text-center text-xs text-white/40 tracking-wide">
            © 2025 PERSONA. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}