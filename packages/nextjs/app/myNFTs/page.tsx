"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi"; // 钱包连接库
import { MyHoldings } from "~~/components/simpleNFT"; // NFT持有展示组件
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth"; // 智能合约交互钩子
import { notification } from "~~/utils/scaffold-eth"; // 通知系统
// import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch"; // IPFS上传工具
// import axios from "axios"; // HTTP客户端

interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: {value: string }[];
  owner: string;
  price: string;
  description: string;
  CID?: string;
}

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();

  const [nftInfo, setNftInfo] = useState<NftInfo>({
    image: "",
    id: Date.now(),
    name: "",
    attributes: [],
    owner: connectedAddress || "",
    price: "",
    description: "",
  });
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  // const { writeAsync: mintItem } = useScaffoldContractWrite({
  //   contractName: "YourCollectible",
  //   functionName: "mintItem",
  //   args: [connectedAddress, ""],
  // });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  // 根据输入动态更新 NFT 信息状态
  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNftInfo({
      ...nftInfo,
      [name]:
        name === "attributes"
          ? value.split(",").map((attr) => ({ trait_type: name, value: attr.trim() }))
          : value,
    });
  };

  // // NFT铸造流程
  // const handleMintItem = async () => {
  //   const { image, id, name, attributes, owner, price, description } = nftInfo;
  //   if (image === "") {
  //     notification.error("请提供图片链接");
  //     return;
  //   }

  //   const notificationId = notification.loading("上传至IPFS中...");
  //   try {
  //     const uploadedItem = await addToIPFS({ image, id, name, attributes, owner, price, description });
  //     notification.remove(notificationId);
  //     notification.success("数据已上传到IPFS中");

  //     if (tokenIdCounter !== undefined) {
  //       await mintItem({
  //         args: [connectedAddress, uploadedItem.path],
  //       });

  //       const newId = Number(tokenIdCounter) + 1;

  //       const newNftInfo: NftInfo = {
  //         ...nftInfo,
  //         id: newId,
  //         owner: connectedAddress || "",
  //         CID: uploadedItem.CID,
  //       };

  //       setCreatedNFTs((prevNFTs) => {
  //         const updatedNFTs = [...prevNFTs, newNftInfo];
  //         localStorage.setItem("createdNFTs", JSON.stringify(updatedNFTs));
  //         return updatedNFTs;
  //       });

  //       setNftInfo({
  //         image: "",
  //         id: Date.now(),
  //         name: "",
  //         attributes: [],
  //         owner: connectedAddress || "",
  //         price: "",
  //         description: "",
  //       });

  //       const nftData = {
  //         tokenId: newId,
  //         name: name,
  //         image: image,
  //         description: description,
  //         owner: connectedAddress,
  //         price: price || "",
  //         ipfsCID: uploadedItem.CID,
  //       };

  //       try {
  //         await axios.post("/api/ipfs/nfts", nftData);
  //         notification.success("NFT创建成功，数据已保存到数据库");
  //       } catch (error) {
  //         console.error("保存到数据库失败:", error);
  //         notification.error("NFT已创建，但数据库保存失败");
  //       }
  //     } else {
  //       notification.error("无法获取TokenIdCounter");
  //     }
  //   } catch (error) {
  //     notification.remove(notificationId);
  //     console.error("上传IPFS出错: ", error);
  //     notification.error("上传IPFS失败");
  //   }
  // };

  useEffect(() => {
    const storedNFTs = localStorage.getItem("createdNFTs");
    if (storedNFTs) {
      setCreatedNFTs(JSON.parse(storedNFTs));
    }
  }, [connectedAddress]);

  useEffect(() => {
    const broadcastChannel = new BroadcastChannel("nft_channel");

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "NFT_PURCHASED" && event.data.action === "TRANSFER_NFT") {
        const purchasedNFT = event.data.nft;

        if (event.data.to === connectedAddress) {
          const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
          if (!myNFTs.some((nft: NftInfo) => nft.id === purchasedNFT.id)) {
            const updatedMyNFTs = [...myNFTs, purchasedNFT];
            localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs));
          }

          notification.success(`NFT购买成功: ${purchasedNFT.name} 已添加到您的NFT列表中`);
        }

        if (event.data.from === connectedAddress) {
          const updatedCreatedNFTs = createdNFTs.filter((nft: NftInfo) => nft.id !== purchasedNFT.id);
          setCreatedNFTs(updatedCreatedNFTs);
          localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs));

          const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
          const updatedMyNFTs = myNFTs.filter((nft: NftInfo) => nft.id !== purchasedNFT.id);
          localStorage.setItem("myNFTs", JSON.stringify(updatedMyNFTs));

          notification.info(`NFT已售出: ${purchasedNFT.name} 已转移给新的所有者`);
        }

        window.dispatchEvent(new Event("MY_NFTS_UPDATED"));
      }
    };

    broadcastChannel.addEventListener("message", handleMessage);

    return () => {
      broadcastChannel.removeEventListener("message", handleMessage);
      broadcastChannel.close();
    };
  }, [connectedAddress, createdNFTs]);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <MyHoldings />
    </div>
  );
};

export default MyNFTs;
