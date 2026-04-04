'use client';

import Link from 'next/link';

interface Step {
  id: number;
  title: string;
  href: string;
}

interface ProgressIndicatorProps {
  currentStep: number;
}

// Updated steps with "Select Application Type" added
const steps: Step[] = [
  { id: 1, title: 'Dashboard', href: '/application/dashboard' },
  { id: 2, title: 'Select Type', href: '/application/select-type' },
  { id: 3, title: 'Personal', href: '/application/personal-details' },
  { id: 4, title: 'Contact', href: '/application/contact-details' },
  { id: 5, title: 'Next of Kin', href: '/application/next-of-kin' },
  { id: 6, title: 'School Records', href: '/application/High-school-records' },
  { id: 7, title: 'Program', href: '/application/program-selection' },
  { id: 8, title: 'Documents', href: '/application/documents' },
  { id: 9, title: 'Fees', href: '/application/application-fees' },
  { id: 10, title: 'Submit', href: '/application/submit' },
];

export default function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <>
      {/* Progress bar fixed under header */}
      <nav
        aria-label="Progress"
        className="fixed top-16 left-0 right-0 z-40 bg-white shadow-md py-3 md:ml-64"
      >
        <div className="w-full px-4">
          <ol className="flex space-x-2 md:space-x-0 md:justify-between max-w-full overflow-x-auto scrollbar-hide">
            {steps.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <li 
                  key={step.id} 
                  className="flex-shrink-0 md:flex-1 text-center min-w-[70px] md:min-w-[100px] relative"
                >
                  <div className="group">
                    {isCompleted ? (
                      <Link
                        href={step.href}
                        className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full bg-green-800 text-white cursor-pointer hover:bg-teal-700 text-xs md:text-base"
                        aria-current={isActive ? 'step' : undefined}
                      >
                        ✓
                      </Link>
                    ) : isActive ? (
                      <span
                        className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full border-2 border-green-900 text-green-900 font-semibold text-xs md:text-base"
                        aria-current="step"
                      >
                        {step.id}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full border-2 border-gray-300 text-gray-400 text-xs md:text-base">
                        {step.id}
                      </span>
                    )}

                    <p
                      className={`mt-1 md:mt-2 text-center text-[10px] md:text-xs ${
                        isActive ? 'text-green-900 font-semibold' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>

              {/* Connector line - hidden on mobile, shown on desktop */}
              {idx !== steps.length - 1 && (
                <div
                  className={`hidden md:block absolute top-3 right-0 h-0.5 ${
                    isCompleted ? 'bg-green-900' : 'bg-gray-300'
                  }`}
                  style={{ left: 'calc(100% + 0.5rem)', width: 'calc(100% - 2rem)' }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>

    {/* Mobile scroll indicator */}
    <div className="md:hidden text-center mt-2">
      <p className="text-xs text-gray-500">← Scroll → to see all steps</p>
    </div>
  </nav>

  {/* Add space for fixed header and progress bar */}
  <div className="h-28 md:h-36" />

  {/* Custom scrollbar hiding */}
  <style jsx global>{`
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `}</style>
</>
  );
}