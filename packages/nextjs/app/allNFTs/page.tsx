"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { NextPage } from "next"
import { useAccount } from "wagmi"
import { Modal, Button, notification, Pagination, Input } from "antd"
import { Address } from "~~/components/scaffold-eth"
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth"
import { ethers } from "ethers"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  TagIcon,
  CurrencyDollarIcon,
  UserIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline"

interface Collectible {
  image: string
  id: number
  name: string
  attributes: {value: string }[]
  owner: string
  description: string
  CID: string
}

interface ListedNftInfo {
  id: number
  price: string
}

interface FilterOptions {
  category: string
  sortBy: string
}

const AllNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount() // 钱包地址
  const { writeAsync: purchase } = useScaffoldContractWrite({
    // 购买 NFT 函数 purchase
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [undefined, undefined, undefined],
  })

  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]) // 所有 NFT 数据
  const [listedNFTs, setListedNFTs] = useState<ListedNftInfo[]>([]) // 已上架的 NFT 数据
  const [currentPage, setCurrentPage] = useState(1) // 当前分页页码
  const [searchText, setSearchText] = useState("") // 搜索输入框的文本
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]) // 搜索过滤后的 NFT 数据
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    // 分类和排序选项
    category: "all",
    sortBy: "newest",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<Collectible | null>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  const itemsPerPage = 6 // 每页显示的 NFT 数量
  const broadcastChannel = new BroadcastChannel("nft_channel") // 广播系统

  // 模拟加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handlePurchase = async (tokenId: number, price: string, owner: string) => {
    try {
      if (!connectedAddress) {
        notification.error({ message: "请先连接钱包" })
        return
      }

      if (!tokenId || !price || !owner) {
        notification.error({ message: "参数错误", description: "缺少必要的参数" })
        return
      }

      if (price === "N/A") {
        notification.error({ message: "此NFT未设置价格" })
        return
      }

      const priceInWei = ethers.parseUnits(price, "ether")

      // 调用合约购买方法
      await purchase({
        args: [BigInt(tokenId), owner, priceInWei],
        value: priceInWei,
      })

      // 构建购买后的 NFT 数据，对现有 NFT 数据进行更新和扩展
      const purchasedNFT = {
        ...allNFTs.find((nft) => nft.id === tokenId),
        owner: connectedAddress, // 买家钱包地址
        price: price,
        purchaseTime: new Date().toISOString(),
      }

      // 从卖家的所有存储中移除 NFT
      const sellerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
      const updatedSellerNFTs = sellerNFTs.filter((nft: Collectible) => nft.id !== tokenId)
      localStorage.setItem("myNFTs", JSON.stringify(updatedSellerNFTs))

      // 同时从 createdNFTs 中移除
      const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]")
      const updatedCreatedNFTs = createdNFTs.filter((nft: Collectible) => nft.id !== tokenId)
      localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs))

      // 添加到买家的 myNFTs 中
      const buyerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
      if (!buyerNFTs.some((nft: Collectible) => nft.id === tokenId)) {
        buyerNFTs.push(purchasedNFT)
        localStorage.setItem("myNFTs", JSON.stringify(buyerNFTs))
      }

      // 更新 allNFTs 存储
      const updatedAllNFTs = allNFTs.filter((nft) => nft.id !== tokenId)
      setAllNFTs(updatedAllNFTs)
      localStorage.setItem("allNFTs", JSON.stringify(updatedAllNFTs))

      // 更新 listedNFTs 存储
      const updatedListedNFTs = listedNFTs.filter((nft) => nft.id !== tokenId)
      setListedNFTs(updatedListedNFTs)
      localStorage.setItem("listedNFTs", JSON.stringify(updatedListedNFTs))

      // 广播购买事件
      broadcastChannel.postMessage({
        type: "NFT_PURCHASED",
        nft: purchasedNFT,
        action: "TRANSFER_NFT",
        from: owner,
        to: connectedAddress,
      })

      notification.success({
        message: "购买成功",
        description: "NFT已添加到您的NFT列表中",
        placement: "bottomRight",
        style: {
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "12px",
          border: "1px solid rgba(138, 43, 226, 0.5)",
        },
      })

      // 触发 MyHoldings 组件更新
      window.dispatchEvent(new Event("MY_NFTS_UPDATED"))
      setIsModalVisible(false)
    } catch (error) {
      console.error("购买失败:", error)
      notification.error({
        message: "购买失败",
        description: "请确保NFT存在且您有足够的ETH",
        placement: "bottomRight",
        style: {
          background: "rgba(0, 0, 0, 0.8)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 0, 0, 0.5)",
        },
      })
    }
  }

  useEffect(() => {
    const storedAllNFTs = localStorage.getItem("allNFTs")
    const storedListedNFTs = localStorage.getItem("listedNFTs")
    if (storedAllNFTs) {
      const nfts = JSON.parse(storedAllNFTs)
      setAllNFTs(nfts)
      setFilteredNFTs(nfts)
    }
    if (storedListedNFTs) {
      const listed = JSON.parse(storedListedNFTs)
      setListedNFTs(listed)
    }
  }, [])

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (value.trim() === "") {
      setFilteredNFTs(allNFTs)
    } else {
      const filtered = allNFTs.filter((nft) => nft.name.toLowerCase().includes(value.toLowerCase()))
      setFilteredNFTs(filtered)
      setCurrentPage(1)
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions((prev) => ({
      ...prev,
      category: e.target.value,
    }))
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions((prev) => ({
      ...prev,
      sortBy: e.target.value,
    }))
  }

  const filterAndSortNFTs = (nfts: Collectible[]) => {
    let filtered = [...nfts]

    if (filterOptions.category !== "all") {
      filtered = filtered.filter((nft) =>
        nft.attributes?.some((attr) => attr.value.toLowerCase() === filterOptions.category.toLowerCase()),
      )
    }

    switch (filterOptions.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => {
          const priceA = Number(getPriceById(a.id)) || 0
          const priceB = Number(getPriceById(b.id)) || 0
          return priceA - priceB
        })
        break
      case "price_desc":
        filtered.sort((a, b) => {
          const priceA = Number(getPriceById(a.id)) || 0
          const priceB = Number(getPriceById(b.id)) || 0
          return priceB - priceA
        })
        break
      case "newest":
        filtered.sort((a, b) => b.id - a.id)
        break
      case "oldest":
        filtered.sort((a, b) => a.id - b.id)
        break
    }

    return filtered
  }

  useEffect(() => {
    let filtered = allNFTs.filter((nft) => nft.name.toLowerCase().includes(searchText.toLowerCase()))
    filtered = filterAndSortNFTs(filtered)
    setFilteredNFTs(filtered)
    setCurrentPage(1)
  }, [searchText, allNFTs, filterOptions])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  const getPriceById = (id: number) => {
    const listedNft = listedNFTs.find((nft) => nft.id === id)
    return listedNft ? listedNft.price : "N/A"
  }

  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const openNFTModal = (nft: Collectible) => {
    setSelectedNFT(nft)
    setIsModalVisible(true)
  }

  // 生成随机颜色
  const getRandomGradient = (id: number) => {
    const gradients = [
      "from-purple-600 to-blue-500",
      "from-blue-500 to-teal-400",
      "from-teal-400 to-yellow-300",
      "from-yellow-300 to-orange-500",
      "from-orange-500 to-pink-500",
      "from-pink-500 to-purple-600",
      "from-indigo-500 to-purple-600",
      "from-purple-600 to-pink-500",
      "from-pink-500 to-red-500",
      "from-red-500 to-yellow-400",
    ]
    return gradients[id % gradients.length]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

        {/* 动态光效 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>

        {/* 网格线 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      {/* 主内容 */}
      <div className="relative z-10">
        {/* 头部区域 */}
        <div className="pt-10 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 inline-block">
                NFT 数字藏品市场
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto">
                探索、收藏和交易独特的数字艺术品，每一件都是区块链上永久存储的独特资产
              </p>
            </div>

            {/* 搜索和筛选区域 */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 max-w-4xl mx-auto">
              <div className="w-full md:w-2/3 relative">
                <Input.Search
                  placeholder="搜索NFT名称..."
                  value={searchText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                  onSearch={handleSearch}
                  enterButton={
                    <span className="flex items-center">
                      <MagnifyingGlassIcon className="h-5 w-5 mr-1" /> 搜索
                    </span>
                  }
                  className="nft-search-input"
                />
              </div>

              <div className="w-full md:w-auto flex gap-3">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
                >
                  <FunnelIcon className="h-5 w-5" />
                  <span>筛选</span>
                </button>
              </div>
            </div>

            {/* 筛选选项 */}
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden max-w-4xl mx-auto mb-8 ${isFilterOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-purple-500/20 shadow-xl">
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-5 w-5 text-purple-400" />
                    <select
                      value={filterOptions.category}
                      onChange={handleCategoryChange}
                      className="bg-gray-900 text-white border border-purple-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="all">全部类别</option>
                      <option value="art">艺术</option>
                      <option value="music">音乐</option>
                      <option value="sport">运动</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowsUpDownIcon className="h-5 w-5 text-purple-400" />
                    <select
                      value={filterOptions.sortBy}
                      onChange={handleSortChange}
                      className="bg-gray-900 text-white border border-purple-500/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="newest">最新</option>
                      <option value="oldest">最早</option>
                      <option value="price_asc">价格从低到高</option>
                      <option value="price_desc">价格从高到低</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="flex justify-center mb-8">
              <div className="flex gap-8 text-center">
                <div className="px-4 py-2 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
                  <p className="text-sm text-gray-400">总藏品</p>
                  <p className="text-2xl font-bold text-white">{allNFTs.length}</p>
                </div>
                <div className="px-4 py-2 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
                  <p className="text-sm text-gray-400">在售藏品</p>
                  <p className="text-2xl font-bold text-white">{listedNFTs.length}</p>
                </div>
                <div className="px-4 py-2 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-purple-500/20">
                  <p className="text-sm text-gray-400">筛选结果</p>
                  <p className="text-2xl font-bold text-white">{filteredNFTs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NFT 卡片区域 */}
        <div className="container mx-auto px-4 pb-16">
          {isLoading ? (
            // 加载状态
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : paginatedNFTs.length === 0 ? (
            // 无数据状态
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-24 h-24 mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
                <InformationCircleIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">暂无在售NFT</h3>
              <p className="text-gray-400 max-w-md">当前没有符合筛选条件的NFT。请尝试调整筛选条件或稍后再来查看。</p>
            </div>
          ) : (
            // NFT卡片网格
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl ${
                    hoveredCard === nft.id ? "shadow-xl shadow-purple-500/20" : "shadow-lg"
                  }`}
                  onMouseEnter={() => setHoveredCard(nft.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => openNFTModal(nft)}
                >
                  {/* 卡片背景 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-0"></div>

                  {/* 卡片内容 */}
                  <div className="relative z-10">
                    {/* 图片区域 */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={nft.image || "/placeholder.svg"}
                        alt={nft.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                      {/* NFT ID标签 */}
                      <div
                        className={`absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r ${getRandomGradient(nft.id)} text-white text-sm font-bold shadow-lg`}
                      >
                        #{nft.id}
                      </div>

                      {/* 价格标签 */}
                      <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-sm font-bold flex items-center gap-1 border border-white/10">
                        <CurrencyDollarIcon className="h-4 w-4 text-cyan-400" />
                        {getPriceById(nft.id)} ETH
                      </div>
                    </div>

                    {/* 卡片信息 */}
                    <div className="p-5 bg-gray-800/90 backdrop-blur-sm">
                      <h3 className="text-xl font-bold text-white mb-2 truncate">{nft.name}</h3>

                      {/* 属性标签 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {nft.attributes?.slice(0, 3).map((attr, index) => (
                          <span
                            key={index}
                            className={`py-1 px-2 rounded-full text-xs font-medium bg-gradient-to-r ${getRandomGradient(nft.id + index)} text-white`}
                          >
                            {attr.value}
                          </span>
                        ))}
                        {nft.attributes?.length > 3 && (
                          <span className="py-1 px-2 rounded-full text-xs font-medium bg-gray-700 text-white">
                            +{nft.attributes.length - 3}
                          </span>
                        )}
                      </div>

                      {/* 描述 */}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{nft.description}</p>

                      {/* 发布者 */}
                      <div className="flex items-center gap-2 mb-4">
                        <UserIcon className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-gray-400">发布者:</span>
                        <Address address={nft.owner} />
                      </div>

                      {/* 查看详情按钮 */}
                      <button className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-white font-medium">
                        查看详情
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页控件 */}
          {filteredNFTs.length > 0 && (
            <div className="mt-12 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={itemsPerPage}
                total={filteredNFTs.length}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="custom-pagination"
              />
            </div>
          )}
        </div>
      </div>

      {/* NFT详情模态框 */}
      {selectedNFT && (
        <Modal
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={900}
          centered
          className="nft-detail-modal"
          closeIcon={<span className="text-white text-xl">&times;</span>}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {/* 左侧图片 */}
            <div className="md:w-1/2">
              <div className="relative rounded-xl overflow-hidden aspect-square">
                <img
                  src={selectedNFT.image || "/placeholder.svg"}
                  alt={selectedNFT.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full bg-gradient-to-r ${getRandomGradient(selectedNFT.id)} text-white text-sm font-bold shadow-lg`}
                >
                  #{selectedNFT.id}
                </div>
              </div>
            </div>

            {/* 右侧信息 */}
            <div className="md:w-1/2">
              <h2 className="text-2xl font-bold text-white mb-4">{selectedNFT.name}</h2>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">描述</h3>
                <p className="text-gray-300">{selectedNFT.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">属性</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedNFT.attributes?.map((attr, index) => (
                    <div
                      key={index}
                      className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20"
                    >
                      <p className="text-xs text-gray-400">{attr.trait_type}</p>
                      <p className="text-sm font-medium text-white">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">详细信息</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">发布者</span>
                    <Address address={selectedNFT.owner} />
                  </div>
                  {selectedNFT.CID && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CID</span>
                      <span className="text-white truncate max-w-[200px]">{selectedNFT.CID}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">价格</span>
                    <span className="text-white font-bold">{getPriceById(selectedNFT.id)} ETH</span>
                  </div>
                </div>
              </div>

              <Button
                type="primary"
                onClick={() => handlePurchase(selectedNFT.id, getPriceById(selectedNFT.id), selectedNFT.owner)}
                disabled={!connectedAddress || selectedNFT.owner === connectedAddress}
                className="w-full h-12 text-lg font-bold"
                style={{
                  background: "linear-gradient(90deg, #8A2BE2, #4169E1)",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(138, 43, 226, 0.4)",
                }}
              >
                {selectedNFT.owner === connectedAddress ? "您拥有此NFT" : "购买此NFT"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 全局样式 */}
      <style jsx global>{`
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .nft-search-input .ant-input {
          background-color: rgba(30, 30, 40, 0.6) !important;
          border: 1px solid rgba(138, 43, 226, 0.3) !important;
          color: white !important;
          height: 48px;
          border-radius: 12px 0 0 12px !important;
          padding-left: 16px;
          font-size: 16px;
        }
        
        .nft-search-input .ant-input:focus {
          box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.2) !important;
        }
        
        .nft-search-input .ant-input-group-addon {
          background-color: rgba(138, 43, 226, 0.8) !important;
          border: none !important;
        }
        
        .nft-search-input .ant-input-search-button {
          background: linear-gradient(90deg, #8A2BE2, #4169E1) !important;
          border: none !important;
          height: 48px !important;
          border-radius: 0 12px 12px 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .custom-pagination .ant-pagination-item {
          background: rgba(30, 30, 40, 0.6) !important;
          border: 1px solid rgba(138, 43, 226, 0.3) !important;
          border-radius: 8px !important;
        }
        
        .custom-pagination .ant-pagination-item-active {
          background: linear-gradient(90deg, rgba(138, 43, 226, 0.8), rgba(65, 105, 225, 0.8)) !important;
          border: none !important;
        }
        
        .custom-pagination .ant-pagination-item a {
          color: white !important;
        }
        
        .custom-pagination .ant-pagination-prev button,
        .custom-pagination .ant-pagination-next button {
          background: rgba(30, 30, 40, 0.6) !important;
          border: 1px solid rgba(138, 43, 226, 0.3) !important;
          color: white !important;
          border-radius: 8px !important;
        }
        
        .nft-detail-modal .ant-modal-content {
          background: linear-gradient(135deg, rgba(25, 25, 35, 0.95), rgba(40, 30, 60, 0.95)) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(138, 43, 226, 0.2) !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4) !important;
          padding: 24px !important;
        }
        
        .nft-detail-modal .ant-modal-close {
          color: white !important;
        }
        
        .nft-detail-modal .ant-modal-header {
          background: transparent !important;
          border-bottom: none !important;
        }
        
        .nft-detail-modal .ant-modal-title {
          color: white !important;
        }
      `}</style>
    </div>
  )
}

export default AllNFTs
