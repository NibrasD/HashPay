import React, { useEffect, useRef } from 'react';

/**
 * Animated particle background with floating orbs
 */
export default function ParticleBackground() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const colors = [
      'rgba(99, 102, 241, 0.3)',
      'rgba(139, 92, 246, 0.25)',
      'rgba(6, 182, 212, 0.2)',
      'rgba(16, 185, 129, 0.15)',
      'rgba(167, 139, 250, 0.2)',
    ];

    const particles = [];

    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = Math.random() * 6 + 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 20;

      particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        animation-duration: ${duration}s;
        animation-delay: -${delay}s;
        box-shadow: 0 0 ${size * 3}px ${color};
      `;

      container.appendChild(particle);
      particles.push(particle);
    }

    // Add gradient orbs
    const orb1 = document.createElement('div');
    orb1.style.cssText = `
      position: absolute;
      top: 20%;
      left: 10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
      border-radius: 50%;
      animation: float 30s linear infinite;
      pointer-events: none;
    `;
    container.appendChild(orb1);

    const orb2 = document.createElement('div');
    orb2.style.cssText = `
      position: absolute;
      top: 60%;
      right: 10%;
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%);
      border-radius: 50%;
      animation: float 25s linear infinite reverse;
      pointer-events: none;
    `;
    container.appendChild(orb2);

    return () => {
      particles.forEach(p => p.remove());
      orb1.remove();
      orb2.remove();
    };
  }, []);

  return <div ref={containerRef} className="particles" />;
}
