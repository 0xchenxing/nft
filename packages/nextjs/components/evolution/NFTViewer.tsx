"use client"

import { useEffect, useState, useRef } from "react"
import type { NFTMetadata } from "../../utils/localStorage"

interface NFTViewerProps {
  nft: NFTMetadata | undefined
  form: number
  quality: number
}

// Quality colors for the glow effect
const qualityColors = [
  "rgba(255, 255, 255, 0.5)", // White
  "rgba(59, 130, 246, 0.7)", // Blue
  "rgba(168, 85, 247, 0.7)", // Purple
  "rgba(234, 179, 8, 0.7)", // Gold
  "rgba(239, 68, 68, 0.7)", // Red
]

export const NFTViewer = ({ nft, form, quality }: NFTViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(0)

  // Animation frame reference
  const animationRef = useRef<number>()

  // Handle 3D effect for Legendary form
  useEffect(() => {
    if (form === 3 && canvasRef.current && nft?.image) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = nft.image

      img.onload = () => {
        const animate = () => {
          if (!canvasRef.current) return

          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Apply 3D rotation effect
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((Math.sin(angle) * Math.PI) / 16)
          ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height)
          ctx.restore()

          // Apply quality-based glow effect
          const qualityIndex = quality
          if (qualityIndex >= 0 && qualityIndex < qualityColors.length) {
            ctx.shadowBlur = 20 + Math.sin(angle * 2) * 10
            ctx.shadowColor = qualityColors[qualityIndex]
            ctx.globalCompositeOperation = "source-over"
            ctx.beginPath()
            ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 10, 0, Math.PI * 2)
            ctx.stroke()
          }

          setAngle((prev) => prev + 0.01)
          animationRef.current = requestAnimationFrame(animate)
        }

        animate()
      }

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [form, nft?.image, quality, angle])

  if (!nft) {
    return (
      <div className="w-full h-64 bg-gray-800 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    )
  }

  // Render different visualizations based on form
  const renderNFTByForm = () => {
    const formValue = form || 0
    const qualityIndex = quality || 0
    const qualityColor = qualityColors[qualityIndex] || qualityColors[0]

    switch (formValue) {
      case 0: // Genesis - Basic display
        return (
          <div className="relative">
            <img
              src={nft.image || "/placeholder.svg?height=400&width=400"}
              alt={nft.name}
              className="w-full rounded-lg shadow-lg"
              style={{
                boxShadow: `0 0 20px ${qualityColor}`,
              }}
            />
          </div>
        )

      case 1: // Awakening - Front and back flip effect
        return (
          <div className="relative perspective-500">
            <div className="flip-card w-full h-64">
              <div className="flip-card-inner">
                <div className="flip-card-front">
                  <img
                    src={nft.image || "/placeholder.svg?height=400&width=400"}
                    alt={nft.name}
                    className="w-full h-full object-cover rounded-lg"
                    style={{ boxShadow: `0 0 20px ${qualityColor}` }}
                  />
                </div>
                <div className="flip-card-back bg-gradient-to-br from-purple-900 to-black p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
                  <p className="text-sm">Token ID: #{nft.id}</p>
                  <div className="mt-4 text-xs">
                    <p>This NFT has awakened and now reveals hidden information on its back side.</p>
                    <p className="mt-2">
                      Quality:{" "}
                      {qualityIndex === 0
                        ? "White"
                        : qualityIndex === 1
                          ? "Blue"
                          : qualityIndex === 2
                            ? "Purple"
                            : qualityIndex === 3
                              ? "Gold"
                              : "Red"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2: // Sublimation - Dynamic pattern effect
        return (
          <div className="relative">
            <div className="sublimation-effect">
              <img
                src={nft.image || "/placeholder.svg?height=400&width=400"}
                alt={nft.name}
                className="w-full rounded-lg"
                style={{ boxShadow: `0 0 20px ${qualityColor}` }}
              />
              <div className="absolute inset-0 pattern-overlay rounded-lg"></div>
            </div>
          </div>
        )

      case 3: // Legendary - Full 3D effect with canvas
        return (
          <div className="relative">
            <canvas ref={canvasRef} width={400} height={400} className="w-full rounded-lg legendary-canvas" />
          </div>
        )

      default:
        return (
          <img
            src={nft.image || "/placeholder.svg?height=400&width=400"}
            alt={nft.name}
            className="w-full rounded-lg"
          />
        )
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-center">{nft.name || `NFT #${nft.id}`}</h2>

      <div className="w-full">{renderNFTByForm()}</div>
    </div>
  )
}
