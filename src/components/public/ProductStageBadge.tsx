import React from 'react';
import type { ProductStage } from '../../types';

interface ProductStageBadgeProps {
  stage?: ProductStage | string;
  className?: string;
}

export const getStageMeta = (stage?: string) => {
  const normalized = (stage || '').toLowerCase().replace(/[\s_-]+/g, '_');
  switch (normalized) {
    case 'under_development':
      return {
        label: 'Under Development',
        color: '#F59E0B',
        bgClass: 'bg-amber-500/10 text-[#F59E0B] border-[#F59E0B]/30',
        dotClass: 'bg-[#F59E0B]',
      };
    case 'ready_for_deployment':
      return {
        label: 'Ready for Deployment',
        color: '#2563EB',
        bgClass: 'bg-blue-500/10 text-[#2563EB] border-[#2563EB]/30',
        dotClass: 'bg-[#2563EB]',
      };
    case 'commercial_launch':
      return {
        label: 'Commercial Launch',
        color: '#0D9488',
        bgClass: 'bg-teal-500/10 text-[#0D9488] border-[#0D9488]/30',
        dotClass: 'bg-[#0D9488]',
      };
    case 'live':
    default:
      return {
        label: 'Live',
        color: '#16A34A',
        bgClass: 'bg-emerald-500/10 text-[#16A34A] border-[#16A34A]/30',
        dotClass: 'bg-[#16A34A]',
      };
  }
};

export const ProductStageBadge: React.FC<ProductStageBadgeProps> = ({ stage, className = '' }) => {
  const meta = getStageMeta(stage);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border backdrop-blur-md shadow-2xs ${meta.bgClass} bg-white/95 ${className}`}
      style={{ borderColor: `${meta.color}40`, color: meta.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: meta.color }}
      />
      <span>{meta.label}</span>
    </span>
  );
};
