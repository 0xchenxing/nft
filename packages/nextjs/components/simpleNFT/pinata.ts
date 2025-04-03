// your-pinata-utils.ts

export async function uploadToPinata(file: File): Promise<any> {
  const pinataApiKey = "cf05b4b4ce5c56e00b41";
  const pinataSecretApiKey = "703a96f92f3749d0dad5268f3228b336e44538747178143b0a2c76bb0682b9f0";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("上传到 Pinata 出错");
  }

  const data = await response.json();
  return data;
}
