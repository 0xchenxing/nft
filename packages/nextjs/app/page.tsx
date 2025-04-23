"use client"
import Image from "next/image"
import type React from "react"

import type { NextPage } from "next"
import { useRef, useState } from "react"

// Update the NFTCard component to have a more premium look with better shadows and gradients
// Replace the NFTCard component with this enhanced version:

const NFTCard = ({
  src,
  author,
  owner,
  description,
}: {
  src: string
  author: string
  owner: string
  description: string
}) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateY = (x - centerX) / 8
    const rotateX = (centerY - y) / 8

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.05)
    `
    card.style.setProperty("--glow-x", `${x}px`)
    card.style.setProperty("--glow-y", `${y}px`)
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0) rotateY(0) scale(1)"
      cardRef.current.style.setProperty("--glow-opacity", "0")
    }
  }

  const handleMouseEnter = () => {
    if (cardRef.current) {
      cardRef.current.style.setProperty("--glow-opacity", "1")
    }
  }

  return (
    <div
      className="flex flex-col items-center justify-center transition-[transform] duration-300 ease-out glow-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      ref={cardRef}
    >
      <div className="relative w-72 h-72 overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(120,0,255,0.3)] border border-purple-500/30 group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-600/20 z-10"></div>
        <Image
          src={src || "/placeholder.svg"}
          layout="fill"
          objectFit="cover"
          alt="NFT artwork"
          className="transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/70 to-purple-900/70 text-white text-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm space-y-3 p-4">
          <p className="text-sm font-mono tracking-wider border-b border-purple-400/30 pb-1">
            Artist: <span className="text-purple-300">{author}</span>
          </p>
          <p className="text-sm font-mono tracking-wider border-b border-purple-400/30 pb-1">
            Owner: <span className="text-purple-300">{owner}</span>
          </p>
          <p className="text-xs font-mono mt-2 text-purple-200">© All rights reserved</p>
        </div>
      </div>
      <div className="relative mt-6 px-4 py-3 bg-gradient-to-r from-purple-900/30 to-pink-800/30 rounded-xl backdrop-blur-sm max-w-xs">
        <p className="text-center text-lg text-purple-100 font-medium">{description}</p>
      </div>

      <style jsx>{`
        .glow-container {
          position: relative;
          --glow-opacity: 0;
        }
        .glow-container::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          background: radial-gradient(
            circle at var(--glow-x, 50%) var(--glow-y, 50%),
            rgba(191, 123, 255, 0.6) 0%,
            rgba(255, 0, 255, 0) 70%
          );
          opacity: var(--glow-opacity);
          transition: opacity 0.3s ease;
          z-index: 10;
          filter: blur(15px);
        }
      `}</style>
    </div>
  )
}

/**
 * Carousel 组件
 * 所有 NFTCard 沿着圆周排布，通过鼠标在容器内水平移动控制整体旋转角度
 */
const Carousel = ({
  items,
}: {
  items: Array<{
    src: string
    author: string
    owner: string
    description: string
  }>
}) => {
  const [rotation, setRotation] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const n = items.length
  const deltaAngle = 360 / n
  const radius = 250

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const centerX = rect.width / 2
    // 当鼠标位于容器左右两侧时，最大旋转范围为 ±45°
    const maxRotation = 45
    const relativeX = (x - centerX) / centerX // 范围 -1 ~ 1
    const newRotation = relativeX * maxRotation
    setRotation(newRotation)
  }

  return (
    <div
      className="relative mx-auto"
      style={{ width: "400px", height: "400px", perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <div
        className="w-full h-full relative"
        style={{
          transform: `translateZ(-${radius}px) rotateY(${rotation}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.5s ease-out",
        }}
      >
        {items.map((item, index) => {
          const cardRotation = index * deltaAngle
          return (
            <div
              key={index}
              className="absolute w-full h-full"
              style={{
                transform: `rotateY(${cardRotation}deg) translateZ(${radius}px)`,
                transition: "transform 0.5s",
              }}
            >
              <NFTCard src={item.src} author={item.author} owner={item.owner} description={item.description} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Update the Home component to have a more polished layout and enhanced visual effects
// Replace the Home component with this enhanced version:

const Home: NextPage = () => {
  const items = [
    {
      src: "/3.png",
      author: "22",
      owner: "33",
      description: "🐰《暴力兔猴》NFT系列是一组极具个性和独特魅力的数字艺术作品...",
    },
    {
      src: "/1.png",
      author: "郑逸",
      owner: "罗宇杰",
      description: "🌹每一幅《暴力娘猴》NFT都是艺术家精心打造的独一无二的作品...",
    },
    {
      src: "/9.png",
      author: "44",
      owner: "55",
      description: "🖼️欣赏《暴力狼猴》NFT就像是探索一个神秘的世界...",
    },
    {
      src: "/11.png",
      author: "666",
      owner: "777",
      description: "🎭《暴力狂猴》NFT融合了数字技术和艺术创作的独特魅力...",
    },
    {
      src: "/24.png",
      author: "333",
      owner: "3333",
      description: "🌀《暴力环猴》NFT将科技与艺术完美融合...",
    },
    {
      src: "/27.png",
      author: "222",
      owner: "222",
      description: "🌟《暴力武士猴》NFT代表着数字艺术的未来发展方向...",
    },
  ]

  return (
    <>
      <div className="starry-bg">
        {/* 爆炸效果：多个绝对定位的小爆炸元素 */}
        <div className="explosions">
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
          <div className="explosion"></div>
        </div>



        <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-6 pt-24 relative z-10">
          {/* 左侧 3D 轮播 */}
          <div className="md:w-1/2 flex justify-center mb-10 md:mb-0">
            <Carousel items={items} />
          </div>
          {/* 右侧 文字描述 */}
          <div className="md:w-1/2 p-8 backdrop-blur-sm bg-gradient-to-br from-purple-900/10 to-pink-900/10 rounded-2xl border border-purple-500/20 shadow-[0_0_30px_rgba(120,0,255,0.1)]">
            <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 leading-tight">
              数字星辰——灵感永存的传奇
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6"></div>
            <p className="text-lg leading-relaxed text-gray-200 mb-6">
              在数字世界与现实交融的时代，NFT 成为艺术家梦想的承载者。 通过区块链技术，每件 NFT
              都拥有独特的身份，记录创作者的灵感与情感。
            </p>
            <p className="text-lg leading-relaxed text-gray-200 mb-6">
              收藏者不仅购买艺术，更是收藏创作者的故事与梦想。NFT 不仅是投资， 更是情感的桥梁，连接了艺术、文化与未来。
            </p>
            <p className="text-lg leading-relaxed text-gray-200">
              每一个 NFT 都像数字星空中的一颗星， 见证人类的创造力与灵感的永恒。
            </p>

            <div className="mt-8 flex space-x-4">
              <button className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">
                探索收藏
              </button>
              <button className="px-6 py-3 rounded-full border border-purple-500/50 text-purple-300 font-medium hover:bg-purple-500/10 transition-all">
                了解更多
              </button>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <footer className="relative z-10 border-t border-purple-500/20 backdrop-blur-md bg-black/30 py-8">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative w-10 h-10">
                    <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.png" />
                  </div>
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                    数字星辰
                  </span>
                </div>
                <p className="text-gray-400 text-sm">© 2025 数字星辰. 保留所有权利.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-purple-400 font-medium mb-3">关于我们</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        团队介绍
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        发展历程
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        联系我们
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-purple-400 font-medium mb-3">资源</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        帮助中心
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        NFT指南
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        常见问题
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-purple-400 font-medium mb-3">社区</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        Discord
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        Twitter
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        Instagram
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-purple-400 font-medium mb-3">法律</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        隐私政策
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        服务条款
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-gray-400 hover:text-purple-300 text-sm">
                        版权声明
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
      {/* 全局样式：实现炫酷炸裂的背景效果 */}
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .starry-bg {
          position: relative;
          /* 深黑色基调，增加神秘感 */
          background: radial-gradient(ellipse at center, #0a0014, #060608);
          overflow: hidden;
          min-height: 100vh;
        }
        
        /* 旋转的彩色爆炸图层 */
        .starry-bg::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: conic-gradient(
            from 0deg,
            transparent,
            #7000ff,
            #00ffff,
            transparent,
            #ff00aa,
            transparent
          );
          filter: blur(100px);
          opacity: 0.15;
          animation: rotateConic 30s linear infinite;
          z-index: -2;
        }
        
        /* 添加星星效果 */
        .starry-bg::after {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(1px 1px at 10% 10%, rgba(255, 255, 255, 0.9) 1px, transparent 0),
            radial-gradient(1px 1px at 20% 20%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
            radial-gradient(1px 1px at 30% 30%, rgba(255, 255, 255, 0.7) 1px, transparent 0),
            radial-gradient(1px 1px at 40% 40%, rgba(255, 255, 255, 0.6) 1px, transparent 0),
            radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.5) 1px, transparent 0),
            radial-gradient(1px 1px at 60% 60%, rgba(255, 255, 255, 0.6) 1px, transparent 0),
            radial-gradient(1px 1px at 70% 70%, rgba(255, 255, 255, 0.7) 1px, transparent 0),
            radial-gradient(1px 1px at 80% 80%, rgba(255, 255, 255, 0.8) 1px, transparent 0),
            radial-gradient(1px 1px at 90% 90%, rgba(255, 255, 255, 0.9) 1px, transparent 0);
          background-size: 200px 200px;
          z-index: -1;
        }
        
        @keyframes rotateConic {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* 爆炸动画 */
        .explosions {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: -1;
        }
        
        .explosion {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8),
            rgba(170, 0, 255, 0.5) 60%,
            transparent 70%
          );
          animation: explode 5s ease-out infinite;
          filter: blur(3px);
        }
        
        .explosion:nth-child(1) {
          width: 50px;
          height: 50px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }
        
        .explosion:nth-child(2) {
          width: 80px;
          height: 80px;
          top: 60%;
          left: 70%;
          animation-delay: 1s;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8),
            rgba(255, 0, 170, 0.5) 60%,
            transparent 70%
          );
        }
        
        .explosion:nth-child(3) {
          width: 60px;
          height: 60px;
          top: 30%;
          left: 80%;
          animation-delay: 2s;
        }
        
        .explosion:nth-child(4) {
          width: 100px;
          height: 100px;
          top: 70%;
          left: 20%;
          animation-delay: 1.5s;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8),
            rgba(0, 170, 255, 0.5) 60%,
            transparent 70%
          );
        }
        
        .explosion:nth-child(5) {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          animation-delay: 0.5s;
        }
        
        .explosion:nth-child(6) {
          width: 90px;
          height: 90px;
          top: 15%;
          left: 40%;
          animation-delay: 2.5s;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8),
            rgba(170, 0, 255, 0.5) 60%,
            transparent 70%
          );
        }
        
        .explosion:nth-child(7) {
          width: 40px;
          height: 40px;
          top: 85%;
          left: 85%;
          animation-delay: 1.2s;
        }
        
        .explosion:nth-child(8) {
          width: 65px;
          height: 65px;
          top: 40%;
          left: 15%;
          animation-delay: 3s;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.8),
            rgba(255, 170, 0, 0.5) 60%,
            transparent 70%
          );
        }
        
        @keyframes explode {
          0% {
            transform: scale(0.1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        /* 添加滚动条样式 */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #7000ff, #ff00aa);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #8f00ff, #ff00dd);
        }
      `}</style>
    </>
  )
}

export default Home
