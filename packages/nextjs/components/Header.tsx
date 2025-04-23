"use client"

import type React from "react"
import { useCallback, useRef, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  PhotoIcon,
  BeakerIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth"
import { useOutsideClick } from "~~/hooks/scaffold-eth"

type HeaderMenuLink = {
  label: string
  href: string
  icon?: React.ReactNode
}

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "首页",
    href: "/",
    icon: <SparklesIcon className="h-4 w-4" />,
  },
  // {
  //   label: "测试合约",
  //   href: "/debug",
  //   icon: <BugAntIcon className="h-4 w-4" />,
  // },
  {
    label: "NFT创作平台",
    href: "/createNFT",
    icon: <ArrowUpTrayIcon className="h-4 w-4" />,
  },
  {
    label: "我的NFT",
    href: "/myNFTs",
    icon: <Bars3Icon className="h-4 w-4" />,
  },
  {
    label: "NFT市场",
    href: "/allNFTs",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFT盲盒",
    href: "/blindBox",
    icon: <BeakerIcon className="h-4 w-4" />,
  },
  {
    label: "NFT社区",
    href: "/community",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
  {
    label: "NFT成长平台",
    href: "/evolution",
    icon: <PhotoIcon className="h-4 w-4" />,
  },
]

export const HeaderMenuLinks = () => {
  const pathname = usePathname()

  return (
    <>
      {menuLinks.map(({ label, href, icon }, index) => {
        const isActive = pathname === href
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "neo-active" : ""
              } neo-button hover:shadow-lg focus:!bg-secondary active:!text-neutral py-2 px-4 text-sm rounded-xl gap-2 grid grid-flow-col items-center`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="neo-icon-wrapper">{icon}</div>
              <span>{label}</span>
              {isActive && <div className="neo-glow"></div>}
            </Link>
          </li>
        )
      })}
    </>
  )
}

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const burgerMenuRef = useRef<HTMLDivElement>(null)
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  )

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <div
        className={`sticky top-0 left-0 right-0 navbar neo-navbar min-h-0 flex-shrink-0 justify-between z-20 px-2 sm:px-4 transition-all duration-300 ${
          scrolled ? "neo-navbar-scrolled" : ""
        }`}
      >
        <div className="navbar-start w-auto xl:w-1/2">
          <div className="xl:hidden dropdown" ref={burgerMenuRef}>
            <label
              tabIndex={0}
              className={`ml-1 btn btn-ghost neo-burger-button ${isDrawerOpen ? "neo-burger-active" : ""}`}
              onClick={() => setIsDrawerOpen((prev) => !prev)}
            >
              <Bars3Icon className="h-1/2" />
            </label>
            {isDrawerOpen && (
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-4 neo-dropdown rounded-2xl w-64"
                onClick={() => setIsDrawerOpen(false)}
              >
                <div className="neo-dropdown-header mb-4 pb-2 border-b border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.png" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold leading-tight text-white">数字·星辰</span>
                      <span className="text-xs text-purple-300">灵感永存的传奇！</span>
                    </div>
                  </div>
                </div>
                <HeaderMenuLinks />
              </ul>
            )}
          </div>
          <Link href="/" passHref className="hidden xl:flex items-center gap-3 ml-4 mr-8 shrink-0 group">
            <div className="flex relative w-12 h-12 neo-logo-container overflow-hidden rounded-xl">
              <Image alt="SE2 logo" className="cursor-pointer neo-logo" fill src="/logo.png" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 group-hover:from-pink-500 group-hover:to-purple-500 transition-all duration-300">
                数字·星辰
              </span>
              <span className="text-xs text-purple-300 group-hover:text-pink-300 transition-colors duration-300">
                灵感永存的传奇！
              </span>
            </div>
          </Link>
          <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-3 neo-menu">
            <HeaderMenuLinks />
          </ul>
        </div>
        <div className="navbar-end flex-grow mr-4 flex items-center gap-2">
          <div className="neo-connect-button">
            <RainbowKitCustomConnectButton />
          </div>
          <div className="neo-faucet-button">
            <FaucetButton />
          </div>
        </div>
      </div>

      {/* 使用 styled-jsx 添加全局效果 */}
      <style jsx global>{`
        /* 更炫酷的霓虹风格导航栏 */
        .neo-navbar {
          background: linear-gradient(90deg, rgb(13,12,25) 0%, rgb(28,14,56) 50%, rgb(13,12,25) 100%);
          border-bottom: 1px solid rgba(138, 43, 226, 0.2);
          box-shadow: 0 4px 30px rgba(138, 43, 226, 0.15);
          height: 80px;
          transition: all 0.3s ease;
          margin-bottom: 0; /* 从 1rem 改为 0 */
        }
        
        .neo-navbar-scrolled {
          background: rgb(13,12,25);
          border-bottom: 1px solid rgba(138, 43, 226, 0.3);
          box-shadow: 0 4px 20px rgba(138, 43, 226, 0.25);
          height: 70px;
        }
        
        /* 炫酷的下拉菜单 */
        .neo-dropdown {
          background: rgba(20, 16, 36, 0.95);
          border: 1px solid rgba(138, 43, 226, 0.3);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 
                      0 0 20px rgba(138, 43, 226, 0.3);
          backdrop-filter: blur(10px);
          animation: neoDropdownAppear 0.3s ease forwards;
        }
        
        @keyframes neoDropdownAppear {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 汉堡菜单按钮效果 */
        .neo-burger-button {
          background: rgba(138, 43, 226, 0.1);
          border: 1px solid rgba(138, 43, 226, 0.3);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .neo-burger-button:hover {
          background: rgba(138, 43, 226, 0.2);
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.4);
        }
        
        .neo-burger-active {
          background: rgba(138, 43, 226, 0.3);
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
        }
        
        /* Logo 容器效果 */
        .neo-logo-container {
          border: 2px solid rgba(138, 43, 226, 0.3);
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .neo-logo {
          transition: transform 0.5s ease;
        }
        
        .neo-logo-container:hover {
          border-color: rgba(138, 43, 226, 0.6);
          box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
        }
        
        .neo-logo-container:hover .neo-logo {
          transform: scale(1.1) rotate(5deg);
        }
        
        /* 菜单容器 */
        .neo-menu {
          position: relative;
          animation: neoMenuAppear 0.5s ease forwards;
        }
        
        @keyframes neoMenuAppear {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* 炫酷的按钮效果 */
        .neo-button {
          position: relative;
          background: rgba(138, 43, 226, 0.1);
          border: 1px solid rgba(138, 43, 226, 0.2);
          overflow: hidden;
          transition: all 0.3s ease;
          animation: neoButtonAppear 0.5s ease forwards;
          opacity: 0;
          transform: translateY(10px);
        }
        
        @keyframes neoButtonAppear {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .neo-button:hover {
          background: rgba(138, 43, 226, 0.2);
          border-color: rgba(138, 43, 226, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(138, 43, 226, 0.3);
        }
        
        .neo-button:active {
          transform: translateY(1px);
          box-shadow: 0 2px 10px rgba(138, 43, 226, 0.2);
        }
        
        .neo-active {
          background: rgba(138, 43, 226, 0.25);
          border-color: rgba(138, 43, 226, 0.5);
          box-shadow: 0 0 15px rgba(138, 43, 226, 0.4);
        }
        
        /* 图标容器效果 */
        .neo-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }
        
        .neo-button:hover .neo-icon-wrapper {
          color: rgba(255, 255, 255, 1);
          transform: scale(1.2);
        }
        
        /* 活跃菜单项的光晕效果 */
        .neo-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(138, 43, 226, 0.4) 0%, rgba(138, 43, 226, 0) 70%);
          opacity: 0;
          animation: neoGlowPulse 2s ease-in-out infinite;
        }
        
        @keyframes neoGlowPulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* 连接按钮和水龙头按钮效果 */
        .neo-connect-button, .neo-faucet-button {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .neo-connect-button:hover, .neo-faucet-button:hover {
          transform: translateY(-2px);
        }
        
        .neo-connect-button::after, .neo-faucet-button::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 10%;
          width: 80%;
          height: 2px;
          background: linear-gradient(90deg, rgba(138, 43, 226, 0) 0%, rgba(138, 43, 226, 0.6) 50%, rgba(138, 43, 226, 0) 100%);
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .neo-connect-button:hover::after, .neo-faucet-button:hover::after {
          opacity: 1;
          bottom: -8px;
        }
        
        /* 添加粒子效果 */
        .neo-navbar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.4) 0%, rgba(138, 43, 226, 0) 20%),
            radial-gradient(circle at 80% 70%, rgba(255, 0, 128, 0.4) 0%, rgba(255, 0, 128, 0) 20%);
          opacity: 0.3;
          z-index: -1;
        }

        /* 主内容区域样式 */
        main {
          padding-top: 0; /* 从 1rem 改为 0 */
          position: relative;
          z-index: 10;
        }
      `}</style>
    </>
  )
}
