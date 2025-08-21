import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/how-it-works' },
      { name: 'Success Stories', href: '/stories' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' }
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety Tips', href: '/safety' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Report Issues', href: '/report' },
      { name: 'FAQ', href: '/faq' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Community Guidelines', href: '/guidelines' },
      { name: 'Data Protection', href: '/data-protection' }
    ],
    social: [
      { 
        name: 'Twitter', 
        href: 'https://twitter.com/hetasinglar', 
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )
      },
      { 
        name: 'Instagram', 
        href: 'https://instagram.com/hetasinglar', 
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12.017 0C8.396 0 7.989.013 7.041.048 6.094.082 5.52.204 5.036.413a5.51 5.51 0 00-1.992 1.299 5.51 5.51 0 00-1.3 1.992C1.537 4.188 1.416 4.762 1.382 5.709.013 6.657 0 7.063 0 10.684v2.632c0 3.621.013 4.027.048 4.975.034.947.156 1.521.365 2.005a5.51 5.51 0 001.299 1.992 5.51 5.51 0 001.992 1.3c.484.208 1.058.33 2.005.364.948.035 1.354.048 4.975.048h2.632c3.621 0 4.027-.013 4.975-.048.947-.034 1.521-.156 2.005-.364a5.51 5.51 0 001.992-1.3 5.51 5.51 0 001.3-1.992c.208-.484.33-1.058.364-2.005.035-.948.048-1.354.048-4.975v-2.632c0-3.621-.013-4.027-.048-4.975-.034-.947-.156-1.521-.364-2.005a5.51 5.51 0 00-1.3-1.992A5.51 5.51 0 0019.5.413C19.016.204 18.442.082 17.495.048 16.547.013 16.141 0 12.52 0h-.503zm-.521 2.168c.382-.004.746-.005 1.02-.005h.503c3.556 0 3.977.01 4.91.044.885.04 1.365.187 1.687.311.424.164.727.361 1.045.679.318.318.515.621.679 1.045.124.322.271.802.311 1.687.034.933.044 1.354.044 4.91v.523c0 3.556-.01 3.977-.044 4.91-.04.885-.187 1.365-.311 1.687-.164.424-.361.727-.679 1.045-.318.318-.621.515-1.045.679-.322.124-.802.271-1.687.311-.933.034-1.354.044-4.91.044h-1.023c-3.556 0-3.977-.01-4.91-.044-.885-.04-1.365-.187-1.687-.311a2.805 2.805 0 01-1.045-.679 2.805 2.805 0 01-.679-1.045c-.124-.322-.271-.802-.311-1.687-.034-.933-.044-1.354-.044-4.91v-1.046c0-3.556.01-3.977.044-4.91.04-.885.187-1.365.311-1.687.164-.424.361-.727.679-1.045a2.805 2.805 0 011.045-.679c.322-.124.802-.271 1.687-.311.932-.034 1.354-.044 4.91-.044zm0 3.675a6.158 6.158 0 100 12.316 6.158 6.158 0 000-12.316zm0 10.148a3.99 3.99 0 110-7.98 3.99 3.99 0 010 7.98zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        )
      },
      { 
        name: 'Facebook', 
        href: 'https://facebook.com/hetasinglar', 
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      },
      { 
        name: 'YouTube', 
        href: 'https://youtube.com/hetasinglar', 
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      },
      { 
        name: 'TikTok', 
        href: 'https://tiktok.com/@hetasinglar', 
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        )
      }
    ]
  };

  const HeartIcon = () => (
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-block"
    >
      <img 
        src="/img/Heart.svg" 
        alt="Heart" 
        className="w-6 h-6 opacity-80"
        style={{ filter: 'hue-rotate(320deg) saturate(1.2)' }}
      />
    </motion.div>
  );

  return (
    <footer className="relative bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 text-gray-800 overflow-hidden">
      {/* Background decoration - no hearts, just subtle gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background: 'linear-gradient(45deg, rgba(236, 72, 153, 0.05), rgba(168, 85, 247, 0.05))'
          }}
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
          style={{
            background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(236, 72, 153, 0.05))'
          }}
          animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center gap-3 mb-6">
                <HeartIcon />
                <span className="text-3xl font-rouge bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                  HetaSinglar
                </span>
                <HeartIcon />
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                Where genuine connections flourish. Join millions who found their perfect match through meaningful conversations and authentic relationships.
              </p>
              <div className="flex gap-4">
                {footerLinks.social.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -2 }}
                    className="w-10 h-10 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:bg-rose-100 hover:text-rose-600 transition-all duration-300 shadow-lg"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Company</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 hover:text-rose-600 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Support</h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 hover:text-rose-600 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Legal</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 hover:text-rose-600 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200">
          <div className="container mx-auto px-6 py-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row justify-between items-center gap-4"
            >
              <div className="text-gray-500 text-sm">
                © {currentYear} HetaSinglar. All rights reserved. Made with{' '}
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block text-rose-500"
                >
                  ❤️
                </motion.span>{' '}
                for meaningful connections.
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <Link to="/terms" className="hover:text-rose-600 transition-colors">
                  Terms
                </Link>
                <Link to="/privacy" className="hover:text-rose-600 transition-colors">
                  Privacy
                </Link>
                <Link to="/cookies" className="hover:text-rose-600 transition-colors">
                  Cookies
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
