"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import type { NextPage } from "next";
import { notification } from "~~/utils/scaffold-eth";
import { uploadToPinata } from "~~/components/simpleNFT/pinata";
import { getMetadataFromIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

const LazyReactJson = lazy(() => import("react-json-view"));

interface ImageData {
  id: number;
  name: string;
  onChainAddress: string;
}

const IpfsUpload: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageData, setImageData] = useState<ImageData[]>([]);

  useEffect(() => {
    // 页面加载时从 Local Storage 读取之前上传的图片数据
    const data: ImageData[] = [];
    let id = 1;
    let storedData = localStorage.getItem(`image_${id}`);
    while (storedData) {
      data.push(JSON.parse(storedData));
      id++;
      storedData = localStorage.getItem(`image_${id}`);
    }
    setImageData(data);
  }, []);

  const handleIpfsUpload = async () => {
    if (!image) {
      notification.error("请选择要上传的图片");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const imageUploadedItem = await uploadToPinata(image);
      notification.remove(notificationId);
      notification.success("已上传到IPFS");

      setUploadedIpfsPath(imageUploadedItem.IpfsHash);

      // 保存上传记录到 Local Storage
      const newImageData: ImageData = {
        id: imageData.length + 1,
        name: image.name,
        onChainAddress: imageUploadedItem.IpfsHash,
      };
      const updatedImageData = [...imageData, newImageData];
      setImageData(updatedImageData);
      localStorage.setItem(`image_${newImageData.id}`, JSON.stringify(newImageData));
    } catch (error) {
      notification.remove(notificationId);
      notification.error("上传IPFS出错");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 w-full text-white">
      <h1 className="text-center mb-4">
        <span className="block text-4xl font-bold">版权上传</span>
      </h1>
      <div className="mb-4 w-full max-w-md">
        <input
          type="file"
          onChange={handleImageChange}
          className="border p-2 w-full bg-gray-800 text-white"
          accept="image/*"
          required
        />
      </div>
      <button
        className={`btn btn-secondary mt-4 ${loading ? "loading" : ""}`}
        disabled={loading}
        onClick={handleIpfsUpload}
      >
        {loading ? "上传中..." : "上传到IPFS"}
      </button>

      {uploadedIpfsPath && (
        <p className="mt-4">
          上传成功的 IPFS 路径：{uploadedIpfsPath}
        </p>
      )}

      <table className="border-collapse border border-gray-600 w-full mt-10 max-w-3xl">
        <thead>
          <tr className="bg-gray-800">
            <th className="border border-gray-600 p-2">ID</th>
            <th className="border border-gray-600 p-2">Name</th>
            <th className="border border-gray-600 p-2">On-Chain Address</th>
          </tr>
        </thead>
        <tbody>
          {imageData.map((row) => (
            <tr key={row.id}>
              <td className="border border-gray-600 p-2">{row.id}</td>
              <td className="border border-gray-600 p-2">{row.name}</td>
              <td className="border border-gray-600 p-2">
                <a
                  href={`https://ipfs.io/ipfs/${row.onChainAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400"
                >
                  {`https://ipfs.io/ipfs/${row.onChainAddress}`}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const IpfsDownload: React.FC = () => {
  const [yourJSON, setYourJSON] = useState<any>({});
  const [ipfsPath, setIpfsPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleIpfsDownload = async () => {
    setLoading(true);
    const notificationId = notification.loading("获取版权文件中...");
    try {
      const metaData = await getMetadataFromIPFS(ipfsPath);
      notification.remove(notificationId);
      notification.success("版权文件下载完成");
      setYourJSON(metaData);
    } catch (error) {
      notification.remove(notificationId);
      notification.error("版权文件下载错误");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center pt-10 w-full text-white">
      <h1 className="text-center mb-4">
        <span className="block text-4xl font-bold">下载版权文件</span>
      </h1>
      <div className="flex border-2 border-accent/95 bg-gray-800 rounded-full text-accent w-96 mb-4">
        <input
          className="input input-ghost focus:outline-none focus:bg-transparent focus:text-secondary-content h-[2.2rem] min-h-[2.2rem] px-4 border w-full font-medium placeholder:text-accent/50 text-white"
          placeholder="请输入 CID"
          value={ipfsPath}
          onChange={(e) => setIpfsPath(e.target.value)}
          autoComplete="off"
        />
      </div>
      <button
        className={`btn btn-secondary my-6 ${loading ? "loading" : ""}`}
        disabled={loading}
        onClick={handleIpfsDownload}
      >
        下载版权文件
      </button>

      {mounted && (
        <Suspense fallback={<div>加载中...</div>}>
          <LazyReactJson
            style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "#1f2937" }}
            src={yourJSON}
            theme="solarized"
            enableClipboard={false}
            onEdit={(edit) => setYourJSON(edit.updated_src)}
            onAdd={(add) => setYourJSON(add.updated_src)}
            onDelete={(del) => setYourJSON(del.updated_src)}
          />
        </Suspense>
      )}
    </div>
  );
};

const IpfsPage: NextPage = () => {
  // 使用标签切换不同功能，这里设定初始展示上传功能
  const [activeTab, setActiveTab] = useState<"upload" | "download">("upload");

  return (
    <div className="min-h-screen bg-gray-900 py-10">
      <div className="flex justify-center mb-8 space-x-4">
        <button
          className={`px-4 py-2 font-bold rounded ${
            activeTab === "upload"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-white"
          }`}
          onClick={() => setActiveTab("upload")}
        >
          上传版权文件
        </button>
        <button
          className={`px-4 py-2 font-bold rounded ${
            activeTab === "download"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-white"
          }`}
          onClick={() => setActiveTab("download")}
        >
          下载版权文件
        </button>
      </div>
      {activeTab === "upload" ? <IpfsUpload /> : <IpfsDownload />}
    </div>
  );
};

export default IpfsPage;
