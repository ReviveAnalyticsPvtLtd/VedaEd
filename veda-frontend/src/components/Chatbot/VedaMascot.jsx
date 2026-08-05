import React from "react";

/**
 * VedaMascot - An animated, premium SVG/CSS mascot for the VedaEd Smart Assistant.
 * Supports four states: "idle", "thinking", "happy", "wave".
 */
const VedaMascot = ({ state = "idle", size = 60, showGlow = true }) => {
  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Inline styles for Mascot Keyframe Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes veda-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes veda-blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.15); }
        }
        @keyframes veda-screen-glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(99, 102, 241, 0.4)) opacity(0.85); }
          50% { filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)) opacity(1); }
        }
        @keyframes veda-think-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.5)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.9)); transform: scale(1.08); }
        }
        @keyframes veda-wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-28deg); }
        }
        @keyframes veda-exhaust {
          0%, 100% { opacity: 0.3; transform: scaleX(0.9); }
          50% { opacity: 0.75; transform: scaleX(1.1); }
        }
        
        .veda-animate-float {
          animation: veda-float 3.5s ease-in-out infinite;
        }
        .veda-animate-blink {
          animation: veda-blink 4.5s ease-in-out infinite;
          transform-origin: 50px 44px;
        }
        .veda-animate-screen {
          animation: veda-screen-glow 2.5s ease-in-out infinite;
        }
        .veda-animate-think {
          animation: veda-think-glow 1.2s ease-in-out infinite;
          transform-origin: 50px 42px;
        }
        .veda-animate-wave {
          animation: veda-wave 0.8s ease-in-out infinite;
          transform-origin: 66px 62px;
        }
        .veda-animate-exhaust {
          animation: veda-exhaust 1.5s ease-in-out infinite;
          transform-origin: 50px 88px;
        }
      `}} />

      {/* Main Mascot SVG */}
      <svg 
        viewBox="0 0 100 100" 
        className={`w-full h-full veda-animate-float ${showGlow ? "drop-shadow-lg" : ""}`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground Exhaust / Levitation Glow */}
        <ellipse 
          cx="50" 
          cy="88" 
          rx="12" 
          ry="2" 
          fill="url(#veda-exhaust-gradient)" 
          className="veda-animate-exhaust"
        />

        {/* Floating Left Arm */}
        <path 
          d="M 28 62 C 22 64, 20 70, 24 73 C 27 75, 31 71, 30 67" 
          stroke="#4f46e5" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          fill="none"
        />

        {/* Floating Right Arm (Waving or Static) */}
        {state === "wave" ? (
          <path 
            d="M 72 62 C 78 60, 84 52, 82 46 C 80 42, 74 46, 70 51" 
            stroke="#4f46e5" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none"
            className="veda-animate-wave"
          />
        ) : (
          <path 
            d="M 72 62 C 78 64, 80 70, 76 73 C 73 75, 69 71, 70 67" 
            stroke="#4f46e5" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            fill="none"
          />
        )}

        {/* Torso/Body (White Tech Shell) */}
        <rect 
          x="35" 
          y="56" 
          width="30" 
          height="24" 
          rx="12" 
          fill="#ffffff" 
          stroke="#e0e7ff" 
          strokeWidth="2.5"
        />
        
        {/* Chest Display Shield */}
        <rect 
          x="41" 
          y="62" 
          width="18" 
          height="12" 
          rx="6" 
          fill="#f8fafc" 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />

        {/* Veda "V" Chest Emblem (Glows indigo/blue) */}
        <path 
          d="M 46 66 L 50 70 L 54 66" 
          stroke="#6366f1" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />

        {/* Neck connector */}
        <rect 
          x="47" 
          y="50" 
          width="6" 
          height="8" 
          rx="1" 
          fill="#cbd5e1"
        />

        {/* Head Screen (Metallic Dark Frame) */}
        <rect 
          x="28" 
          y="25" 
          width="44" 
          height="30" 
          rx="12" 
          fill="#1e1b4b" 
          stroke="#6366f1" 
          strokeWidth="2.5"
          className="veda-animate-screen"
        />

        {/* Graduation Academic Cap (Sitting tilted on top of head screen) */}
        <g id="graduation-cap">
          {/* Cap Cap Base Band */}
          <path 
            d="M 38 23 C 38 26, 44 27, 50 27 C 56 27, 62 26, 62 23 L 62 18 L 38 18 Z" 
            fill="#0f172a" 
            stroke="#1e293b" 
            strokeWidth="0.5"
          />
          {/* Cap Diamond Top */}
          <polygon 
            points="50,10 70,18 50,26 30,18" 
            fill="#1e293b" 
            stroke="#334155" 
            strokeWidth="1" 
            strokeLinejoin="round"
          />
          {/* Tassel (Yellow Gold cord & fringe hanging down left side) */}
          <path 
            d="M 50,18 L 34,22 L 32,28" 
            stroke="#f59e0b" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            fill="none"
          />
          <circle cx="32" cy="29" r="1.5" fill="#f59e0b" />
        </g>

        {/* Screen Interface Digital Eyes */}
        <g id="eyes">
          {state === "happy" ? (
            /* Smiling eyes (^ ^) */
            <>
              <path 
                d="M 38 45 Q 43 39, 48 45" 
                stroke="#22d3ee" 
                strokeWidth="3" 
                strokeLinecap="round" 
                fill="none" 
              />
              <path 
                d="M 52 45 Q 57 39, 62 45" 
                stroke="#22d3ee" 
                strokeWidth="3" 
                strokeLinecap="round" 
                fill="none" 
              />
            </>
          ) : state === "thinking" ? (
            /* Sparkling/Thinking Eyes (cyan stars or pulsing circles) */
            <>
              <circle 
                cx="42" 
                cy="42" 
                r="4.5" 
                fill="#22d3ee" 
                className="veda-animate-think"
              />
              <circle 
                cx="58" 
                cy="42" 
                r="4.5" 
                fill="#22d3ee" 
                className="veda-animate-think"
              />
              {/* Floating tech particle sparkles */}
              <circle cx="48" cy="36" r="1" fill="#67e8f9" opacity="0.8" />
              <circle cx="52" cy="48" r="1" fill="#67e8f9" opacity="0.8" />
            </>
          ) : (
            /* Normal/Idle/Waving Blinking Eyes */
            <>
              <rect 
                x="39" 
                y="39" 
                width="6" 
                height="9" 
                rx="3" 
                fill="#22d3ee" 
                className="veda-animate-blink"
              />
              <rect 
                x="55" 
                y="39" 
                width="6" 
                height="9" 
                rx="3" 
                fill="#22d3ee" 
                className="veda-animate-blink"
              />
            </>
          )}
        </g>

        {/* Gradients and Filters Definition */}
        <defs>
          <radialGradient 
            id="veda-exhaust-gradient" 
            cx="50%" cy="50%" r="50%" 
            fx="50%" fy="50%"
          >
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export default VedaMascot;
