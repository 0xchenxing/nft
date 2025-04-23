"use client";
import { useState, useEffect } from "react";
import { Address, AddressInput } from "../scaffold-eth";
import { Collectible } from "./MyHoldings";
import { useScaffoldContractWrite, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { wrapInTryCatch } from "~~/utils/scaffold-eth/common";
import { useAccount } from "wagmi";

interface NFTCardProps {
  nft: Collectible;
  onTransferSuccess: (id: number) => void;
}

export const NFTCard = ({ nft, onTransferSuccess }: NFTCardProps) => {
  const [transferToAddress, setTransferToAddress] = useState("");
  const [imageURL, setImageURL] = useState(nft.image);
  const [nftDetails, setNftDetails] = useState<Collectible>(nft);
  const [showDetails, setShowDetails] = useState(false);
  const broadcastChannel = new BroadcastChannel("nft_channel");

  const { address: connectedAddress } = useAccount();

  // 设置授权和 NFT 转移函数
  const { writeAsync: setApprovalForAll } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "setApprovalForAll",
    args: [connectedAddress, true],
  });

  const { writeAsync: transferNFT } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "transferFrom",
    args: [nft.owner, transferToAddress, BigInt(nft.tokenId || nft.id)],
  });

  // 获取所有转移事件
  const { data: transferEvents, isLoading: eventsLoading } = useScaffoldEventHistory({
    contractName: "YourCollectible",
    eventName: "Transfer",
    fromBlock: 0n,
  });

  // 过滤与当前 NFT 相关的交易历史
  const nftTransferHistory = transferEvents?.filter(
    (event) =>
      event.args.tokenId?.toString() === (nft.tokenId || nft.id).toString()
  );

  // 获取最新NFT数据
  useEffect(() => {
    const fetchNFTData = async () => {
      const storedNFTs = localStorage.getItem("createdNFTs");
      if (storedNFTs) {
        const nfts = JSON.parse(storedNFTs);
        const currentNFT = nfts.find((item: Collectible) => item.id === nft.id);
        if (currentNFT) {
          setImageURL(currentNFT.image);
          setNftDetails(currentNFT);
        }
      }
    };

    fetchNFTData();
  }, [nft.id]);

  // NFT 转移流程：调用合约函数，并更新本地存储
  const handleTransfer = async () => {
    if (connectedAddress !== nft.owner) {
      await setApprovalForAll();
    }
    await transferNFT();
    onTransferSuccess(nft.id);

    // 从本地存储中删除该 NFT
    const storedNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
    const updatedNFTs = storedNFTs.filter((item: Collectible) => item.id !== nft.id);
    localStorage.setItem("createdNFTs", JSON.stringify(updatedNFTs));

    const storedMyNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
    const updatedMyNFTs = storedMyNFTs.filter((item: Collectible) => item.id !== nft.id);
    localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs));
    
    // 转移后更新 NFT owner 状态，并存入目标地址的本地存储
    nft.owner = transferToAddress;
    const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
    myNFTs.push({ ...nft });
    localStorage.setItem("myNFTs", JSON.stringify(myNFTs));

    // 通过 BroadcastChannel 发送更新后的 NFT 数据
    const newNFT = { ...nftDetails, owner: transferToAddress };
    broadcastChannel.postMessage(newNFT);
  };

  return (
    <>
      <div className="card bg-gray-800 rounded-xl overflow-hidden transition-transform duration-300 hover:shadow-2xl group">
        <div className="relative overflow-hidden">
          <img 
            src={imageURL || nft.image} 
            alt="NFT" 
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
            onClick={() => setShowDetails(true)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 p-4">
            <h3 className="text-xl font-bold text-white mb-1 truncate">{nftDetails.name}</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-purple-300">#ID {nft.id}</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {nftDetails.attributes?.map((attr, index) => (
              <div 
                key={index}
                className="px-3 py-1 bg-gray-700 rounded-full text-sm text-purple-300 border border-purple-500/30"
              >
                {attr.value}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <AddressInput
              value={transferToAddress}
              onChange={setTransferToAddress}
              placeholder="输入接收地址"
              className="bg-gray-700 border-gray-600 text-purple-100 rounded-lg"
            />
            <button
              onClick={wrapInTryCatch(handleTransfer, "转移NFT时发生错误")}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold
                       hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-[1.02]"
            >
              立即转移
            </button>
          </div>
        </div>
      </div>

      {/* 修改后的详情弹窗 */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                NFT 详情
              </h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 p-6">
              <div className="space-y-6">
                <div className="aspect-square bg-gray-700 rounded-xl overflow-hidden">
                  <img 
                    src={imageURL || nft.image} 
                    alt={nftDetails.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="space-y-2">
                  <DetailItem label="描述" value={nftDetails.description} />
                  <DetailItem label="拥有者">
                    <Address address={nftDetails.owner} className="text-purple-300" />
                  </DetailItem>
                  {nftDetails.CID && <DetailItem label="IPFS CID" value={nftDetails.CID} />}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">交易历史</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {nftTransferHistory?.map((transfer, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">From:</span>
                          <Address address={transfer.args.from} />
                        </div>
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="text-gray-400">To:</span>
                          <Address address={transfer.args.to} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DetailItem = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
  <div className="border-b border-gray-700 pb-2">
    <dt className="text-sm font-medium text-purple-300">{label}</dt>
    <dd className="mt-1 text-gray-300">
      {value || children}
    </dd>
  </div>
);

export default NFTCard;
