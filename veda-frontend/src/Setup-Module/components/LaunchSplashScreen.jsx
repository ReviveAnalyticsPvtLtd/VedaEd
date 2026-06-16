import React, { useEffect, useState } from "react";

export default function LaunchSplashScreen({ schoolName }) {
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("Initializing your school workspace...");

  useEffect(() => {
    const steps = [
      { target: 30, label: "Generating configuration snapshot..." },
      { target: 60, label: "Creating roles & permissions..." },
      { target: 85, label: "Setting up dashboards & templates..." },
      { target: 100, label: "Redirecting to login..." },
    ];

    let current = 0;
    const timers = [];

    steps.forEach((step, i) => {
      const delay = i * 600;
      timers.push(
        setTimeout(() => {
          setStatusLabel(step.label);
          const increment = () => {
            current += 1;
            if (current <= step.target) {
              setProgress(current);
              timers.push(setTimeout(increment, 18));
            }
          };
          increment();
        }, delay)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-setup-page">
      {/* Logo row */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-setup-primary text-xl font-bold lowercase text-white shadow-lg">
          v
        </div>
        <p className="text-2xl font-bold text-setup-heading tracking-tight">VedaSchool</p>
      </div>

      {/* Success icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-green-600"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      {/* School name */}
      <h1 className="mb-2 text-center text-3xl font-bold text-setup-heading sm:text-4xl">
        {schoolName || "Your School"}
      </h1>
      <p className="mb-10 text-center text-base text-setup-muted">
        is live and ready!
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-sm px-6">
        <div className="mb-3 overflow-hidden rounded-full bg-gray-200 h-2.5">
          <div
            className="h-2.5 rounded-full bg-setup-primary transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-setup-muted">{statusLabel}</p>
          <p className="text-sm font-semibold text-setup-primary">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
