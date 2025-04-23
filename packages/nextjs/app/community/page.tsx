"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { notification } from "antd"
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth"
import { motion, AnimatePresence } from "framer-motion"
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth"
import {
  Heart,
  MessageCircle,
  Gift,
  Plus,
  X,
  DollarSign,
  Award,
  Clock,
  CheckCircle,
  User,
  Zap,
  Sparkles,
} from "lucide-react"

export interface NftInfo {
  image: string
  id: number
  name: string
  attributes: { value: string }[]
  owner: string
  price: string
  description: string
  CID?: string
}

export interface Collectible {
  image: string
  id: number
  name: string
  attributes: { value: string }[]
  owner: string
  price: string
  description: string
  uri?: string
  tokenId?: number
  CID?: string
}

interface Comment {
  id: number
  content: string
  author: string
}

interface AuctionInfo {
  minBid: number
  duration: number
  currentHighestBid: number
  currentHighestBidder?: string
  bidHistory: { bidder: string; amount: number }[]
  ended?: boolean
}

interface Post {
  id: number
  content: string
  author: string
  likes: number
  likedBy: string[]
  comments: Comment[]
  tips: number
  nft: NftInfo
  auction?: AuctionInfo
}

const CommunityPage = () => {
  const { address, isConnected } = useAccount()
  const [posts, setPosts] = useState<Post[]>([])
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedNFT, setSelectedNFT] = useState<NftInfo | null>(null)
  const [newPostContent, setNewPostContent] = useState<string>("")
  const [myNFTs, setMyNFTs] = useState<NftInfo[]>([])
  const [loadingNFTs, setLoadingNFTs] = useState<boolean>(true)
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]) //存储所有 NFT 数据
  const [isAuction, setIsAuction] = useState<boolean>(false)
  const [auctionMinBid, setAuctionMinBid] = useState<string>("")
  const [auctionDuration, setAuctionDuration] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"all" | "auctions">("all")
  const [commentInput, setCommentInput] = useState<{ [key: number]: string }>({})
  const [expandedPost, setExpandedPost] = useState<number | null>(null)

  useEffect(() => {
    const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
    const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]")
    const allNFTs = [...myNFTs, ...createdNFTs]
    setAllNFTs(allNFTs)
  }, [])

  useEffect(() => {
    const storedPosts = localStorage.getItem("posts")
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts))
      } catch (error) {
        console.error("Failed to parse posts:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (posts.length !== 0) {
      localStorage.setItem("posts", JSON.stringify(posts))
    }
  }, [posts])

  useEffect(() => {
    const loadUserNFTs = () => {
      try {
        const storedMyNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
        const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]")
        const allNFTs = [...storedMyNFTs, ...createdNFTs].filter(
          (nft: NftInfo) => nft.owner && address && nft.owner.toLowerCase() === address.toLowerCase(),
        )
        setMyNFTs(allNFTs)
      } catch (error) {
        console.error("Error loading NFTs:", error)
      } finally {
        setLoadingNFTs(false)
      }
    }

    if (address) {
      loadUserNFTs()
      window.addEventListener("storage", loadUserNFTs)
      return () => window.removeEventListener("storage", loadUserNFTs)
    }
  }, [address])

  // 用于帖子打赏的 sendETH 调用
  const { writeAsync: sendETH } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "sendETH",
    args: [undefined],
    value: undefined,
  })

  // 拍卖相关合约调用
  const { writeAsync: createAuctionWrite } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "createAuction",
    args: [undefined, undefined, undefined],
  })

  const { writeAsync: bidAuctionWrite } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "placeBid",
    args: [undefined],
  })

  const { writeAsync: endAuctionWrite } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "endAuction",
    args: [undefined],
  })

  // 处理出价逻辑
  const handleBid = async (post: Post) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" })
      return
    }
    if (post.auction?.ended) {
      notification.error({ message: "该拍卖已结束" })
      return
    }
    const bidValue = prompt("请输入你的出价 (ETH)")
    if (!bidValue || isNaN(Number(bidValue))) {
      notification.error({ message: "请输入有效的出价金额" })
      return
    }
    try {
      await bidAuctionWrite({
        args: [BigInt(post.nft.id)],
        // 将ETH转换为Wei
        value: BigInt(bidValue + "000000000000000000"),
      })
      const bidAmount = Number(bidValue)
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === post.id && p.auction && !p.auction.ended) {
            const updatedAuction = { ...p.auction }
            if (bidAmount > updatedAuction.currentHighestBid) {
              updatedAuction.currentHighestBid = bidAmount
              updatedAuction.currentHighestBidder = address!
            }
            updatedAuction.bidHistory = updatedAuction.bidHistory.concat({
              bidder: address!,
              amount: bidAmount,
            })
            return { ...p, auction: updatedAuction }
          }
          return p
        }),
      )
      notification.success({ message: "出价成功!" })
    } catch (error) {
      console.error(error)
      notification.error({ message: "出价失败" })
    }
  }

  // 处理结束拍卖逻辑
  const handleEndAuction = async (post: Post) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" })
      return
    }
    try {
      await endAuctionWrite({
        args: [BigInt(post.nft.id)],
      })
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id && p.auction ? { ...p, auction: { ...p.auction, ended: true } } : p)),
      )

      const tokenId = post.nft.id

      const purchasedNFT = {
        ...allNFTs.find((nft) => nft.id === tokenId),
        owner: post.auction?.currentHighestBidder, //最高出价者地址
        price: post.auction?.currentHighestBid,
        purchaseTime: new Date().toISOString(),
      }

      // 从卖家的所有相关存储中移除 NFT
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
        //至少存在一个元素满足条件，取反，不存在元素满足条件
        buyerNFTs.push(purchasedNFT)
        localStorage.setItem("myNFTs", JSON.stringify(buyerNFTs))
      }

      notification.success({ message: "拍卖结束成功!" })
    } catch (error) {
      console.error(error)
      notification.error({ message: "结束拍卖失败" })
    }
  }

  // 处理帖子发布
  const handlePostSubmit = async () => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" })
      return
    }
    if (!selectedNFT) {
      notification.error({ message: "请选择一个 NFT" })
      return
    }
    if (!newPostContent.trim()) {
      notification.error({ message: "内容不能为空" })
      return
    }

    let auctionData:
      | {
          minBid: number
          duration: number
          currentHighestBid: number
          bidHistory: { bidder: string; amount: number }[]
        }
      | undefined
    if (isAuction) {
      if (!auctionMinBid.trim() || !auctionDuration.trim()) {
        notification.error({ message: "请填写拍卖信息" })
        return
      }
      const minBidInWei = BigInt(auctionMinBid + "000000000000000000")
      const durationInSeconds = Number.parseInt(auctionDuration, 10)
      if (durationInSeconds <= 0) {
        notification.error({ message: "拍卖时长必须大于0" })
        return
      }
      try {
        await createAuctionWrite({
          args: [BigInt(selectedNFT.id), minBidInWei, BigInt(durationInSeconds)],
        })
        auctionData = {
          minBid: Number(auctionMinBid),
          duration: durationInSeconds,
          currentHighestBid: Number(auctionMinBid),
          bidHistory: [],
        }
      } catch (error) {
        notification.error({ message: "拍卖创建失败" })
        console.error(error)
        return
      }
    }

    const newPost: Post = {
      id: Date.now(),
      content: newPostContent,
      author: address!,
      likes: 0,
      likedBy: [],
      comments: [],
      tips: 0,
      nft: selectedNFT,
      ...(auctionData ? { auction: auctionData } : {}),
    }

    setPosts([newPost, ...posts])
    setMyNFTs(myNFTs.filter((nft) => nft.id !== selectedNFT.id))

    // 重置状态
    setIsModalOpen(false)
    setSelectedNFT(null)
    setNewPostContent("")
    setIsAuction(false)
    setAuctionMinBid("")
    setAuctionDuration("")
    notification.success({ message: "发布成功!" })
  }

  // 点赞逻辑
  const handleLike = (postId: number) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" })
      return
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasLiked = post.likedBy.includes(address!)
          return {
            ...post,
            likes: hasLiked ? post.likes - 1 : post.likes + 1,
            likedBy: hasLiked ? post.likedBy.filter((a) => a !== address) : [...post.likedBy, address!],
          }
        }
        return post
      }),
    )
  }

  // 评论逻辑
  const handleComment = (postId: number) => {
    const content = commentInput[postId]
    if (!content || !content.trim()) {
      notification.error({ message: "评论不能为空" })
      return
    }
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: Date.now(),
            content,
            author: address || "匿名用户",
          }
          return { ...post, comments: [...post.comments, newComment] }
        }
        return post
      }),
    )
    setCommentInput((prev) => ({ ...prev, [postId]: "" }))
  }

  // 打赏逻辑
  const handleTip = async (postId: number, amount: string) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" })
      return
    }
    if (isNaN(Number(amount))) {
      notification.error({ message: "请输入有效金额" })
      return
    }
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const targetPost = posts.find((post) => post.id === postId)
      if (!targetPost) {
        console.error("Post not found")
        return
      }
      await sendETH({
        args: [targetPost.author],
        value: BigInt(amount + "000000000000000000"),
      })
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, tips: post.tips + Number(amount) } : post)),
      )
      notification.success({ message: `成功打赏 ${amount} ETH!` })
    } catch (error) {
      notification.error({ message: "打赏失败" })
    }
  }

  const filteredPosts = activeTab === "auctions" ? posts.filter((post) => post.auction && !post.auction.ended) : posts

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="relative z-10 mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-3xl -z-10 rounded-3xl"></div>
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 mb-3">
                  NFT 创意社区
                </h1>
                <p className="text-base md:text-lg text-gray-300 max-w-2xl">
                  展示、分享和拍卖你的数字艺术作品，与创作者社区互动交流
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <RainbowKitCustomConnectButton />
                {isConnected && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-pink-500/20 transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    创作新帖
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/30 backdrop-blur-md rounded-full p-1 flex">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === "all"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              全部内容
            </button>
            <button
              onClick={() => setActiveTab("auctions")}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === "auctions"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              进行中的拍卖
            </button>
          </div>
        </div>

        {/* New Post Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-hidden"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl relative w-full max-w-3xl mx-4 border border-purple-500/30 shadow-xl flex flex-col max-h-[80vh]"
              >
                <div className="p-6 border-b border-gray-700/50">
                  <button
                    className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                    onClick={() => {
                      setIsModalOpen(false)
                      setNewPostContent("")
                      setSelectedNFT(null)
                      setIsAuction(false)
                      setAuctionMinBid("")
                      setAuctionDuration("")
                    }}
                  >
                    <X size={24} />
                  </button>

                  <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-purple-300">
                    发布新内容
                  </h2>
                </div>

                <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-4 text-center text-pink-300">选择你的 NFT 作品</h3>
                    {loadingNFTs ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                      </div>
                    ) : myNFTs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-gray-800/50 rounded-xl border border-gray-700">
                        暂无可用NFT，快去创作吧！
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {myNFTs.map((nft) => (
                          <motion.div
                            key={nft.id}
                            className={`relative group rounded-xl overflow-hidden cursor-pointer transition-all ${
                              selectedNFT?.id === nft.id
                                ? "ring-2 ring-pink-500 shadow-lg shadow-pink-500/30"
                                : "hover:ring-1 hover:ring-purple-500/50"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedNFT((prev) => (prev?.id === nft.id ? null : nft))}
                          >
                            <div className="aspect-square w-full bg-gray-800 overflow-hidden">
                              {nft.image ? (
                                <img
                                  src={nft.image || "/placeholder.svg"}
                                  alt={nft.name}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h4 className="text-white font-medium truncate">{nft.name}</h4>
                              <div className="flex justify-between items-center text-sm text-gray-300">
                                <span>ID: #{nft.id}</span>
                                {nft.price && (
                                  <span className="flex items-center">
                                    <DollarSign size={14} className="mr-1" />
                                    {Number.parseFloat(nft.price).toFixed(2)} ETH
                                  </span>
                                )}
                              </div>
                            </div>
                            {selectedNFT?.id === nft.id && (
                              <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1">
                                <CheckCircle size={20} className="text-white" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="分享你的创作故事..."
                      className="w-full p-4 rounded-xl bg-gray-800/70 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  {/* 拍卖功能开关及输入项 */}
                  <div className="mb-6">
                    <label className="flex items-center text-gray-200 mb-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAuction}
                        onChange={(e) => setIsAuction(e.target.checked)}
                        className="mr-2 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="flex items-center">
                        <Award size={18} className="mr-2 text-pink-400" />
                        拍卖 NFT
                      </span>
                    </label>

                    {isAuction && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700"
                      >
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-300">最低出价 (ETH):</label>
                          <input
                            type="text"
                            value={auctionMinBid}
                            onChange={(e) => setAuctionMinBid(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="例如: 1"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-300">拍卖持续时间 (秒):</label>
                          <input
                            type="text"
                            value={auctionDuration}
                            onChange={(e) => setAuctionDuration(e.target.value)}
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="例如: 3600"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-700/50">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsModalOpen(false)
                        setNewPostContent("")
                        setSelectedNFT(null)
                        setIsAuction(false)
                        setAuctionMinBid("")
                        setAuctionDuration("")
                      }}
                      className="px-5 py-2.5 text-gray-300 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePostSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all"
                    >
                      发布
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-purple-600/20 p-6 rounded-full mb-6">
              <Sparkles size={48} className="text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">暂无内容</h3>
            <p className="text-gray-400 max-w-md">
              {activeTab === "auctions"
                ? "目前没有正在进行的拍卖，快来创建一个吧！"
                : "社区还没有任何帖子，成为第一个分享者吧！"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-gray-900/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl transition-all duration-300 border ${
                  post.auction
                    ? post.auction.ended
                      ? "border-red-500/30"
                      : "border-blue-500/30"
                    : "border-white/10 hover:border-purple-500/20"
                }`}
                style={{
                  boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Content Section (Left/Middle) */}
                  <div className="flex-1 p-6 md:p-8">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{formatAddress(post.author)}</h3>
                        <p className="text-gray-300 text-sm flex items-center">
                          <Sparkles size={14} className="mr-1 text-purple-400" />
                          {post.nft.name}
                        </p>
                      </div>

                      {post.auction && (
                        <div
                          className={`ml-auto px-3 py-1 rounded-full flex items-center text-xs ${
                            post.auction.ended ? "bg-red-500/80 text-white" : "bg-blue-500/80 text-white"
                          }`}
                        >
                          {post.auction.ended ? (
                            <>
                              <CheckCircle size={14} className="mr-1" />
                              <span>拍卖已结束</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} className="mr-1" />
                              <span>拍卖进行中</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    <div className="mb-6">
                      <p className="text-gray-200 leading-relaxed">{post.content}</p>
                    </div>

                    {/* NFT Card */}
                    <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 mb-6 p-5 shadow-inner">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{post.nft.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">ID: #{post.nft.id}</p>
                        </div>
                        {post.nft.price && (
                          <div className="bg-purple-900/50 px-3 py-1 rounded-full text-purple-300 text-sm font-medium border border-purple-500/20">
                            {Number.parseFloat(post.nft.price).toFixed(2)} ETH
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-4">{post.nft.description}</p>

                      {/* Auction Info */}
                      {post.auction && (
                        <div
                          className={`p-4 rounded-xl ${
                            post.auction.ended
                              ? "bg-red-900/10 border border-red-700/20"
                              : "bg-blue-900/10 border border-blue-700/20"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white">
                              {post.auction.ended ? "拍卖结果" : "当前拍卖"}
                            </span>
                            {!post.auction.ended && (
                              <span className="text-xs text-blue-300">最低出价: {post.auction.minBid} ETH</span>
                            )}
                          </div>

                          <div
                            className={`flex items-center justify-between ${
                              post.auction.ended ? "text-red-300" : "text-blue-300"
                            }`}
                          >
                            <span>{post.auction.ended ? "成交价:" : "当前最高出价:"}</span>
                            <span className="font-bold text-lg">{post.auction.currentHighestBid} ETH</span>
                          </div>

                          {post.auction.currentHighestBidder && (
                            <div className="mt-2 text-sm text-gray-300">
                              {post.auction.ended ? "获得者:" : "出价者:"}{" "}
                              {formatAddress(post.auction.currentHighestBidder)}
                            </div>
                          )}

                          {/* Bid History */}
                          {post.auction.bidHistory.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-200 mb-2 flex items-center text-sm">
                                <Zap size={14} className="mr-1 text-yellow-400" />
                                竞价记录
                              </h5>
                              <ul className="space-y-1.5">
                                {post.auction.bidHistory.map((bid, index) => (
                                  <li key={index} className="flex justify-between text-xs">
                                    <span className="text-gray-300">{formatAddress(bid.bidder)}</span>
                                    <span className="font-medium text-gray-200">{bid.amount} ETH</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {post.auction && !post.auction.ended && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleBid(post)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 shadow-md"
                          >
                            <DollarSign size={14} />
                            出价
                          </motion.button>
                          {address && post.author.toLowerCase() === address.toLowerCase() && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEndAuction(post)}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 shadow-md"
                            >
                              <CheckCircle size={14} />
                              结束拍卖
                            </motion.button>
                          )}
                        </>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          post.likedBy.includes(address || "")
                            ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                            : "bg-gray-800 text-gray-300 border border-gray-700 hover:border-pink-500/30"
                        }`}
                      >
                        <Heart size={14} className={post.likedBy.includes(address || "") ? "fill-pink-400" : ""} />
                        {post.likes}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-gray-800 text-gray-300 border border-gray-700 hover:border-purple-500/30 transition-all"
                      >
                        <MessageCircle size={14} />
                        {post.comments.length}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const amount = prompt("输入打赏金额 (ETH)")
                          amount && handleTip(post.id, amount)
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium shadow-md"
                      >
                        <Gift size={14} />
                        打赏 {post.tips > 0 ? `${post.tips} ETH` : ""}
                      </motion.button>
                    </div>

                    {/* Comments Section */}
                    {expandedPost === post.id && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                          <MessageCircle size={18} className="mr-2 text-purple-400" />
                          评论区
                        </h4>

                        {/* Comment Input */}
                        <div className="flex gap-2 mb-4">
                          <input
                            type="text"
                            value={commentInput[post.id] || ""}
                            onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                            placeholder="写下你的评论..."
                            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleComment(post.id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                          >
                            发送
                          </motion.button>
                        </div>

                        {/* Comments List */}
                        {post.comments.length > 0 ? (
                          <div className="space-y-3">
                            {post.comments.map((comment) => (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={comment.id}
                                className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                      <User size={14} className="text-white" />
                                    </div>
                                    <span className="font-medium text-gray-200">{formatAddress(comment.author)}</span>
                                  </div>
                                </div>
                                <p className="text-gray-300">{comment.content}</p>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg text-center text-gray-400">
                            暂时没有评论，快来抢沙发吧！
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* NFT Image (Right) */}
                  <div className="md:w-80 relative">
                    <div className="h-full w-full bg-gray-800 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20"></div>
                      <img
                        src={post.nft.image || "/placeholder.svg"}
                        alt={post.nft.name}
                        className="w-full h-full object-contain object-center p-2"
                        style={{ maxHeight: "400px" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunityPage
