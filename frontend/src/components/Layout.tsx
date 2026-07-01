import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  // Animation configuration based on user preference
  const pageVariants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -8,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.15,
        ease: 'easeIn',
      },
    },
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 pt-[56px] flex flex-col">
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          className="flex-1 flex flex-col w-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
};
