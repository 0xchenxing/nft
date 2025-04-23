"use client"

import type React from "react"
import { useState, useEffect, lazy, Suspense } from "react"
import type { NextPage } from "next"
import { notification } from "~~/utils/scaffold-eth"
import { uploadToPinata } from "~~/components/simpleNFT/pinata"
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch"
import { useAccount } from "wagmi"
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth"
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch"
import axios from "axios"

const LazyReactJson = lazy(() => import("react-json-view"))

interface ImageData {
  id: number
  name: string
  onChainAddress: string
}

interface NftInfo {
  image: string
  id: number
  name: string
  attributes: {value: string }[]
  owner: string
  price: string
  description: string
  CID?: string
}

const NftPlatformPage: NextPage = () => {
  // NFT info state
  const [nftInfo, setNftInfo] = useState<NftInfo>({
    image: "",
    id: Date.now(),
    name: "",
    attributes: [],
    owner: "",
    price: "",
    description: "",
  })

  // Connection state (mock for demo)
  const { address: connectedAddress, isConnected } = useAccount()
  const [isConnecting, setIsConnecting] = useState(false)

  // IPFS upload states
  const [loading, setLoading] = useState(false)
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imageData, setImageData] = useState<ImageData[]>([])

  // IPFS download states
  const [yourJSON, setYourJSON] = useState<any>({})
  const [ipfsPath, setIpfsPath] = useState("")
  const [mounted, setMounted] = useState(false)

  // Add contract interaction hooks
  const { writeAsync: mintItem } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintItem",
    args: [connectedAddress, ""],
  })

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  })

  // 1. 添加 createdNFTs 状态
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([])

  // 2. 在 useEffect 中加载已存储的 NFTs
  useEffect(() => {
    const storedNFTs = localStorage.getItem("createdNFTs")
    if (storedNFTs) {
      setCreatedNFTs(JSON.parse(storedNFTs))
    }
  }, [connectedAddress])

  useEffect(() => {
    setMounted(true)

    // Load previously uploaded images from localStorage
    const data: ImageData[] = []
    let id = 1
    let storedData = localStorage.getItem(`image_${id}`)
    while (storedData) {
      data.push(JSON.parse(storedData))
      id++
      storedData = localStorage.getItem(`image_${id}`)
    }
    setImageData(data)
  }, [])

  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "attributes") {
      // Split comma-separated values into attribute objects
      const attributeValues = value.split(",").map((attr) => ({ value: attr.trim() }))
      setNftInfo((prev) => ({ ...prev, attributes: attributeValues }))
    } else {
      setNftInfo((prev) => ({ ...prev, [name]: value }))
    }
  }

  // 3. 修改 handleMintItem 函数,添加 localStorage 存储逻辑
  const handleMintItem = async () => {
    if (!nftInfo.name || !nftInfo.image) {
      notification.error("请填写NFT名称和图片链接")
      return
    }

    const notificationId = notification.loading("铸造NFT中...")
    try {
      const uploadedItem = await addToIPFS({
        image: nftInfo.image,
        id: nftInfo.id,
        name: nftInfo.name,
        attributes: nftInfo.attributes,
        owner: connectedAddress || "",
        price: nftInfo.price,
        description: nftInfo.description,
      })

      notification.remove(notificationId)
      notification.success("数据已上传到IPFS")

      if (tokenIdCounter !== undefined) {
        await mintItem({
          args: [connectedAddress, uploadedItem.path],
        })

        const newId = Number(tokenIdCounter) + 1

        // 创建新的 NFT 信息对象
        const newNftInfo: NftInfo = {
          ...nftInfo,
          id: newId,
          owner: connectedAddress || "",
          CID: uploadedItem.CID,
        }

        // 更新 createdNFTs 并保存到 localStorage
        setCreatedNFTs((prevNFTs) => {
          const updatedNFTs = [...prevNFTs, newNftInfo]
          localStorage.setItem("createdNFTs", JSON.stringify(updatedNFTs))
          return updatedNFTs
        })

        // // 保存到数据库
        // const nftData = {
        //   tokenId: newId,
        //   name: nftInfo.name,
        //   image: nftInfo.image,
        //   description: nftInfo.description,
        //   owner: connectedAddress,
        //   price: nftInfo.price,
        //   ipfsCID: uploadedItem.CID,
        // }

        // try {
        //   await axios.post("/api/ipfs/nfts", nftData)
        //   notification.success("NFT创建成功，数据已保存到数据库")
        // } catch (error) {
        //   console.error("保存到数据库失败:", error)
        //   notification.error("NFT已创建，但数据库保存失败")
        // }

        // 重置表单
        setNftInfo({
          image: "",
          id: Date.now(),
          name: "",
          attributes: [],
          owner: connectedAddress || "",
          price: "",
          description: "",
        })
      } else {
        notification.error("无法获取TokenIdCounter")
      }
    } catch (error) {
      notification.remove(notificationId)
      notification.error("NFT铸造失败")
      console.error(error)
    }
  }

  // 4. 添加广播通道监听器,用于跨页面通信
  useEffect(() => {
    const broadcastChannel = new BroadcastChannel("nft_channel")

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "NFT_PURCHASED" && event.data.action === "TRANSFER_NFT") {
        const purchasedNFT = event.data.nft

        // 如果当前用户是买家
        if (event.data.to === connectedAddress) {
          const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
          if (!myNFTs.some((nft: NftInfo) => nft.id === purchasedNFT.id)) {
            const updatedMyNFTs = [...myNFTs, purchasedNFT]
            localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs))
          }
          notification.success(`NFT购买成功: ${purchasedNFT.name} 已添加到您的NFT列表中`)
        }

        // 如果当前用户是卖家
        if (event.data.from === connectedAddress) {
          const updatedCreatedNFTs = createdNFTs.filter((nft: NftInfo) => nft.id !== purchasedNFT.id)
          setCreatedNFTs(updatedCreatedNFTs)
          localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs))

          const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]")
          const updatedMyNFTs = myNFTs.filter((nft: NftInfo) => nft.id !== purchasedNFT.id)
          localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs))

          notification.info(`NFT已售出: ${purchasedNFT.name} 已转移给新的所有者`)
        }

        window.dispatchEvent(new Event("MY_NFTS_UPDATED"))
      }
    }

    broadcastChannel.addEventListener("message", handleMessage)

    return () => {
      broadcastChannel.removeEventListener("message", handleMessage)
      broadcastChannel.close()
    }
  }, [connectedAddress, createdNFTs])

  const handleIpfsUpload = async () => {
    if (!image) {
      notification.error("请选择要上传的图片")
      return
    }

    setLoading(true)
    const notificationId = notification.loading("上传至IPFS中...")
    try {
      const imageUploadedItem = await uploadToPinata(image)
      notification.remove(notificationId)
      notification.success("已上传到IPFS")

      setUploadedIpfsPath(imageUploadedItem.IpfsHash)

      // Save upload record to localStorage
      const newImageData: ImageData = {
        id: imageData.length + 1,
        name: image.name,
        onChainAddress: imageUploadedItem.IpfsHash,
      }
      const updatedImageData = [...imageData, newImageData]
      setImageData(updatedImageData)
      localStorage.setItem(`image_${newImageData.id}`, JSON.stringify(newImageData))

      // Auto-fill the NFT image field with the IPFS path
      setNftInfo((prev) => ({
        ...prev,
        image: `https://ipfs.io/ipfs/${imageUploadedItem.IpfsHash}`,
      }))
    } catch (error) {
      notification.remove(notificationId)
      notification.error("上传IPFS出错")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0])
    }
  }

  const handleIpfsDownload = async () => {
    if (!ipfsPath) {
      notification.error("请输入CID")
      return
    }

    setLoading(true)
    const notificationId = notification.loading("获取版权文件中...")
    try {
      const metaData = await getMetadataFromIPFS(ipfsPath)
      notification.remove(notificationId)
      notification.success("版权文件下载完成")
      setYourJSON(metaData)
    } catch (error) {
      notification.remove(notificationId)
      notification.error("版权文件下载错误")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            NFT创作平台
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">上传您的创作到IPFS，查看版权文件，并铸造独特的NFT作品</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Download */}
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                上传版权文件
              </h2>
              <div className="mb-4">
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="border p-3 w-full bg-gray-800 text-white rounded-lg border-gray-700 focus:border-blue-500 focus:outline-none transition-all duration-300"
                  accept="image/*"
                  required
                />
              </div>
              <button
                className={`btn transition-transform duration-300 ease-out hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-500 shadow-xl text-white px-6 py-2 rounded-full ${loading ? "opacity-70" : ""}`}
                disabled={loading}
                onClick={handleIpfsUpload}
              >
                {loading ? "上传中..." : "上传到IPFS"}
              </button>

              {uploadedIpfsPath && (
                <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-green-400 font-medium text-sm">上传成功！</p>
                  <p className="mt-1 break-all text-sm">
                    IPFS 路径：<span className="text-blue-400">{uploadedIpfsPath}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Download Section */}
            <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                下载版权文件
              </h2>
              <div className="flex border-2 border-blue-500/40 bg-gray-800 rounded-full text-white mb-4 focus-within:ring-2 focus-within:ring-blue-500/30">
                <input
                  className="input focus:outline-none bg-transparent h-[2.8rem] min-h-[2.8rem] px-4 border-none w-full font-medium placeholder:text-gray-400 text-white"
                  placeholder="请输入 CID"
                  value={ipfsPath}
                  onChange={(e) => setIpfsPath(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <button
                className={`btn transition-transform duration-300 ease-out hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-500 shadow-xl text-white px-6 py-2 rounded-full ${loading ? "opacity-70" : ""}`}
                disabled={loading}
                onClick={handleIpfsDownload}
              >
                下载版权文件
              </button>

              {mounted && Object.keys(yourJSON).length > 0 && (
                <div className="mt-4">
                  <Suspense fallback={<div className="p-4 bg-gray-700 rounded-lg">加载中...</div>}>
                    <LazyReactJson
                      style={{
                        padding: "1rem",
                        borderRadius: "0.75rem",
                        backgroundColor: "#1f2937",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        fontSize: "0.875rem",
                      }}
                      src={yourJSON}
                      theme="solarized"
                      enableClipboard={false}
                      onEdit={(edit) => setYourJSON(edit.updated_src)}
                      onAdd={(add) => setYourJSON(add.updated_src)}
                      onDelete={(del) => setYourJSON(del.updated_src)}
                      collapsed={1}
                    />
                  </Suspense>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Mint NFT */}
          <div className="bg-gray-800/60 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              铸造NFT
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">NFT 链接</label>
                <input
                  type="text"
                  name="image"
                  placeholder="IPFS 或其他图片链接"
                  className="border border-gray-600 bg-gray-700 p-3 w-full rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  value={nftInfo.image}
                  onChange={handleNftInfoChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">NFT 名称</label>
                <input
                  type="text"
                  name="name"
                  placeholder="为您的NFT命名"
                  className="border border-gray-600 bg-gray-700 p-3 w-full rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  value={nftInfo.name}
                  onChange={handleNftInfoChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">NFT 属性</label>
                <input
                  type="text"
                  name="attributes"
                  placeholder="用逗号分隔多个属性"
                  className="border border-gray-600 bg-gray-700 p-3 w-full rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  value={nftInfo.attributes.map((attr) => attr.value).join(",")}
                  onChange={handleNftInfoChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">NFT 价格</label>
                <input
                  type="text"
                  name="price"
                  placeholder="设置NFT价格预期"
                  className="border border-gray-600 bg-gray-700 p-3 w-full rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200"
                  value={nftInfo.price}
                  onChange={handleNftInfoChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">NFT 描述</label>
                <textarea
                  name="description"
                  placeholder="描述您的NFT作品"
                  className="border border-gray-600 bg-gray-700 p-3 w-full rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-all duration-200 min-h-[100px] resize-none"
                  value={nftInfo.description}
                  onChange={handleNftInfoChange}
                />
              </div>
              <div className="pt-2">
                <button
                  className="w-full btn transition-transform duration-300 ease-out hover:scale-105 bg-gradient-to-r from-pink-600 to-purple-600 shadow-xl text-white py-3 rounded-lg font-medium"
                  onClick={handleMintItem}
                >
                  铸造NFT
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload History Table */}
        <div className="mt-12 bg-gray-800/60 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            上传历史
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700/70">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">文件名</th>
                  <th className="p-3 text-left">IPFS 地址</th>
                  <th className="p-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {imageData.length > 0 ? (
                  imageData.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors duration-150"
                    >
                      <td className="p-3">{row.id}</td>
                      <td className="p-3">{row.name}</td>
                      <td className="p-3">
                        <a
                          href={`https://ipfs.io/ipfs/${row.onChainAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-150"
                        >
                          {`ipfs://${row.onChainAddress.substring(0, 6)}...${row.onChainAddress.substring(row.onChainAddress.length - 4)}`}
                        </a>
                      </td>
                      <td className="p-3">
                        <button
                          className="text-sm bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-3 py-1 rounded transition-colors duration-200"
                          onClick={() => {
                            setNftInfo((prev) => ({
                              ...prev,
                              image: `https://ipfs.io/ipfs/${row.onChainAddress}`,
                            }))
                          }}
                        >
                          使用此图片
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      暂无上传记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default NftPlatformPage
