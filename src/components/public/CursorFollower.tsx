import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import type { CursorStudioConfig } from '../../types';

interface CursorFollowerProps {
  isSandbox?: boolean;
  sandboxContainerRef?: React.RefObject<HTMLDivElement | null>;
  customConfig?: Partial<CursorStudioConfig>;
}

export const CursorFollower: React.FC<CursorFollowerProps> = ({
  isSandbox = false,
  sandboxContainerRef,
  customConfig,
}) => {
  const { activeSettings } = useTheme();

  const anim = activeSettings?.animation;
  const studioCfg: CursorStudioConfig = {
    enabled: anim?.cursorFollower ?? true,
    style: (anim?.cursorStyle as any) || 'classic-ring',
    size: 34,
    color: anim?.cursorColor || 'var(--color-primary, #35123F)',
    opacity: 1,
    hoverTransform: 'scale-up',
    clickFeedback: 'compress',
    trailEffect: 'none',
    trailLength: 5,
    movementSmoothing: 0.15,
    respectReducedMotion: anim?.respectReducedMotion ?? true,
    ...(anim?.cursorStudio || {}),
    ...(customConfig || {}),
  };

  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [renderedPos, setRenderedPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const targetPosRef = useRef({ x: -100, y: -100 });
  const currentPosRef = useRef({ x: -100, y: -100 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Detect touch device or OS reduced motion
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (touchQuery.matches || (studioCfg.respectReducedMotion && motionQuery.matches)) {
      setIsTouchDevice(true);
      return;
    }

    const container = isSandbox && sandboxContainerRef?.current ? sandboxContainerRef.current : window;

    const handleMouseMove = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      let clientX = mouseEvent.clientX;
      let clientY = mouseEvent.clientY;

      if (isSandbox && sandboxContainerRef?.current) {
        const rect = sandboxContainerRef.current.getBoundingClientRect();
        clientX = mouseEvent.clientX - rect.left;
        clientY = mouseEvent.clientY - rect.top;

        // Check bounds
        if (clientX < 0 || clientX > rect.width || clientY < 0 || clientY > rect.height) {
          setIsVisible(false);
          return;
        }
      }

      targetPosRef.current = { x: clientX, y: clientY };
      setMousePos({ x: clientX, y: clientY });
      if (!isVisible) setIsVisible(true);

      const target = mouseEvent.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest(
          'a, button, input, textarea, select, [role="button"], .cursor-hover-trigger'
        );
        setIsHovered(!!interactive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    if (isSandbox && sandboxContainerRef?.current) {
      const el = sandboxContainerRef.current;
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mousedown', handleMouseDown);
      el.addEventListener('mouseup', handleMouseUp);
      el.addEventListener('mouseleave', handleMouseLeave);
      el.addEventListener('mouseenter', handleMouseEnter);
    } else {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
    }

    // Smooth movement interpolation loop
    const updateMotion = () => {
      const smoothing = Math.max(0.05, Math.min(0.95, 1 - (studioCfg.movementSmoothing || 0.15)));
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * smoothing;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * smoothing;

      setRenderedPos({ x: currentPosRef.current.x, y: currentPosRef.current.y });

      // Trail calculation
      if (studioCfg.trailEffect === 'particles' || studioCfg.trailEffect === 'fading-line') {
        setTrail((prev) => {
          const next = [
            { x: currentPosRef.current.x, y: currentPosRef.current.y, id: Date.now() + Math.random() },
            ...prev.slice(0, Math.min(10, studioCfg.trailLength || 5)),
          ];
          return next;
        });
      }

      animFrameRef.current = requestAnimationFrame(updateMotion);
    };

    animFrameRef.current = requestAnimationFrame(updateMotion);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (isSandbox && sandboxContainerRef?.current) {
        const el = sandboxContainerRef.current;
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mousedown', handleMouseDown);
        el.removeEventListener('mouseup', handleMouseUp);
        el.removeEventListener('mouseleave', handleMouseLeave);
        el.removeEventListener('mouseenter', handleMouseEnter);
      } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mouseenter', handleMouseEnter);
      }
    };
  }, [isVisible, studioCfg.movementSmoothing, studioCfg.trailEffect, studioCfg.trailLength, isSandbox]);

  if (!studioCfg.enabled || isTouchDevice || !isVisible) {
    return null;
  }

  const baseSize = studioCfg.size || 34;
  const cursorColor = studioCfg.color || 'var(--color-primary, #35123F)';
  const opacity = studioCfg.opacity ?? 1;

  // Scale based on interaction
  let scale = 1;
  if (isClicking) {
    scale = studioCfg.clickFeedback === 'compress' ? 0.7 : studioCfg.clickFeedback === 'burst' ? 1.6 : 1;
  } else if (isHovered) {
    scale = studioCfg.hoverTransform === 'scale-up' ? 1.45 : studioCfg.hoverTransform === 'ring-expand' ? 1.8 : 1.2;
  }

  const positioningClass = isSandbox ? 'absolute' : 'fixed';

  // 1. Custom Image Cursor
  if (studioCfg.style === 'custom-image' && studioCfg.customImageUrl) {
    return (
      <div
        className={`pointer-events-none ${positioningClass} z-50 select-none transition-transform duration-75 ease-out`}
        style={{
          left: `${renderedPos.x - baseSize / 2}px`,
          top: `${renderedPos.y - baseSize / 2}px`,
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          opacity,
          transform: `scale(${scale})`,
        }}
      >
        <img
          src={studioCfg.customImageUrl}
          alt={studioCfg.customImageAlt || 'Custom Cursor'}
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>
    );
  }

  // 2. Minimalist Dot
  if (studioCfg.style === 'minimal-dot') {
    const dotSize = Math.max(6, Math.round(baseSize / 4));
    return (
      <div
        className={`pointer-events-none ${positioningClass} z-50 rounded-full transition-transform duration-75 ease-out`}
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          left: `${mousePos.x - dotSize / 2}px`,
          top: `${mousePos.y - dotSize / 2}px`,
          transform: `scale(${isClicking ? 0.7 : isHovered ? 2 : 1})`,
          backgroundColor: isHovered ? 'var(--color-accent, #D5A13C)' : cursorColor,
          boxShadow: isHovered ? '0 0 12px rgba(213, 161, 60, 0.7)' : 'none',
          opacity,
        }}
      />
    );
  }

  // 3. Neon Glow Aura
  if (studioCfg.style === 'neon-glow') {
    return (
      <>
        {/* Glow Aura */}
        <div
          className={`pointer-events-none ${positioningClass} z-50 rounded-full transition-transform duration-100 ease-out`}
          style={{
            width: `${baseSize * 1.3}px`,
            height: `${baseSize * 1.3}px`,
            left: `${renderedPos.x - (baseSize * 1.3) / 2}px`,
            top: `${renderedPos.y - (baseSize * 1.3) / 2}px`,
            transform: `scale(${scale})`,
            background: isHovered
              ? 'radial-gradient(circle, rgba(213, 161, 60, 0.5) 0%, rgba(145, 11, 44, 0.2) 60%, transparent 100%)'
              : `radial-gradient(circle, ${cursorColor} 0%, rgba(213, 161, 60, 0.15) 60%, transparent 100%)`,
            boxShadow: isHovered
              ? '0 0 24px rgba(213, 161, 60, 0.6)'
              : '0 0 16px rgba(145, 11, 44, 0.4)',
            opacity,
          }}
        />
        {/* Crisp Center Pin */}
        <div
          className={`pointer-events-none ${positioningClass} z-50 w-2 h-2 rounded-full`}
          style={{
            left: `${mousePos.x - 4}px`,
            top: `${mousePos.y - 4}px`,
            backgroundColor: isHovered ? '#D5A13C' : cursorColor,
            opacity,
          }}
        />
      </>
    );
  }

  // 4. Magnetic Circle
  if (studioCfg.style === 'magnetic-circle') {
    return (
      <div
        className={`pointer-events-none ${positioningClass} z-50 rounded-full transition-all duration-100 ease-out`}
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          left: `${renderedPos.x - baseSize / 2}px`,
          top: `${renderedPos.y - baseSize / 2}px`,
          transform: `scale(${scale})`,
          backgroundColor: isHovered ? 'rgba(213, 161, 60, 0.25)' : 'rgba(145, 11, 44, 0.15)',
          border: isHovered ? '2px solid rgba(213, 161, 60, 0.9)' : `1.5px solid ${cursorColor}`,
          backdropFilter: 'blur(2px)',
          opacity,
        }}
      />
    );
  }

  // 5. Classic Ring (Dual Ring with Trail support)
  return (
    <>
      {/* Optional Particle or Line Trail */}
      {studioCfg.trailEffect === 'particles' &&
        trail.map((p, idx) => {
          const pSize = Math.max(3, (baseSize / 8) * (1 - idx / trail.length));
          return (
            <div
              key={p.id}
              className={`pointer-events-none ${positioningClass} z-40 rounded-full`}
              style={{
                width: `${pSize}px`,
                height: `${pSize}px`,
                left: `${p.x - pSize / 2}px`,
                top: `${p.y - pSize / 2}px`,
                backgroundColor: cursorColor,
                opacity: (1 - idx / trail.length) * 0.4 * opacity,
              }}
            />
          );
        })}

      {/* Outer Follow Ring */}
      <div
        className={`pointer-events-none ${positioningClass} z-50 rounded-full transition-transform duration-75 ease-out`}
        style={{
          width: `${baseSize}px`,
          height: `${baseSize}px`,
          left: `${renderedPos.x - baseSize / 2}px`,
          top: `${renderedPos.y - baseSize / 2}px`,
          transform: `scale(${scale})`,
          border: `1.5px solid ${isHovered ? '#D5A13C' : cursorColor}`,
          boxShadow: isHovered ? '0 0 14px rgba(213, 161, 60, 0.4)' : 'none',
          backgroundColor: isHovered ? 'rgba(145, 11, 44, 0.08)' : 'transparent',
          opacity,
        }}
      />

      {/* Core Precision Dot */}
      <div
        className={`pointer-events-none ${positioningClass} z-50 w-1.5 h-1.5 rounded-full`}
        style={{
          left: `${mousePos.x - 3}px`,
          top: `${mousePos.y - 3}px`,
          backgroundColor: isHovered ? '#D5A13C' : cursorColor,
          opacity,
        }}
      />
    </>
  );
};
