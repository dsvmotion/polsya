import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

interface ScrollAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollAnimation({ children, className, delay = 0 }: ScrollAnimationProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
