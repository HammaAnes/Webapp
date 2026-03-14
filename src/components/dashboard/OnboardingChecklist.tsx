import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronRight, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useOnboarding } from "../../hooks/useOnboarding";

const OnboardingChecklist: React.FC = () => {
  const { steps, completedCount, totalCount, isComplete, progressPercent, isDismissed, dismiss } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(isDismissed);

  if (dismissed || isComplete) return null;

  const handleDismiss = () => {
    dismiss();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
      >
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Premiers pas chez Coffice</h3>
                <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-xs text-gray-400">{progressPercent}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {collapsed ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="ml-1 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Masquer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      step.completed ? "opacity-60" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${step.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {step.label}
                      </p>
                      {!step.completed && (
                        <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                      )}
                    </div>
                    {!step.completed && (
                      <Link
                        to={step.link}
                        className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
                      >
                        {step.linkLabel}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingChecklist;
