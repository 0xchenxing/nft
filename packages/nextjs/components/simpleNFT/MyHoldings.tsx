import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
// import { useScaffoldContract, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { notification, message, Switch, Pagination } from "antd";


export interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: {value: string }[];
  owner: string;
  price: string;
  description: string;
  uri?: string;
  tokenId?: number;
  CID?: string;
}

export const MyHoldings = () => {
  const { address: connectedAddress } = useAccount();//钱包地址
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);//我的nft列表
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);//表示是否正在加载所有收藏品（allCollectibles）的状态
  const [isListed, setIsListed] = useState<{ [key: number]: boolean }>({});//存储每个收藏品是否被列出（listed）的状态
  const [price, setPrice] = useState<{ [key: number]: string }>({});//存储每个收藏品的价格
  const [currentPage, setCurrentPage] = useState(1);//表示当前显示的页码
  const itemsPerPage = 4;//表示每页显示的nft数量
  const broadcastChannel = new BroadcastChannel('nft_channel');//广播系统，发送和接收消息

  useEffect(() => {
    // 定义一个异步函数，用于更新用户的 NFT 列表
    const updateMyCollectibles = async (): Promise<void> => {
        // 如果用户没有连接钱包（connectedAddress 为 null 或 undefined），直接返回
        if (!connectedAddress) return;                             

        // 设置加载状态为 true，表示正在加载 NFT 数据
        setAllCollectiblesLoading(true);

        try {
            // 从本地存储中获取用户拥有的 NFT 数据，解析为数组
            const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");//购买后的nft
            // 从本地存储中获取用户创建的 NFT 数据，解析为数组
            const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");//刚刚创建的nft
            // 从本地存储中获取已上架的 NFT 数据，解析为数组
            const listedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");//上架的nft的（id和价格）数据，“allNFTs”代表的是上架的nft

            // 获取已上架的 NFT IDs，存储在一个 Set 中，便于后续过滤
            const listedNFTIds = new Set(listedNFTs.map((nft: { id: number }) => nft.id));

            // 合并用户拥有的 NFT 和用户创建的 NFT
            let userNFTs = [
                ...myNFTs,
                ...createdNFTs
            ].filter(nft => 
                // 过滤出属于当前用户的 NFT（owner 为 connectedAddress）
                nft.owner === connectedAddress && 
                // 如果 NFT 已上架，确保它仍然属于当前用户
                (!listedNFTIds.has(nft.id) || nft.owner === connectedAddress)
            );

            // 使用 Map 去除重复的 NFT，确保每个 NFT 只出现一次
            userNFTs = Array.from(new Map(userNFTs.map(item => [item.id, item])).values());

            // 更新组件状态，存储用户的所有 NFT
            setMyAllCollectibles(userNFTs);

            // 初始化上架状态和价格对象
            const listedState: { [key: number]: boolean } = {};
            const priceState: { [key: number]: string } = {};

            // 遍历已上架的 NFT，更新上架状态和价格
            listedNFTs.forEach((nft: { id: number; price: string }) => {
                // 如果用户拥有的 NFT 中包含这个已上架的 NFT
                if (userNFTs.some(userNft => userNft.id === nft.id)) {
                    // 设置上架状态为 true
                    listedState[nft.id] = true;
                    // 设置价格
                    priceState[nft.id] = nft.price;
                }
            });

            // 更新上架状态和价格状态
            setIsListed(listedState);
            setPrice(priceState);

        } catch (error) {
            // 捕获错误并打印到控制台
            console.error("Error updating collectibles:", error);
            // 显示错误通知
            notification.error({
                message: "更新NFT列表失败",
                description: "请刷新页面重试"
            });
        } finally {
            // 无论成功还是失败，最后都将加载状态设置为 false
            setAllCollectiblesLoading(false);
        }
    };

    // 定义一个函数，用于处理广播消息
    const handleBroadcastMessage = (event: MessageEvent) => {
        // 检查消息类型和操作是否为 NFT 购买和转移
        if (event.data.type === 'NFT_PURCHASED' && event.data.action === 'TRANSFER_NFT') {
            // 解构消息数据
            const { nft, from, to } = event.data;

            // 如果 NFT 被转移到当前用户
            if (to === connectedAddress) {
                // 更新 NFT 列表，添加新的 NFT
                setMyAllCollectibles(prev => {
                    // 如果 NFT 尚未存在于列表中，添加它
                    if (!prev.some(item => item.id === nft.id)) {
                        return [...prev, nft];
                    }
                    // 否则，返回原始列表
                    return prev;
                });
            } 
            // 如果 NFT 从当前用户转移出去
            else if (from === connectedAddress) {
                // 更新 NFT 列表，移除该 NFT
                setMyAllCollectibles(prev => prev.filter(item => item.id !== nft.id));
                // 更新上架状态，移除该 NFT 的上架状态
                setIsListed(prev => {
                    const updated = { ...prev };
                    delete updated[nft.id];
                    return updated;
                });
                // 更新价格状态，移除该 NFT 的价格
                setPrice(prev => {
                    const updated = { ...prev };
                    delete updated[nft.id];
                    return updated;
                });

                // 从本地存储中移除该 NFT
                const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
                const updatedMyNFTs = myNFTs.filter((item: Collectible) => item.id !== nft.id);
                localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs));

                const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
                const updatedCreatedNFTs = createdNFTs.filter((item: Collectible) => item.id !== nft.id);
                localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs));
            }
        }
    };

    // 监听 MY_NFTS_UPDATED 事件，当事件触发时，调用 updateMyCollectibles 函数
    window.addEventListener('MY_NFTS_UPDATED', updateMyCollectibles);
    // 监听广播消息，实时更新 NFT 列表
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
    // 初始调用 updateMyCollectibles 函数，加载 NFT 数据
    updateMyCollectibles();

    // 设置一个定时器，每 20 秒调用一次 updateMyCollectibles，定期刷新 NFT 数据
    const interval = setInterval(updateMyCollectibles, 20000);

    // 返回一个清理函数，在组件卸载时执行
    return () => {
        // 移除 MY_NFTS_UPDATED 事件监听器
        window.removeEventListener('MY_NFTS_UPDATED', updateMyCollectibles);
        // 移除广播消息监听器
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
        // 关闭广播通道
        broadcastChannel.close();
        // 清理定时器
        clearInterval(interval);
    };
}, [connectedAddress]); // 依赖项为 connectedAddress，当 connectedAddress 变化时，重新执行 useEffect

  const handleTransferSuccess = (id: number) => {
    setMyAllCollectibles(prev => prev.filter(item => item.id !== id));
    setIsListed(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleListToggle = async (checked: boolean, id: number) => {
    try {
      if (checked && !price[id]) {
        message.error("请设置价格");
        return;
      }

      const nft = myAllCollectibles.find(nft => nft.id === id);// 从本地状态查找NFT
      if (!nft) {
        message.error("NFT不存在");
        return;
      }

      if (checked) {
        // 添加上架的localStorage
        const listedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");
        listedNFTs.push({ id, price: price[id] });
        localStorage.setItem("listedNFTs", JSON.stringify(listedNFTs));

        let allNFTs = JSON.parse(localStorage.getItem("allNFTs") || "[]");
        allNFTs.push({ ...nft, isListed: true });
        localStorage.setItem("allNFTs", JSON.stringify(allNFTs));

        message.success("上架成功");
      } else {
        // 移除上架的localStorage
        const listedNFTs = JSON.parse(localStorage.getItem("listedNFTs") || "[]");
        const updatedListedNFTs = listedNFTs.filter((item: { id: number }) => item.id !== id);
        localStorage.setItem("listedNFTs", JSON.stringify(updatedListedNFTs));

        let allNFTs = JSON.parse(localStorage.getItem("allNFTs") || "[]");
        allNFTs = allNFTs.filter((nft: Collectible) => nft.id !== id);
        localStorage.setItem("allNFTs", JSON.stringify(allNFTs));

        message.success("下架成功");
      }

      setIsListed(prev => ({ ...prev, [id]: checked }));
    } catch (error) {
      console.error("Error toggling list status:", error);
      message.error("操作失败");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedNFTs = myAllCollectibles.slice(//nft分页展示
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8 text-center">
          我的数字藏品
        </h1>

        {myAllCollectibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-6xl mb-4">🖼️</div>
            <div className="text-2xl text-purple-200 font-semibold">暂无NFT藏品</div>
            <p className="text-gray-400 mt-2">快去创建或购买第一个NFT吧！</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {paginatedNFTs.map((item) => (
                <div 
                  key={item.id}
                  className="relative group bg-gray-800 rounded-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <NFTCard nft={item} onTransferSuccess={handleTransferSuccess} />
                  
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <span className="text-sm font-medium text-purple-300">上架状态</span>
                      <Switch
                        checked={isListed[item.id] || false}
                        onChange={(checked) => handleListToggle(checked, item.id)}
                        className={`${isListed[item.id] ? 'bg-purple-500' : 'bg-gray-600'}`}
                      />
                    </div>
                    
                    <div className="relative">
                      <input
                        type="number"
                        value={price[item.id] || ""}
                        onChange={(e) => setPrice(prev => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="价格 (ETH)"
                        disabled={isListed[item.id]}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 pr-12"
                      />
                      <span className="absolute right-4 top-2.5 text-gray-400 text-sm">ETH</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={itemsPerPage}
                total={myAllCollectibles.length}
                onChange={handlePageChange}
                itemRender={(page, type, element) => (
                  <button
                    className={`${
                      page === currentPage 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-700 text-gray-300'
                    } mx-1 px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-purple-600 border-none`}
                  >
                    {type === 'page' ? page : element}
                  </button>
                )}
                showLessItems
                className="[&_.ant-pagination-item]:border-none [&_.ant-pagination-item]:bg-transparent 
                          [&_.ant-pagination-item-link]:border-none [&_.ant-pagination-item-link]:bg-transparent 
                          bg-transparent text-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};