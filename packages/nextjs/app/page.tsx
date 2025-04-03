"use client";
import Image from "next/image";
import type { NextPage } from "next";
import { useRef, useState } from "react";

/**
 * NFTCard 组件  
 * 展示单张 NFT 卡片，带有鼠标悬停时的 3D 交互及动态光晕效果
 */
const NFTCard = ({
  src,
  author,
  owner,
  description,
}: {
  src: string;
  author: string;
  owner: string;
  description: string;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = (x - centerX) / 8;
    const rotateX = (centerY - y) / 8;

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.05)
    `;
    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform =
        "perspective(1000px) rotateX(0) rotateY(0) scale(1)";
      cardRef.current.style.setProperty("--glow-opacity", "0");
    }
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      cardRef.current.style.setProperty("--glow-opacity", "1");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center transition-[transform] duration-300 ease-out glow-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      ref={cardRef}
    >
      <div className="relative w-72 h-72 overflow-hidden rounded-xl border-4 border-gray-300 group">
        <Image
          src={src}
          layout="fill"
          objectFit="cover"
          alt="NFT artwork"
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white text-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2 p-4">
          <p className="text-xs font-mono">Artist: {author}</p>
          <p className="text-xs font-mono">Owner: {owner}</p>
          <p className="text-xs font-mono">© All rights reserved</p>
        </div>
      </div>
      <p className="text-center text-lg mt-8 text-gray-200 max-w-xs">
        {description}
      </p>

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
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0) 70%
          );
          opacity: var(--glow-opacity);
          transition: opacity 0.3s ease;
          z-index: 10;
        }
      `}</style>
    </div>
  );
};

/**
 * Carousel 组件  
 * 所有 NFTCard 沿着圆周排布，通过鼠标在容器内水平移动控制整体旋转角度
 */
const Carousel = ({
  items,
}: {
  items: Array<{
    src: string;
    author: string;
    owner: string;
    description: string;
  }>;
}) => {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const n = items.length;
  const deltaAngle = 360 / n;
  const radius = 250;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const centerX = rect.width / 2;
    // 当鼠标位于容器左右两侧时，最大旋转范围为 ±45°
    const maxRotation = 45;
    const relativeX = (x - centerX) / centerX; // 范围 -1 ~ 1
    const newRotation = relativeX * maxRotation;
    setRotation(newRotation);
  };

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
          const cardRotation = index * deltaAngle;
          return (
            <div
              key={index}
              className="absolute w-full h-full"
              style={{
                transform: `rotateY(${cardRotation}deg) translateZ(${radius}px)`,
                transition: "transform 0.5s",
              }}
            >
              <NFTCard
                src={item.src}
                author={item.author}
                owner={item.owner}
                description={item.description}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Home 组件  
 * 左侧：3D 轮播  
 * 右侧：文字描述  
 * 背景采用炫酷炸裂的效果：旋转的彩色渐变与爆炸动画叠加，给人以冲击感
 */
const Home: NextPage = () => {
  const items = [
    {
      src: "/3.png",
      author: "22",
      owner: "33",
      description:
        "🐰《暴力兔猴》NFT系列是一组极具个性和独特魅力的数字艺术作品...",
    },
    {
      src: "/1.png",
      author: "郑逸",
      owner: "罗宇杰",
      description:
        "🌹每一幅《暴力娘猴》NFT都是艺术家精心打造的独一无二的作品...",
    },
    {
      src: "/9.png",
      author: "44",
      owner: "55",
      description:
        "🖼️欣赏《暴力狼猴》NFT就像是探索一个神秘的世界...",
    },
    {
      src: "/11.png",
      author: "666",
      owner: "777",
      description:
        "🎭《暴力狂猴》NFT融合了数字技术和艺术创作的独特魅力...",
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
      description:
        "🌟《暴力武士猴》NFT代表着数字艺术的未来发展方向...",
    },
  ];

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
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center min-h-screen p-6 relative z-10">
          {/* 左侧 3D 轮播 */}
          <div className="md:w-1/2 flex justify-center mb-10 md:mb-0">
            <Carousel items={items} />
          </div>
          {/* 右侧 文字描述 */}
          <div className="md:w-1/2 p-8">
            <h1 className="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              数字星辰——灵感永存的传奇
            </h1>
            <p className="text-lg leading-relaxed text-gray-200">
              在数字世界与现实交融的时代，NFT 成为艺术家梦想的承载者。
              通过区块链技术，每件 NFT 都拥有独特的身份，记录创作者的灵感与情感。
              收藏者不仅购买艺术，更是收藏创作者的故事与梦想。NFT 不仅是投资，
              更是情感的桥梁，连接了艺术、文化与未来。每一个 NFT 都像数字星空中的一颗星，
              见证人类的创造力与灵感的永恒。
            </p>
          </div>
        </div>
      </div>
      {/* 全局样式：实现炫酷炸裂的背景效果 */}
      <style jsx global>{`
        .starry-bg {
          position: relative;
          /* 深黑色基调，增加神秘感 */
          background: radial-gradient(ellipse at center, #000, #060608);
          overflow: hidden;
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
            #ff005a,
            #00ffff,
            transparent,
            #ff005a,
            transparent
          );
          filter: blur(80px);
          opacity: 0.15;
          animation: rotateConic 30s linear infinite;
          z-index: -2;
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
            rgba(255, 0, 150, 0.5) 60%,
            transparent 70%
          );
          animation: explode 3s ease-out infinite;
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
        }
        .explosion:nth-child(5) {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          animation-delay: 0.5s;
        }
        @keyframes explode {
          0% {
            transform: scale(0.1);
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
      `}</style>
    </>
  );
};

export default Home;
