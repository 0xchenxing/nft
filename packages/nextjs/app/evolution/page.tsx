"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { NFTCard } from "~~/components/evolution/NFTCard"
import { EvolutionStats } from "~~/components/evolution/EvolutionStats"
import { MutationSection } from "~~/components/evolution/MutationSection"
import { TasksSection } from "~~/components/evolution/TasksSection"
import { NFTViewer } from "~~/components/evolution/NFTViewer"
import { LoadingSpinner } from "~~/components/evolution/LoadingSpinner"
import {
  getMyNFTs,
  getNFTData,
  bindNFT,
  evolveNFT,
  mutateNFT,
  completeTask,
  type NFTMetadata,
  type NFTData,
} from "~~/utils/localStorage"

const EvolutionProtocol = () => {
  const { address } = useAccount()
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null)
  const [ownedNFTs, setOwnedNFTs] = useState<NFTMetadata[]>([])
  const [nftData, setNFTData] = useState<NFTData | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Load NFTs from localStorage
  useEffect(() => {
    const loadNFTs = () => {
      setIsLoading(true)
      const myNFTs = getMyNFTs(address!)
      setOwnedNFTs(myNFTs)

      if (myNFTs.length > 0 && !selectedNFT) {
        setSelectedNFT(myNFTs[0].id)
      }

      setIsLoading(false)
    }

    loadNFTs()

    // Set up interval to refresh data every 5 seconds
    // const interval = setInterval(loadNFTs, 5000)
    // return () => clearInterval(interval)
  }, [address])

  // Load NFT data when selected NFT changes
  useEffect(() => {
    if (selectedNFT) {
      const data = getNFTData(selectedNFT)
      setNFTData(data)
    } else {
      setNFTData(undefined)
    }
  }, [selectedNFT])

  // Handle NFT selection
  const handleSelectNFT = (tokenId: string) => {
    setSelectedNFT(tokenId)
  }

  // Handle bind NFT
  const handleBindNFT = async () => {
    if (!selectedNFT || !address) return

    setActionLoading(true)
    bindNFT(selectedNFT, address)

    // Refresh NFT data
    setNFTData(getNFTData(selectedNFT))
    setActionLoading(false)
  }

  // Handle evolve NFT
  const handleEvolveNFT = async () => {
    if (!selectedNFT) return

    setActionLoading(true)
    const success = evolveNFT(selectedNFT)

    if (success) {
      // Show success notification
      alert("NFT evolved successfully!")
    } else {
      // Show error notification
      alert("Failed to evolve NFT. Not enough energy or max level reached.")
    }

    // Refresh NFT data
    setNFTData(getNFTData(selectedNFT))
    setActionLoading(false)
  }

  // Handle mutate NFT
  const handleMutateNFT = async () => {
    if (!selectedNFT) return

    setActionLoading(true)
    const result = mutateNFT(selectedNFT)

    if (result.success) {
      // Show success notification
      alert(
        `NFT mutated successfully! New quality: ${
          result.newQuality === 1
            ? "Blue"
            : result.newQuality === 2
              ? "Purple"
              : result.newQuality === 3
                ? "Gold"
                : result.newQuality === 4
                  ? "Red"
                  : "White"
        }`,
      )
    } else {
      // Show error notification
      alert("Failed to mutate NFT. Cooldown period may still be active.")
    }

    // Refresh NFT data
    setNFTData(getNFTData(selectedNFT))
    setActionLoading(false)
  }

  // Handle complete task
  const handleCompleteTask = async (taskType: number) => {
    if (!selectedNFT) return

    setActionLoading(true)
    const success = completeTask(selectedNFT, taskType)

    if (success) {
      // Show success notification
      alert("Task completed successfully!")
    } else {
      // Show error notification
      alert("Failed to complete task.")
    }

    // Refresh NFT data
    setNFTData(getNFTData(selectedNFT))
    setActionLoading(false)
  }

  // Check if NFT is bound to current user
  const isBound = nftData?.owner === address && nftData?.owner !== ""

  // Check if evolution is still active
  const isEvolutionActive = nftData?.evolutionDeadline
    ? nftData.evolutionDeadline > Math.floor(Date.now() / 1000)
    : false

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">
          Evolution Symbiosis Protocol
        </h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - NFT Selection */}
            <div className="lg:col-span-1 bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-4 text-purple-300">Your NFTs</h2>
              {ownedNFTs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2">
                  {ownedNFTs.map((nft) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      isSelected={selectedNFT === nft.id}
                      isBound={nftData?.owner === address && selectedNFT === nft.id}
                      onSelect={handleSelectNFT}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>You don't own any NFTs yet.</p>
                </div>
              )}
            </div>

            {/* Middle Column - NFT Viewer and Stats */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {selectedNFT ? (
                <>
                  <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                    <NFTViewer
                      nft={ownedNFTs.find((nft) => nft.id === selectedNFT)}
                      form={nftData?.form || 0}
                      quality={nftData?.quality || 0}
                    />
                  </div>

                  <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                    <EvolutionStats nftData={nftData} isBound={isBound} isEvolutionActive={isEvolutionActive} />

                    {!isBound && (
                      <button
                        onClick={handleBindNFT}
                        disabled={actionLoading}
                        className="w-full mt-4 py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold text-white shadow-lg transform transition hover:scale-105 disabled:opacity-50"
                      >
                        {actionLoading ? "Binding..." : "Bind NFT"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 flex items-center justify-center h-64">
                  <p className="text-gray-400">Select an NFT to view details</p>
                </div>
              )}
            </div>

            {/* Right Column - Evolution Actions */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {selectedNFT && isBound && isEvolutionActive ? (
                <>
                  <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                    <h2 className="text-2xl font-bold mb-4 text-purple-300">Evolution</h2>
                    <p className="mb-4 text-gray-300">Use your energy to evolve your NFT to the next level.</p>

                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span>Current Level:</span>
                        <span className="font-bold">{nftData?.level || 0}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Energy Required:</span>
                        <span className="font-bold">{nftData ? nftData.level * 10 + 100 : 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleEvolveNFT}
                      disabled={
                        actionLoading || !nftData || nftData.energy < nftData.level * 10 + 100 || nftData.level >= 60
                      }
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold text-white shadow-lg transform transition hover:scale-105 disabled:opacity-50"
                    >
                      {actionLoading ? "Evolving..." : "Evolve NFT"}
                    </button>
                  </div>

                  <MutationSection nftData={nftData} onMutate={handleMutateNFT} isLoading={actionLoading} />

                  <TasksSection onCompleteTask={handleCompleteTask} isLoading={actionLoading} />
                </>
              ) : selectedNFT && isBound ? (
                <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
                  <h2 className="text-2xl font-bold mb-4 text-red-400">Evolution Period Ended</h2>
                  <p className="text-gray-300">
                    The evolution period for this NFT has ended. You can no longer evolve or mutate this NFT.
                  </p>
                </div>
              ) : (
                <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30 flex items-center justify-center h-64">
                  <p className="text-gray-400">
                    {selectedNFT ? "Bind your NFT to access evolution features" : "Select an NFT to begin"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvolutionProtocol
