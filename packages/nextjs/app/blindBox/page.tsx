'use client'
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite,useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { formatEther,TransactionResponse} from "ethers";
import { notification } from "antd";
import { motion } from "framer-motion";

// 类型定义
type MysteryBox = {
  name: string;
  description: string;
  price: number;
  tokenIds: number[];
  totalSupply: number;
  remainingSupply: number;
};

export interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  uri?: string;
  tokenId?: number;
  CID?: string;
}

// 全局样式（放在组件前）
const styles = `
  .preserve-3d {
    transform-style: preserve-3d;
  }
  .front {
    backface-visibility: hidden;
    transform: rotateY(0deg);
  }
  .back {
    backface-visibility: hidden;
    transform: rotateY(180deg);
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
`;

// 配置antd通知样式
notification.config({
  placement: 'topRight',
  top: 60,
  duration: 3,
});

export default function MysteryBoxPage() {
  const [isHovered, setIsHovered] = useState(false);
  const { address } = useAccount();
  const [newTokenId,setNewTokenId] = useState<BigInt|null>(null);
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]);//存储所有 NFT 数据

  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [userNFTs, setUserNFTs] = useState<Collectible[]>([]);
  const [loadingNFTs, setLoadingNFTs] = useState(true);

  // 读取盲盒数据
  const { data: boxData, isLoading } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "getMysteryBox",
    watch: true,// 实时监控数据变化
    cacheOnBlock: true,// 基于区块号缓存数据
  });

  // 解析数据
  const parseBoxData = (data: any): MysteryBox | undefined => {
    if (!data) return undefined;
    try {
      return {
        name: data.name.toString(),
        description: data.description.toString(),
        price: parseFloat(formatEther(BigInt(data.price.toString()))),
        tokenIds: data.tokenIds.map((n: bigint) => Number(n)),
        totalSupply: Number(data.totalSupply),
        remainingSupply: Number(data.remainingSupply)
      };
    } catch (error) {
      console.error("Error parsing box data:", error);
      return undefined;
    }
  };

  const parsedBox = parseBoxData(boxData);

  // 购买功能
  const { writeAsync: purchaseBox } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchaseMysteryBox"
  });

  // 存入功能
  const { writeAsync: depositNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "depositToMysteryBox",
    args: [selectedTokenId ? BigInt(selectedTokenId) : undefined],
    onSuccess: () => {
      notification.success({ message: "NFT存入成功！" });
      setSelectedTokenId(null);
      // 更新本地数据
      const updatedNFTs = userNFTs.filter(nft => nft.id !== selectedTokenId);
      setUserNFTs(updatedNFTs);
    }
  });
  useEffect(() => {
    const loadUserNFTs = () => {
      try {
        const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
        const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");

        // 合并并过滤当前用户拥有的NFT
        const allNFTs = [...myNFTs, ...createdNFTs].filter(nft => 
          nft.owner?.toLowerCase() === address?.toLowerCase()
        );
        
        setUserNFTs(allNFTs);
      } catch (error) {
        console.error("Error loading NFTs:", error);
      } finally {
        setLoadingNFTs(false);
      }
    };
  
    if (address) {
      loadUserNFTs();
      // 添加事件监听，当localStorage变化时更新
      window.addEventListener('storage', loadUserNFTs);
      return () => window.removeEventListener('storage', loadUserNFTs);
    }
  }, [address]);

  useEffect(() => {
    const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
    const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");

    // 合并所有的nft
    const allNFTs = [...myNFTs, ...createdNFTs];
    setAllNFTs(allNFTs);
  }, []);

  //监听事件获取tokenId
  useScaffoldEventSubscriber({//钩子函数只能放部件位置
    contractName: "YourCollectible",
    eventName: "MysteryBoxPurchased",
    listener: (logs) => {
      logs.forEach((log) => {
        if (
          log.args &&
          'tokenId' in log.args &&
          typeof log.args.tokenId === 'bigint'
        ) {
          setNewTokenId(log.args.tokenId);
        }
      });
    },
  });

  useEffect(() => {
    if (newTokenId !== undefined && newTokenId !== null) {
      console.log("++++++++++++++===================================newTokenId:", newTokenId);
      const tokenId = Number(newTokenId);
      // 更新localStorage
      // 获取购买后的NFT数据,对现有 NFT 数据进行更新和扩展
       const purchasedNFT = {
        ...allNFTs.find(nft => nft.id === tokenId),
        owner: address,//买家钱包地址
        price: "1",
        purchaseTime: new Date().toISOString(),
      };
  
      // 从卖家的所有相关存储中移除 NFT
      const sellerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
      const updatedSellerNFTs = sellerNFTs.filter((nft: Collectible) => nft.id !== tokenId);
      localStorage.setItem("myNFTs", JSON.stringify(updatedSellerNFTs));
  
      // 同时从 createdNFTs 中移除
      const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
      const updatedCreatedNFTs = createdNFTs.filter((nft: Collectible) => nft.id !== tokenId);
      localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs));
  
      // 添加到买家的 myNFTs 中
      const buyerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
      if (!buyerNFTs.some((nft: Collectible) => nft.id === tokenId)) {//至少存在一个元素满足条件，取反，不存在元素满足条件
        buyerNFTs.push(purchasedNFT);
        localStorage.setItem("myNFTs", JSON.stringify(buyerNFTs));
      }
    }
  }, [newTokenId]); 

  const handlePurchaseBox = async () => {
    if (!address) {
      notification.error({ message: "请先连接钱包" });
      return;
    }
    if (!parsedBox) return;

    try {
      await purchaseBox();
    } catch (error: any) {
      console.error("购买失败:", error);
      notification.error({
        message: "购买失败",
        description: error?.message?.includes("user rejected")
          ? "用户取消了交易"
          : error?.message || "未知错误"
      });
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <style>{styles}</style>

      {/* 3D 盲盒卡片 */}
      <motion.div 
        className="max-w-2xl mx-auto"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      >
        <div className="relative group perspective-1000 h-96">
          <div
            className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
              isHovered ? "rotate-y-180" : ""
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* 正面 */}
            <div className="front absolute w-full h-full bg-gradient-to-br from-purple-600 to-blue-500 rounded-3xl p-8 shadow-2xl">
              <div className="h-full flex flex-col justify-between">
                <h2 className="text-4xl font-bold text-white text-center">
                  {parsedBox?.name || "神秘盲盒"}
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 p-6 rounded-xl">
                    <h3 className="text-xl font-semibold text-white mb-4">包含NFT ID</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedBox?.tokenIds?.map(id => (
                        <span 
                          key={id}
                          className="px-3 py-1 bg-white/20 rounded-full text-white text-sm"
                        >
                          #{id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/10 p-6 rounded-xl">
                      <div className="text-3xl font-bold text-white">
                        {parsedBox?.price?.toFixed(3)} ETH
                      </div>
                      <div className="text-white/80 mt-2">单价</div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-xl">
                      <div className="flex justify-between text-white mb-2">
                        <span>剩余数量</span>
                        <span>{parsedBox?.remainingSupply}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                          style={{ 
                            width: `${((parsedBox?.remainingSupply || 0) / (parsedBox?.totalSupply || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Address address={address} />
                </div>
              </div>
            </div>

            {/* 背面 */}
            <div className="back absolute w-full h-full bg-gradient-to-br from-blue-600 to-purple-500 rounded-3xl p-8">
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <h3 className="text-2xl font-bold text-white">NFT盲盒</h3>
                <p className="text-white/90 leading-relaxed">
                  {parsedBox?.description || "随机包含多个独特NFT的数字收藏品"}
                </p>
                <div className="text-sm text-white/80">
                  <Address address={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 操作区域 */}
      <div className="max-w-md mx-auto mt-12 space-y-8">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={handlePurchaseBox}
            disabled={!address || parsedBox?.remainingSupply === 0}
            className={`w-full py-3 rounded-xl text-lg font-bold transition-all ${
              !address || parsedBox?.remainingSupply === 0
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {!address ? "连接钱包" : 
             parsedBox?.remainingSupply === 0 ? "已售罄" : 
             "立即购买"}
          </button>


        {/* 存入 */}
        <div className="bg-white/5 p-6 rounded-xl space-y-4">
  <h3 className="text-xl font-semibold text-white mb-4">我的NFT藏品</h3>
  
  {loadingNFTs ? (
    <div className="flex justify-center py-8">
      {/* <Spinner /> */}
    </div>
  ) : userNFTs.length === 0 ? (
    <div className="text-center text-white/80 py-6">
      您还没有可存入的NFT
    </div>
  ) : (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {userNFTs.map(nft => (
          <motion.div
            key={nft.id}
            className={`relative group bg-white/5 rounded-xl p-4 cursor-pointer transition-all
              ${selectedTokenId === nft.id ? "ring-2 ring-purple-500" : "hover:bg-white/10"}`}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedTokenId(nft.id)}
          >
            <div className="aspect-square w-full bg-gray-800 rounded-lg overflow-hidden">
              {nft.image ? (
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  No Image
                </div>
              )}
            </div>
            <div className="mt-3">
              <h4 className="text-white font-medium truncate">{nft.name}</h4>
              <div className="flex justify-between items-center text-sm text-white/80">
                <span>ID: #{nft.id}</span>
                {nft.price && (
                  <span>{parseFloat(nft.price).toFixed(2)} ETH</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={() => depositNFT()}
          disabled={!selectedTokenId}
          className={`w-full py-3 rounded-lg transition-colors ${
            selectedTokenId 
              ? "bg-purple-600 hover:bg-purple-700" 
              : "bg-gray-600 cursor-not-allowed"
          }`}
        >
          {selectedTokenId ? `存入 NFT #${selectedTokenId}` : "请选择要存入的NFT"}
        </button>
      </div>
    </>
  )}
</div>
        </motion.div>
      </div>
    </div>
  );
}