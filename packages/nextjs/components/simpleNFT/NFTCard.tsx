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
      {/* NFT卡片，统一暗黑风格 */}
      <div className="card card-compact bg-gray-900 shadow-lg sm:min-w-[300px] shadow-secondary text-white">
        <figure className="relative cursor-pointer" onClick={() => setShowDetails(true)}>
          <img src={imageURL || nft.image} alt="NFT Image" className="h-80 min-w-full" />
          <figcaption className="glass absolute bottom-4 left-4 p-4 w-25 rounded-xl">
            <span className="text-white"># {nft.id}</span>
          </figcaption>
        </figure>
        <div className="card-body space-y-3 text-white">
          <div className="flex items-center justify-center">
            <p className="text-xl p-0 m-0 font-semibold">{nftDetails.name}</p>
            <div className="flex flex-wrap space-x-2 mt-1">
              {nftDetails.attributes?.map((attr, index) => (
                <span key={index} className="badge badge-primary py-3">
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center mt-1">
            <p className="my-0 text-lg">{nftDetails.description}</p>
          </div>
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">Owner : </span>
            <Address address={nftDetails.owner} />
          </div>
          {nftDetails.CID && (
            <div className="flex space-x-3 mt-1 items-center">
              <span className="text-lg font-semibold">CID : </span>
              <span>{nftDetails.CID}</span>
            </div>
          )}
          <div className="flex flex-col my-2 space-y-1">
            <span className="text-lg font-semibold mb-1">Transfer To: </span>
            <AddressInput
              value={transferToAddress}
              placeholder="receiver address"
              onChange={(newValue) => setTransferToAddress(newValue)}
            />
          </div>
          <div className="card-actions justify-end">
            <button
              className="btn btn-secondary btn-md px-8 tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transform hover:scale-105 transition duration-200"
              onClick={wrapInTryCatch(handleTransfer, "转移NFT时发生错误")}
              style={{ margin: "0px auto" }}
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* NFT详情弹窗，暗黑风格 */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 text-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">NFT 详情</h2>
              <button className="btn btn-ghost btn-sm text-white" onClick={() => setShowDetails(false)}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img src={imageURL || nft.image} alt={nftDetails.name} className="w-full rounded-lg mb-4" />
                <h3 className="text-xl font-bold mb-2">{nftDetails.name}</h3>
                <p className="text-base-content/70 mb-4">{nftDetails.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Token ID:</span>
                    <span>#{nft.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">当前拥有者:</span>
                    <Address address={nftDetails.owner} />
                  </div>
                  {nftDetails.CID && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">IPFS CID:</span>
                      <span className="font-mono text-sm">{nftDetails.CID}</span>
                    </div>
                  )}
                </div>

                {nftDetails.attributes && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">属性</h4>
                    <div className="flex flex-wrap gap-2">
                      {nftDetails.attributes.map((attr, index) => (
                        <span key={index} className="badge badge-primary">
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">交易历史</h3>
                <div className="space-y-4">
                  {eventsLoading ? (
                    <div className="flex justify-center items-center mt-4">
                      <span className="loading loading-spinner loading-xl"></span>
                    </div>
                  ) : nftTransferHistory && nftTransferHistory.length > 0 ? (
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th className="bg-primary">From</th>
                          <th className="bg-primary">To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nftTransferHistory.map((transfer, index) => (
                          <tr key={index}>
                            <td>
                              <Address address={transfer.args.from} />
                            </td>
                            <td>
                              <Address address={transfer.args.to} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-base-content/70">暂无交易记录</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NFTCard;
