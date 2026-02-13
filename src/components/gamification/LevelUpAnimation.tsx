import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpAnimationProps {
  show: boolean;
  level: number;
  onDismiss: () => void;
}

export default function LevelUpAnimation({ show, level, onDismiss }: LevelUpAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="bg-white dark:bg-warmBrown-800 rounded-3xl p-8 mx-4 text-center shadow-2xl max-w-sm w-full"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="text-6xl mb-4"
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
            >
              ⭐
            </motion.div>
            <motion.h2
              className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Level Up!
            </motion.h2>
            <motion.p
              className="text-4xl font-bold text-amber-400 dark:text-olive-400 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Level {level}
            </motion.p>
            <motion.p
              className="text-warmBrown-500 dark:text-parchment-400 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Keep memorizing God's Word!
            </motion.p>
            <motion.button
              className="btn-primary w-full"
              onClick={onDismiss}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.97 }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
