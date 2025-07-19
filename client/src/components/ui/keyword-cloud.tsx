import { motion } from "framer-motion";

interface KeywordCloudProps {
  keywords: Array<{
    text: string;
    weight: number;
    found: boolean;
    status?: 'found' | 'missing' | 'partial';
  }>;
  onKeywordClick?: (keyword: string) => void;
}

export function KeywordCloud({ keywords, onKeywordClick }: KeywordCloudProps) {
  const maxWeight = Math.max(...keywords.map(k => k.weight));

  const getFontSize = (weight: number) => {
    const baseSize = 14; // Increased base size for better readability
    const maxSize = 36; // Increased max size for better visibility
    return baseSize + (weight / maxWeight) * (maxSize - baseSize);
  };
  
  // Sort keywords by status (found first, then partial, then missing)
  // and then by weight (descending) for better organization
  const sortedKeywords = [...keywords].sort((a, b) => {
    // First sort by status
    const statusOrder = { found: 0, partial: 1, missing: 2 };
    const aStatus = a.status || (a.found ? 'found' : 'missing');
    const bStatus = b.status || (b.found ? 'found' : 'missing');
    
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus];
    }
    
    // Then sort by weight (descending)
    return b.weight - a.weight;
  });

  return (
    <div className="bg-gray-50 rounded-lg p-8 h-72 overflow-auto relative">
      <div className="flex flex-wrap gap-3 justify-center items-center">
        {sortedKeywords.length > 0 ? (
          sortedKeywords.map((keyword, index) => {
            const status = keyword.status || (keyword.found ? 'found' : 'missing');
            const statusColors = {
              found: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200",
              partial: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200",
              missing: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
            };
            
            return (
              <motion.span
                key={keyword.text}
                className={`font-medium cursor-pointer px-3 py-1 rounded-full border ${statusColors[status]} transition-all duration-200`}
                style={{ fontSize: `${getFontSize(keyword.weight)}px` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                title={`${status.charAt(0).toUpperCase() + status.slice(1)} keyword | Click for suggestions`}
                onClick={() => onKeywordClick?.(keyword.text)}
              >
                {keyword.text}
              </motion.span>
            );
          })
        ) : (
          <div className="text-center w-full py-10">
            <div className="text-5xl text-gray-400 mb-3">☁️</div>
            <p className="text-gray-500 text-lg">Upload a job description to see keyword analysis</p>
          </div>
        )}
      </div>
    </div>
  );
}
