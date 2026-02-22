import React, { memo } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./ui/LoadingSpinner";
import Logo from "./Logo";

interface LoadingScreenProps {
  message?: string;
  minimal?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = memo(
  ({ message = "Chargement...", minimal = false }) => {
    if (minimal) {
      return (
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex items-center justify-center mb-8"
          >
            <Logo className="h-20" />
          </motion.div>

          {/* Loading spinner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <LoadingSpinner size="lg" />
          </motion.div>

          {/* Loading message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 font-medium"
          >
            {message}
          </motion.p>
        </motion.div>
      </div>
    );
  },
);

LoadingScreen.displayName = "LoadingScreen";

export default LoadingScreen;
