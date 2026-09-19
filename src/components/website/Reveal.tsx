import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { DUR, EASE } from '../../lib/motion';

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
};

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 16, className, once = true }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15, margin: '0px 0px -12% 0px' }}
      transition={{ duration: DUR.medium, delay, ease: EASE.decel }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
