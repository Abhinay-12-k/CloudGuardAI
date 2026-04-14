import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { NodeStatus, Severity } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function getStatusColor(status: NodeStatus | string): string {
  switch (status) {
    case 'healthy':
    case 'operational': return '#10b981';
    case 'warning':
    case 'degraded': return '#f59e0b';
    case 'critical':
    case 'failed':
    case 'down': return '#ef4444';
    case 'maintenance': return '#6366f1';
    default: return '#4a5a8a';
  }
}

export function getSeverityColor(severity: Severity | string): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#6366f1';
    case 'low': return '#10b981';
    case 'info': return '#4a5a8a';
    default: return '#4a5a8a';
  }
}

export function getSeverityBg(severity: Severity | string): string {
  switch (severity) {
    case 'critical': return '#ef444420';
    case 'high': return '#f59e0b20';
    case 'medium': return '#6366f120';
    case 'low': return '#10b98120';
    case 'info': return '#4a5a8a20';
    default: return '#4a5a8a20';
  }
}

export function getMetricColor(value: number, type: 'cpu' | 'memory' | 'disk' | 'error'): string {
  if (type === 'error') {
    if (value > 5) return '#ef4444';
    if (value > 2) return '#f59e0b';
    return '#10b981';
  }
  if (value > 90) return '#ef4444';
  if (value > 75) return '#f59e0b';
  return '#10b981';
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
