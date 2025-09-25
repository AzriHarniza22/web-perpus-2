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
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
    >
      <div className="text-center">
        <div className="relative mb-4">
          <motion.div
            animate={reducedMotion ? {} : { rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
          />
          <motion.div
            animate={reducedMotion ? {} : { rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
          />
        </div>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-medium text-gray-800 dark:text-white mb-2"
          >
            {message}
          </motion.p>
        )}
        {showDots && (
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={
                  reducedMotion
                    ? {}
                    : { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }
                }
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-blue-500 rounded-full"
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
          'border-2 border-blue-500 border-t-transparent rounded-full',
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