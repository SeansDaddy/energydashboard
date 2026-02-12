
import React from 'react';

export const COLORS = {
  primary: '#22d3ee',
  secondary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  bg: '#020617',
  card: 'rgba(15, 23, 42, 0.6)',
};

export const HEALTH_LEVELS = [
  { range: [90, 100], label: '优', color: 'text-emerald-400' },
  { range: [80, 89], label: '良', color: 'text-cyan-400' },
  { range: [60, 79], label: '中', color: 'text-orange-400' },
  { range: [0, 59], label: '差', color: 'text-rose-400' },
];
