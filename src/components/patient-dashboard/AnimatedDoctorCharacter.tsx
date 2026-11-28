import React, { useEffect, useRef, useState } from 'react';

interface AnimatedDoctorCharacterProps {
  className?: string;
}

/**
 * Interactive layered 3D Doctor Character:
 * - While mouse is moving / active: BOTH eyes track the cursor direction smoothly
 *   and his hand stays steady/still.
 * - When mouse stops moving or leaves the window: returns to his animated idle state
 *   (gentle body sway, synchronous blinking/glancing, and lifting his thumbs-up hand).
 */
export const AnimatedDoctorCharacter: React.FC<AnimatedDoctorCharacterProps> = ({
  className = 'h-56 sm:h-64 md:h-76 lg:h-84'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const [isMouseActive, setIsMouseActive] = useState(false);
  const [eyeOffset, setEyeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Exact eye midpoint in screen coordinates (viewBox eye midpoint is ~53.3% X, ~25.5% Y)
      const eyesCenterX = rect.left + rect.width * 0.533;
      const eyesCenterY = rect.top + rect.height * 0.255;

      const dx = e.clientX - eyesCenterX;
      const dy = e.clientY - eyesCenterY;
      const dist = Math.hypot(dx, dy);

      // Smoothly saturate pupil travel inside sclera bounds (max +/-8px X, +/-6px Y in 866x1024 viewBox)
      const scaleFactor = dist > 0 ? Math.min(1, dist / 240) / dist : 0;
      const clampedX = Math.max(-8.5, Math.min(8.5, dx * scaleFactor * 8.5));
      const clampedY = Math.max(-6.0, Math.min(6.0, dy * scaleFactor * 6.0));

      setEyeOffset({ x: clampedX, y: clampedY });
      setIsMouseActive(true);

      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        setIsMouseActive(false);
        setEyeOffset({ x: 0, y: 0 });
      }, 1500);
    };

    const handlePointerLeave = () => {
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
      setIsMouseActive(false);
      setEyeOffset({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  const trackingTransformStyle: React.CSSProperties | undefined = isMouseActive
    ? {
        transform: `translate(${eyeOffset.x.toFixed(2)}px, ${eyeOffset.y.toFixed(2)}px)`,
        transition: 'transform 85ms ease-out'
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[866/1024] select-none pointer-events-none ${className}`}
      style={{ width: 'auto' }}
    >
      <div className="relative w-full h-full doc-body-sway">
        {/* 1. Base 3D Doctor Body & Head */}
        <img
          src="/doctor-body.png"
          alt="Dr. Friendly - MediSync AI Care Guide"
          className="w-full h-full object-contain drop-shadow-xl"
          draggable={false}
        />

        {/* 2. Precision SVG Eye Rig (Both Left & Right Eyes Track Mouse OR Idle-Glance + Blink) */}
        <svg
          viewBox="0 0 866 1024"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <defs>
            {/* Exact Left Eye Sclera Opening (Bezier apex: y=240 top, y=290 bottom) */}
            <clipPath id="doc-left-eye-clip">
              <path d="M 368 265 Q 398 215 427 265 Q 400 316 368 265 Z" />
            </clipPath>

            {/* Exact Right Eye Sclera Opening (Bezier apex: y=229 top, y=281 bottom) */}
            <clipPath id="doc-right-eye-clip">
              <path d="M 485 256 Q 519 202 553 256 Q 520 307 485 256 Z" />
            </clipPath>

            {/* Natural 3D Sclera Shading */}
            <radialGradient id="doc-sclera-grad" cx="50%" cy="48%" r="55%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="72%" stopColor="#F3F5F8" />
              <stop offset="100%" stopColor="#DCE2EC" />
            </radialGradient>

            {/* Rich Warm Brown 3D Iris Gradient */}
            <radialGradient id="doc-iris-grad" cx="48%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#6D3814" />
              <stop offset="68%" stopColor="#4A2108" />
              <stop offset="100%" stopColor="#260F02" />
            </radialGradient>

            {/* Soft Peach 3D Skin Eyelid Shading */}
            <linearGradient id="doc-lid-top-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E69D72" />
              <stop offset="70%" stopColor="#F3B389" />
              <stop offset="100%" stopColor="#D7875C" />
            </linearGradient>

            <linearGradient id="doc-lid-bot-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DF9266" />
              <stop offset="100%" stopColor="#F0B188" />
            </linearGradient>
          </defs>

          {/* LEFT EYE */}
          <g clipPath="url(#doc-left-eye-clip)">
            <rect x="364" y="238" width="68" height="60" fill="url(#doc-sclera-grad)" />

            <g
              className={isMouseActive ? '' : 'doc-eye-gaze'}
              style={trackingTransformStyle}
            >
              <circle cx="403" cy="267" r="21" fill="url(#doc-iris-grad)" />
              <circle cx="403" cy="267" r="10.5" fill="#0B0604" />
              <circle cx="395" cy="259" r="4.2" fill="#FFFFFF" opacity="0.96" />
              <circle cx="411" cy="263" r="1.8" fill="#FFFFFF" opacity="0.85" />
            </g>

            {/* Smooth Eyelid Blink Cover */}
            <g className="doc-eyelid-top-blink">
              <rect x="364" y="238" width="68" height="32" fill="url(#doc-lid-top-grad)" />
              <path
                d="M 366 269 Q 400 273 430 269"
                fill="none"
                stroke="#29140C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
            <g className="doc-eyelid-bottom-blink">
              <rect x="364" y="268" width="68" height="30" fill="url(#doc-lid-bot-grad)" />
            </g>
          </g>

          {/* RIGHT EYE */}
          <g clipPath="url(#doc-right-eye-clip)">
            <rect x="482" y="226" width="76" height="62" fill="url(#doc-sclera-grad)" />

            <g
              className={isMouseActive ? '' : 'doc-eye-gaze'}
              style={trackingTransformStyle}
            >
              <circle cx="521" cy="256" r="22" fill="url(#doc-iris-grad)" />
              <circle cx="521" cy="256" r="11" fill="#0B0604" />
              <circle cx="513" cy="248" r="4.4" fill="#FFFFFF" opacity="0.96" />
              <circle cx="529" cy="252" r="1.9" fill="#FFFFFF" opacity="0.85" />
            </g>

            {/* Smooth Eyelid Blink Cover */}
            <g className="doc-eyelid-top-blink">
              <rect x="482" y="226" width="76" height="33" fill="url(#doc-lid-top-grad)" />
              <path
                d="M 484 258 Q 520 262 556 258"
                fill="none"
                stroke="#29140C"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
            <g className="doc-eyelid-bottom-blink">
              <rect x="482" y="257" width="76" height="30" fill="url(#doc-lid-bot-grad)" />
            </g>
          </g>
        </svg>

        {/* 3. Right Arm + Thumbs-Up Hand (Steady while mouse is active; animated when idle) */}
        <img
          src="/doctor-arm.png"
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-contain drop-shadow-md ${
            isMouseActive ? '' : 'doc-thumbs-lift'
          }`}
          style={
            isMouseActive
              ? {
                  transform: 'translate(2px, 12px) rotate(-10deg)',
                  transformOrigin: '24% 87%',
                  transition: 'transform 260ms ease-out'
                }
              : {
                  transformOrigin: '24% 87%'
                }
          }
          draggable={false}
        />

        {/* 4. Subtle Thumbs-Up Sparkle Accent when Hand Raises in Idle Mode */}
        {!isMouseActive && (
          <div
            className="doc-thumb-spark absolute left-[11%] top-[41%] text-amber-500 text-base sm:text-lg font-black drop-shadow-xs"
            aria-hidden="true"
          >
            ✨
          </div>
        )}
      </div>
    </div>
  );
};
