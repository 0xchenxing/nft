"use client"

import type { NFTMetadata } from "../../utils/localStorage"

interface NFTCardProps {
  nft: NFTMetadata | undefined
  isSelected: boolean
  isBound: boolean
  onSelect: (tokenId: string) => void
}

export const NFTCard = ({ nft, isSelected, isBound, onSelect }: NFTCardProps) => {
  if (!nft) {
    return (
      <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected ? "ring-4 ring-purple-500 transform scale-105" : "hover:ring-2 hover:ring-purple-400"}
        bg-gradient-to-br from-gray-900 to-black
      `}
      onClick={() => onSelect(nft.id)}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={nft.image || "/placeholder.svg?height=200&width=200"}
          alt={nft.name || `NFT #${nft.id}`}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
      </div>

      <div className="p-3 bg-black/60 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-bold truncate">{nft.name || `NFT #${nft.id}`}</h3>
          <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">#{nft.id}</span>
        </div>

        {isBound && (
          <div className="mt-1 text-xs inline-block px-2 py-1 bg-purple-900/60 rounded-full text-purple-300">Bound</div>
        )}
      </div>
    </div>
  )
}
