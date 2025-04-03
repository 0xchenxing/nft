"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Modal, Button, notification, Pagination, Input } from "antd";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";

interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  description: string;
  CID: string;
}

interface ListedNftInfo {
  id: number;
  price: string;
}

interface FilterOptions {
  category: string;
  sortBy: string;
}

const AllNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount(); // 钱包地址
  const { writeAsync: purchase } = useScaffoldContractWrite({
    // 购买 NFT 函数 purchase
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [undefined, undefined, undefined],
  });

  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]); // 所有 NFT 数据
  const [listedNFTs, setListedNFTs] = useState<ListedNftInfo[]>([]); // 已上架的 NFT 数据
  const [currentPage, setCurrentPage] = useState(1); // 当前分页页码
  const [searchText, setSearchText] = useState(""); // 搜索输入框的文本
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]); // 搜索过滤后的 NFT 数据
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    // 分类和排序选项
    category: "all",
    sortBy: "newest",
  });

  const itemsPerPage = 6; // 每页显示的 NFT 数量
  const broadcastChannel = new BroadcastChannel("nft_channel"); // 广播系统

  const handlePurchase = async (tokenId: number, price: string, owner: string) => {
    try {
      if (!connectedAddress) {
        notification.error({ message: "请先连接钱包" });
        return;
      }

      if (!tokenId || !price || !owner) {
        notification.error({ message: "参数错误", description: "缺少必要的参数" });
        return;
      }

      if (price === "N/A") {
        notification.error({ message: "此NFT未设置价格" });
        return;
      }

      const priceInWei = ethers.parseUnits(price, "ether");

      // 调用合约购买方法
      await purchase({
        args: [BigInt(tokenId), owner, priceInWei],
        value: priceInWei,
      });

      // 构建购买后的 NFT 数据，对现有 NFT 数据进行更新和扩展
      const purchasedNFT = {
        ...allNFTs.find(nft => nft.id === tokenId),
        owner: connectedAddress, // 买家钱包地址
        price: price,
        purchaseTime: new Date().toISOString(),
      };

      // 从卖家的所有存储中移除 NFT
      const sellerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
      const updatedSellerNFTs = sellerNFTs.filter((nft: Collectible) => nft.id !== tokenId);
      localStorage.setItem("myNFTs", JSON.stringify(updatedSellerNFTs));

      // 同时从 createdNFTs 中移除
      const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
      const updatedCreatedNFTs = createdNFTs.filter((nft: Collectible) => nft.id !== tokenId);
      localStorage.setItem("createdNFTs", JSON.stringify(updatedCreatedNFTs));

      // 添加到买家的 myNFTs 中
      const buyerNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
      if (!buyerNFTs.some((nft: Collectible) => nft.id === tokenId)) {
        buyerNFTs.push(purchasedNFT);
        localStorage.setItem("myNFTs", JSON.stringify(buyerNFTs));
      }

      // 更新 allNFTs 存储
      const updatedAllNFTs = allNFTs.filter(nft => nft.id !== tokenId);
      setAllNFTs(updatedAllNFTs);
      localStorage.setItem("allNFTs", JSON.stringify(updatedAllNFTs));

      // 更新 listedNFTs 存储
      const updatedListedNFTs = listedNFTs.filter(nft => nft.id !== tokenId);
      setListedNFTs(updatedListedNFTs);
      localStorage.setItem("listedNFTs", JSON.stringify(updatedListedNFTs));

      // 广播购买事件
      broadcastChannel.postMessage({
        type: "NFT_PURCHASED",
        nft: purchasedNFT,
        action: "TRANSFER_NFT",
        from: owner,
        to: connectedAddress,
      });

      notification.success({ 
        message: "购买成功",
        description: "NFT已添加到您的NFT列表中"
      });

      // 触发 MyHoldings 组件更新
      window.dispatchEvent(new Event('MY_NFTS_UPDATED'));
    } catch (error) {
      console.error("购买失败:", error);
      notification.error({
        message: "购买失败",
        description: "请确保NFT存在且您有足够的ETH",
      });
    }
  };

  useEffect(() => {
    const storedAllNFTs = localStorage.getItem("allNFTs");
    const storedListedNFTs = localStorage.getItem("listedNFTs");
    if (storedAllNFTs) {
      const nfts = JSON.parse(storedAllNFTs);
      setAllNFTs(nfts);
      setFilteredNFTs(nfts);
    }
    if (storedListedNFTs) {
      const listed = JSON.parse(storedListedNFTs);
      setListedNFTs(listed);
    }
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === "") {
      setFilteredNFTs(allNFTs);
    } else {
      const filtered = allNFTs.filter(nft =>
        nft.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredNFTs(filtered);
      setCurrentPage(1);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions(prev => ({
      ...prev,
      category: e.target.value,
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterOptions(prev => ({
      ...prev,
      sortBy: e.target.value,
    }));
  };

  const filterAndSortNFTs = (nfts: Collectible[]) => {
    let filtered = [...nfts];

    if (filterOptions.category !== "all") {
      filtered = filtered.filter(nft =>
        nft.attributes?.some(attr => attr.value.toLowerCase() === filterOptions.category.toLowerCase())
      );
    }

    switch (filterOptions.sortBy) {
      case "price_asc":
        filtered.sort((a, b) => {
          const priceA = Number(getPriceById(a.id)) || 0;
          const priceB = Number(getPriceById(b.id)) || 0;
          return priceA - priceB;
        });
        break;
      case "price_desc":
        filtered.sort((a, b) => {
          const priceA = Number(getPriceById(a.id)) || 0;
          const priceB = Number(getPriceById(b.id)) || 0;
          return priceB - priceA;
        });
        break;
      case "newest":
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "oldest":
        filtered.sort((a, b) => a.id - b.id);
        break;
    }

    return filtered;
  };

  useEffect(() => {
    let filtered = allNFTs.filter(nft => nft.name.toLowerCase().includes(searchText.toLowerCase()));
    filtered = filterAndSortNFTs(filtered);
    setFilteredNFTs(filtered);
    setCurrentPage(1);
  }, [searchText, allNFTs, filterOptions]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPriceById = (id: number) => {
    const listedNft = listedNFTs.find(nft => nft.id === id);
    return listedNft ? listedNft.price : "N/A";
  };

  const paginatedNFTs = filteredNFTs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* 外层包裹 dark 背景和白色文字 */}
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex items-center flex-col pt-10">
          <div className="px-5">
            <h1 className="text-center mb-8">
              <span className="block text-4xl font-bold text-cyan-400">NFT市场</span>
            </h1>
            <div className="flex justify-center mb-8">
              <Input.Search
                placeholder="输入NFT名称"
                value={searchText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                onSearch={handleSearch}
                enterButton
                style={{
                  width: 400,
                  borderRadius: "8px",
                  padding: "10px",
                  borderColor: "#00FFFF",
                  backgroundColor: "#1F2937",
                  fontSize: "16px",
                  color: "#fff",
                }}
              />
            </div>
          </div>
          <div className="flex gap-4 mb-8">
            <select
              value={filterOptions.category}
              onChange={handleCategoryChange}
              className="select select-bordered"
              style={{
                width: "120px",
                borderRadius: "8px",
                padding: "10px",
                borderColor: "#00FFFF",
                backgroundColor: "#1F2937",
                color: "#fff",
              }}
            >
              <option value="all">全部类别</option>
              <option value="art">艺术</option>
              <option value="music">音乐</option>
              <option value="sport">运动</option>
            </select>

            <select
              value={filterOptions.sortBy}
              onChange={handleSortChange}
              className="select select-bordered"
              style={{
                width: "120px",
                borderRadius: "8px",
                padding: "10px",
                borderColor: "#00FFFF",
                backgroundColor: "#1F2937",
                color: "#fff",
              }}
            >
              <option value="newest">最新</option>
              <option value="oldest">最早</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center">
            {paginatedNFTs.length === 0 ? (
              <div className="text-2xl text-white">暂无在售NFT</div>
            ) : (
              paginatedNFTs.map(nft => (
                <div
                  key={nft.id}
                  className="card card-compact bg-gray-800 shadow-2xl sm:min-w-[300px] m-4 border border-gray-700"
                >
                  <figure className="relative">
                    <img src={nft.image} alt="NFT Image" className="h-60 w-full object-cover"/>
                    <figcaption className="absolute bottom-4 left-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-90">
                      <span className="text-white"># {nft.id}</span>
                    </figcaption>
                  </figure>
                  <div className="card-body space-y-3 text-white">
                    <div className="flex items-center justify-center">
                      <p className="text-xl p-0 m-0 font-semibold">NFT名称：{nft.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {nft.attributes?.map((attr, index) => (
                        <span
                          key={index}
                          className="py-1 px-2 rounded"
                          style={{
                            background: "linear-gradient(90deg, #00FFFF, #8A2BE2)",
                            color: "#fff",
                            fontSize: "14px",
                          }}
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col justify-center mt-1">
                      <p className="my-0 text-lg">描述：{nft.description}</p>
                    </div>
                    <div className="flex space-x-3 mt-1 items-center">
                      <span className="text-lg font-semibold">发布者 : </span>
                      <Address address={nft.owner} />
                    </div>
                    {nft.CID && (
                      <div className="flex space-x-3 mt-1 items-center">
                        <span className="text-lg font-semibold">CID : </span>
                        <span>{nft.CID}</span>
                      </div>
                    )}
                    <div className="flex space-x-3 mt-1 items-center">
                      <span className="text-lg font-semibold">
                        价格：{getPriceById(nft.id)} ETH
                      </span>
                    </div>
                    <div className="card-actions justify-end">
                      <Button
                        type="primary"
                        onClick={() => handlePurchase(nft.id, getPriceById(nft.id), nft.owner)}
                        disabled={!connectedAddress || nft.owner === connectedAddress}
                        style={{
                          margin: "0px auto",
                          background: "linear-gradient(90deg, #00FFFF, #8A2BE2)",
                          border: "none",
                          boxShadow: "0 4px 15px rgba(0,255,255,0.5)",
                          color: "#fff",
                        }}
                      >
                        {nft.owner === connectedAddress ? "您拥有此NFT" : "购买"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Pagination
            current={currentPage}
            pageSize={itemsPerPage}
            total={filteredNFTs.length}
            onChange={handlePageChange}
            style={{
              marginTop: "2rem",
              textAlign: "center",
              color: "#fff",
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AllNFTs;
