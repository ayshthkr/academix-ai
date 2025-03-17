import React from 'react';

const CircularLoader = () => {
  return (
    <div className="text-zinc-800 dark:text-zinc-300 flex items-center">
      <div className="flex items-center">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="relative flex items-center justify-center size-4 border border-zinc-500 rounded-full mx-1 bg-transparent animate-circleKeys"
            style={{
              animationDelay: `${index * 0.3}s`,
            }}
          >
            <div
              className="absolute size-4 rounded-full bg-zinc-500 animate-dotKeys"
              style={{ animationDelay: `${index * 0.3}s` }}
            ></div>
            <div
              className="absolute size-6 rounded-full animate-outlineKeys"
              style={{ animationDelay: `${index * 0.3 + 0.9}s` }}
            ></div>
          </div>
        ))}
      </div>
      <span className="ml-2 text-sm text-zinc-500">Thinking...</span>

      <style jsx>{`
        @keyframes circleKeys {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes dotKeys {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes outlineKeys {
          0% {
            transform: scale(0);
            outline: solid 4px #71717a;
            outline-offset: 0;
            opacity: 1;
          }
          100% {
            transform: scale(1);
            outline: solid 0 transparent;
            outline-offset: 4px;
            opacity: 0;
          }
        }

        .animate-circleKeys {
          animation: circleKeys 2s ease-in-out infinite;
        }

        .animate-dotKeys {
          animation: dotKeys 2s ease-in-out infinite;
        }

        .animate-outlineKeys {
          animation: outlineKeys 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default CircularLoader;
