import { motion } from "framer-motion";

interface ScoreMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreMeter({ score, size = 160, strokeWidth = 8 }: ScoreMeterProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 75) return "#10B981"; // Green
    if (score >= 50) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return "Great Score";
    if (score >= 50) return "Good Score";
    return "Needs Improvement";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="text-3xl font-bold"
              style={{ color: getScoreColor(score) }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              {score}
            </motion.div>
            <div className="text-sm text-gray-500">out of 100</div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <div
          className="text-sm font-medium mb-1"
          style={{ color: getScoreColor(score) }}
        >
          {getScoreLabel(score)}
        </div>
        <div className="text-xs text-gray-500">
          {score < 75 ? "Room for improvement" : "Well optimized!"}
        </div>
      </div>
    </div>
  );
}
