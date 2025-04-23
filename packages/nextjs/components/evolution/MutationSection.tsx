"use client"

import { useEffect, useState } from "react"
import type { NFTData } from "../../utils/localStorage"

interface MutationSectionProps {
  nftData?: NFTData
  onMutate: () => void
  isLoading: boolean
}

export const MutationSection = ({ nftData, onMutate, isLoading }: MutationSectionProps) => {
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)

  // Calculate and update cooldown timer
  useEffect(() => {
    if (!nftData) return

    const updateCooldown = () => {
      const lastMutated = nftData.lastMutated
      const cooldownTime = 30 // 30 seconds as per contract
      const now = Math.floor(Date.now() / 1000)
      const elapsed = now - lastMutated
      const remaining = Math.max(0, cooldownTime - elapsed)

      setCooldownRemaining(remaining)
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)

    return () => clearInterval(interval)
  }, [nftData])

  if (!nftData) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 animate-pulse">
        <h2 className="text-2xl font-bold mb-4 text-purple-300">Mutation</h2>
        <div className="h-20 bg-gray-700 rounded mb-4"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </div>
    )
  }

  // Get quality name
  const qualityNames = ["White", "Blue", "Purple", "Gold", "Red"]
  const currentQuality = nftData.quality
  const currentQualityName = qualityNames[currentQuality] || "Unknown"

  // Determine if next quality is possible
  const canImproveQuality = currentQuality < 4
  const nextQualityName = canImproveQuality ? qualityNames[currentQuality + 1] : "Max"

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">Mutation</h2>

      <div className="mb-6 space-y-4">
        <p className="text-gray-300">Mutate your NFT for a chance to improve its quality. Each mutation costs 1 ETH.</p>

        <div className="flex justify-between items-center">
          <span>Current Quality:</span>
          <span
            className={`font-bold ${
              currentQuality === 0
                ? "text-white"
                : currentQuality === 1
                  ? "text-blue-400"
                  : currentQuality === 2
                    ? "text-purple-400"
                    : currentQuality === 3
                      ? "text-yellow-400"
                      : "text-red-500"
            }`}
          >
            {currentQualityName}
          </span>
        </div>

        {canImproveQuality && (
          <div className="flex justify-between items-center">
            <span>Next Quality:</span>
            <span
              className={`font-bold ${
                currentQuality + 1 === 1
                  ? "text-blue-400"
                  : currentQuality + 1 === 2
                    ? "text-purple-400"
                    : currentQuality + 1 === 3
                      ? "text-yellow-400"
                      : "text-red-500"
              }`}
            >
              {nextQualityName}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span>Success Probability:</span>
          <span className="font-bold">{nftData.mutationProbability}%</span>
        </div>

        {cooldownRemaining > 0 && (
          <div className="flex justify-between items-center">
            <span>Cooldown:</span>
            <span className="font-bold text-yellow-400">{cooldownRemaining}s</span>
          </div>
        )}
      </div>

      <button
        onClick={onMutate}
        disabled={isLoading || cooldownRemaining > 0}
        className="w-full py-3 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg font-bold text-white shadow-lg transform transition hover:scale-105 disabled:opacity-50"
      >
        {isLoading ? "Mutating..." : cooldownRemaining > 0 ? `Cooldown (${cooldownRemaining}s)` : "Mutate (1 ETH)"}
      </button>
    </div>
  )
}
