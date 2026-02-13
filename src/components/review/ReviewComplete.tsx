import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ReviewCompleteProps {
  totalReviewed: number;
  xpEarned: number;
}

export default function ReviewComplete({ totalReviewed, xpEarned }: ReviewCompleteProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      className="text-center py-12 space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className="text-6xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, delay: 0.1 }}
      >
        🎉
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold text-warmBrown-800 dark:text-parchment-100 font-serif">
          Review Complete!
        </h2>
        <p className="text-warmBrown-500 dark:text-parchment-400 mt-1">Great work on today's study.</p>
      </div>

      <div className="flex gap-4 justify-center">
        <div className="card !py-3 !px-5 text-center">
          <p className="text-2xl font-bold text-warmBrown-700 dark:text-parchment-200">{totalReviewed}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400">Verses</p>
        </div>
        <div className="card !py-3 !px-5 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">+{xpEarned}</p>
          <p className="text-xs text-warmBrown-500 dark:text-parchment-400">XP Earned</p>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="btn-primary"
      >
        Back to Library
      </button>
    </motion.div>
  );
}
