"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { notification } from "antd";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export interface NftInfo {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  price: string;
  description: string;
  CID?: string;
}

interface Comment {
  id: number;
  content: string;
  author: string;
}

interface Post {
  id: number;
  content: string;
  author: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  tips: number;
  nft: NftInfo;
}

// 辅助方法：通过 NFT 数据获得图片 URL。当 NFT 上传到了 IPFS 时，使用 IPFS 网关地址
const getNFTImage = (nft: NftInfo) => {
  return nft.CID && nft.CID.trim() !== ""
    ? `https://ipfs.io/ipfs/${nft.CID}`
    : nft.image;
};

const CommunityPage = () => {
  const { address, isConnected } = useAccount();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedNFT, setSelectedNFT] = useState<NftInfo | null>(null);
  const [newPostContent, setNewPostContent] = useState<string>("");
  const [myNFTs, setMyNFTs] = useState<NftInfo[]>([]);

  // 加载社区帖子及当前用户的 NFT 数据（从 localStorage 中读取）
  useEffect(() => {
    const storedPosts = localStorage.getItem("posts");
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts));
      } catch (error) {
        console.error("Failed to parse posts:", error);
      }
    }

    if (address) {
      const storedNFTs = localStorage.getItem("myNFTs");
      if (storedNFTs) {
        try {
          setMyNFTs(JSON.parse(storedNFTs));
        } catch (error) {
          console.error("Failed to parse NFTs:", error);
        }
      }
    }
  }, [address]);

  // 帖子数据更新时持久化到 localStorage
  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  const handlePostSubmit = () => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" });
      return;
    }
    if (!selectedNFT) {
      notification.error({ message: "请选择一个 NFT" });
      return;
    }
    if (!newPostContent.trim()) {
      notification.error({ message: "内容不能为空" });
      return;
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
    };

    setPosts([newPost, ...posts]);
    // 如果 NFT 在这个帖子中使用过，可选择移除掉（类似于一次性使用）
    setMyNFTs(myNFTs.filter(nft => nft.id !== selectedNFT.id));
    setIsModalOpen(false);
    setSelectedNFT(null);
    setNewPostContent("");
    notification.success({ message: "发布成功!" });
  };

  const handleLike = (postId: number) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" });
      return;
    }
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const hasLiked = post.likedBy.includes(address!);
          return {
            ...post,
            likes: hasLiked ? post.likes - 1 : post.likes + 1,
            likedBy: hasLiked
              ? post.likedBy.filter(a => a !== address)
              : [...post.likedBy, address!],
          };
        }
        return post;
      })
    );
  };

  const handleComment = (postId: number, content: string) => {
    if (!content.trim()) {
      notification.error({ message: "评论不能为空" });
      return;
    }
    setPosts(prev =>
      prev.map(post => {
        if (post.id === postId) {
          const newComment = {
            id: Date.now(),
            content,
            author: address || "匿名用户",
          };
          return { ...post, comments: [...post.comments, newComment] };
        }
        return post;
      })
    );
  };

  const handleTip = async (postId: number, amount: string) => {
    if (!isConnected) {
      notification.error({ message: "请先连接钱包" });
      return;
    }
    if (isNaN(Number(amount))) {
      notification.error({ message: "请输入有效金额" });
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(prev =>
        prev.map(post =>
          post.id === postId ? { ...post, tips: post.tips + Number(amount) } : post
        )
      );
      notification.success({ message: `成功打赏 ${amount} ETH!` });
    } catch (error) {
      notification.error({ message: "打赏失败" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-300 drop-shadow-md">
          NFT 创意社区
        </h1>

        {/* 如果钱包未连接，则展示连接按钮 */}
        {!isConnected && (
          <div className="mb-12 flex justify-center">
            <RainbowKitCustomConnectButton />
          </div>
        )}

        {/* 创建新帖按钮 */}
        {isConnected && (
          <div className="flex justify-center mb-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              创作新帖
            </button>
          </div>
        )}

        {/* 新帖创建模态框，NFT 选择部分采用卡片布局，与 NFT 页面一致 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg relative w-full max-w-lg">
              <button
                className="absolute right-3 top-3 text-lg"
                onClick={() => setIsModalOpen(false)}
                style={{ color: "black" }}
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold text-center mb-6">发布新内容</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-700 text-center">
                  选择你的 NFT 作品
                </h3>
                <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                  {myNFTs.length > 0 ? (
                    myNFTs.map(nft => (
                      <div
                        key={nft.id}
                        onClick={() =>
                          setSelectedNFT(prev => (prev?.id === nft.id ? null : nft))
                        }
                        className={`border rounded-lg shadow-md cursor-pointer p-2 transition-all ${
                          selectedNFT?.id === nft.id ? "border-purple-500" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={getNFTImage(nft)}
                          alt={nft.name}
                          className="w-full h-20 object-cover rounded-md"
                        />
                        <h3 className="text-center mt-2 text-sm font-semibold">
                          {nft.name}
                        </h3>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      暂无可用NFT，快去创作吧！
                    </div>
                  )}
                </div>
              </div>
              
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="分享你的创作故事..."
                className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewPostContent("");
                    setSelectedNFT(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePostSubmit}
                  className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 帖子列表 */}
        <div className="space-y-8">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {post.author.slice(0, 6)}...{post.author.slice(-4)}
                      </h3>
                      <p className="text-sm text-gray-500">关联作品：{post.nft.name}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        post.likedBy.includes(address || "")
                          ? "bg-pink-100 text-pink-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      ❤️ {post.likes}
                    </button>
                    
                    <button
                      onClick={() => {
                        const comment = prompt("留下你的评论");
                        comment && handleComment(post.id, comment);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      💬 {post.comments.length}
                    </button>
                    
                    <button
                      onClick={() => {
                        const amount = prompt("输入打赏金额 (ETH)");
                        amount && handleTip(post.id, amount);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-full hover:opacity-90 transition-opacity"
                    >
                      💰 打赏 {post.tips} ETH
                    </button>
                  </div>
                </div>

                {/* NFT 展示卡片——风格参考 MyNFTs 页面 */}
                <div className="border rounded-lg overflow-hidden shadow-md max-w-xs mx-auto">
                  <img
                    src={getNFTImage(post.nft)}
                    alt={post.nft.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-bold">{post.nft.name}</h3>
                    <p className="text-sm text-gray-600">{post.nft.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
