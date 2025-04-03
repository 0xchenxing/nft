"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  Bars3Icon,
  BugAntIcon,
  PhotoIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "测试合约",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
  {
    label: "NFT文件管理",
    href: "/ipfsManage",
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
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              // 添加 explosive-button 类以获得炫酷动画效果
              className={`${
                isActive ? "bg-secondary shadow-md" : ""
              } explosive-button hover:bg-secondary hover:shadow-lg focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(burgerMenuRef, useCallback(() => setIsDrawerOpen(false), []));

  return (
    <>
      <div
        className="sticky xl:static top-0 navbar dark-dynamic-bg min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2"
      >
        <div className="navbar-start w-auto xl:w-1/2">
          <div className="xl:hidden dropdown" ref={burgerMenuRef}>
            <label
              tabIndex={0}
              className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
              onClick={() => setIsDrawerOpen(prev => !prev)}
            >
              <Bars3Icon className="h-1/2" />
            </label>
            {isDrawerOpen && (
              <ul
                tabIndex={0}
                className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
                onClick={() => setIsDrawerOpen(false)}
              >
                <HeaderMenuLinks />
              </ul>
            )}
          </div>
          <Link
            href="/"
            passHref
            className="hidden xl:flex items-center gap-1 ml-4 mr-6 shrink-0"
          >
            <div className="flex relative w-10 h-10">
              <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.png" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold leading-tight">数字·星辰</span>
              <span className="text-xs">灵感永存的传奇！</span>
            </div>
          </Link>
          <ul className="hidden xl:flex xl:flex-nowrap menu menu-horizontal px-1 gap-2">
            <HeaderMenuLinks />
          </ul>
        </div>
        <div className="navbar-end flex-grow mr-4">
          <RainbowKitCustomConnectButton />
          <FaucetButton />
        </div>
      </div>

      {/* 使用 styled-jsx 添加全局效果 */}
      <style jsx global>{`
        /* 更暗黑、动态渐变的头部背景 */
        .dark-dynamic-bg {
          background: linear-gradient(270deg, #08090a, #0e0f11, #15161a);
          background-size: 600% 600%;
          animation: animatedBackground 20s ease infinite;
        }
        @keyframes animatedBackground {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        /* 炫酷炸裂的按钮效果 */
        .explosive-button {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background 0.2s ease-out;
        }
        .explosive-button::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease-out, height 0.3s ease-out;
        }
        .explosive-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
        }
        .explosive-button:hover::before {
          width: 200%;
          height: 200%;
        }
        .explosive-button:active {
          transform: scale(0.95);
        }
      `}</style>
    </>
  );
};
