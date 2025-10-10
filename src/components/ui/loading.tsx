'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingProps {
  variant?: 'fullscreen' | 'inline' | 'skeleton';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showDots?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const FullscreenLoading: React.FC<{ message?: string; showDots?: boolean }> = ({
  message,
  showDots = true,
}) => {
  const reducedMotion = useReducedMotion();

  const bgAnimate = reducedMotion
    ? {}
    : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] };

  const particleVariants = {
    animate: (i: number) => ({
      y: [0, -20, 0],
      x: [0, Math.sin(i) * 10, 0],
      rotate: [0, 360],
      transition: {
        duration: 4 + i * 0.5,
        repeat: Infinity,
        delay: i * 0.2
      }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, backgroundPosition: '0% 50%' }}
      animate={{ opacity: 1, ...bgAnimate }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 0.3 },
        backgroundPosition: { duration: 20, repeat: Infinity, ease: 'linear' },
      }}
      style={{ backgroundSize: '400% 400%' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900 overflow-hidden"
    >
      {/* Floating Particles */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          variants={particleVariants}
          custom={0}
          animate="animate"
          className="absolute top-20 left-10 w-32 h-32 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          variants={particleVariants}
          custom={1}
          animate="animate"
          className="absolute top-40 right-10 w-24 h-24 bg-secondary-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          variants={particleVariants}
          custom={2}
          animate="animate"
          className="absolute bottom-32 left-1/2 w-28 h-28 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          variants={particleVariants}
          custom={3}
          animate="animate"
          className="absolute top-1/4 right-1/4 w-20 h-20 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          variants={particleVariants}
          custom={4}
          animate="animate"
          className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[200px]">
        <div className="relative">
          {/* Enhanced Spinner with Gradient */}
          <motion.div
            animate={reducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-primary via-secondary to-accent p-1"
          >
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <motion.div
                animate={reducedMotion ? {} : { rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-transparent border-t-primary border-r-secondary rounded-full"
              />
            </div>
          </motion.div>

          {/* Pulsing Ring */}
          <motion.div
            animate={reducedMotion ? {} : { scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border-2 border-primary/50"
          />
        </div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-medium text-gray-800 dark:text-white mt-6 text-center"
          >
            {message}
          </motion.p>
        )}

        {showDots && (
          <div className="flex justify-center space-x-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={
                  reducedMotion
                    ? {}
                    : { scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-3 h-3 bg-gradient-to-r from-primary to-secondary rounded-full shadow-lg"
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const InlineLoading: React.FC<{
  size: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
}> = ({ size, message }) => {
  const reducedMotion = useReducedMotion();
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={cn('flex items-center space-x-2', message ? 'space-x-2' : '')}>
      <motion.div
        animate={reducedMotion ? {} : { rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'border-2 border-primary border-t-transparent rounded-full',
          sizes[size]
        )}
      />
      {message && (
        <span className="text-sm text-gray-600 dark:text-gray-300">{message}</span>
      )}
    </div>
  );
};

const SkeletonLoading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden"
    >
      {children}
      {!reducedMotion && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/20 to-transparent"
        />
      )}
    </motion.div>
  );
};

const Loading: React.FC<LoadingProps> = ({
  variant = 'inline',
  size = 'md',
  message,
  showDots = true,
  className,
  children,
}) => {

  const content = (() => {
    switch (variant) {
      case 'fullscreen':
        return <FullscreenLoading message={message} showDots={showDots} />;
      case 'inline':
        return <InlineLoading size={size} message={message} />;
      case 'skeleton':
        return <SkeletonLoading>{children}</SkeletonLoading>;
      default:
        return null;
    }
  })();

  return <div className={className}>{content}</div>;
};

export { Loading };