import type { NFTData } from "../../utils/localStorage"

interface EvolutionStatsProps {
  nftData?: NFTData
  isBound: boolean
  isEvolutionActive: boolean
}

// Map form values to their names
const formNames = ["Genesis", "Awakening", "Sublimation", "Legendary"]

// Map quality values to their names and colors
const qualityInfo = [
  { name: "White", color: "text-white" },
  { name: "Blue", color: "text-blue-400" },
  { name: "Purple", color: "text-purple-400" },
  { name: "Gold", color: "text-yellow-400" },
  { name: "Red", color: "text-red-500" },
]

export const EvolutionStats = ({ nftData, isBound, isEvolutionActive }: EvolutionStatsProps) => {
  if (!nftData) {
    return (
      <div className="animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-purple-300">NFT Stats</h2>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // Calculate time remaining for evolution deadline
  const timeRemaining = nftData.evolutionDeadline > 0 ? nftData.evolutionDeadline - Math.floor(Date.now() / 1000) : 0

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return "Expired"

    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      const remainingSeconds = seconds % 60
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  // Get form name
  const formName = formNames[nftData.form] || "Unknown"

  // Get quality info
  const quality = nftData.quality
  const qualityName = qualityInfo[quality]?.name || "Unknown"
  const qualityColor = qualityInfo[quality]?.color || "text-white"

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-purple-300">NFT Stats</h2>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Energy:</span>
          <span className="font-bold">{nftData.energy}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Level:</span>
          <span className="font-bold">{nftData.level} / 60</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Form:</span>
          <span className="font-bold">{formName}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Quality:</span>
          <span className={`font-bold ${qualityColor}`}>{qualityName}</span>
        </div>

        {isBound && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Mutation Probability:</span>
              <span className="font-bold">{nftData.mutationProbability}%</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Evolution Time:</span>
              <span className={`font-bold ${!isEvolutionActive ? "text-red-500" : ""}`}>
                {isEvolutionActive ? formatTimeRemaining(timeRemaining) : "Expired"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
