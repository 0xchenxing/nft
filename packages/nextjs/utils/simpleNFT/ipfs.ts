import { create } from "kubo-rpc-client";

const JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJiODY0YTdlMC00NDJlLTRhYjAtODhhYy1kYjBlMTQyNzBmMzIiLCJlbWFpbCI6IjAwMWNoZW54aW5nQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjZjA1YjRiNGNlNWM1NmUwMGI0MSIsInNjb3BlZEtleVNlY3JldCI6IjcwM2E5NmY5MmYzNzQ5ZDBkYWQ1MjY4ZjMyMjhiMzM2ZTQ0NTM4NzQ3MTc4MTQzYjBhMmM3NmJiMDY4MmI5ZjAiLCJleHAiOjE3NjYyOTUyMTB9.OTZ_U-m6XA7--FHjcn0BFyGSisybz5RtU9iBgmUvqZw`;

export const ipfsClient = create({
  host: "api.pinata.cloud",
  port: 443,
  protocol: "https",
  headers: {
    accept: `application/json`,
    Authorization: `Bearer ${JWT}`,
  },
});

export async function getNFTMetadataFromIPFS(ipfsHash: string) {
  for await (const file of ipfsClient.get(ipfsHash)) {
    // The file is of type unit8array so we need to convert it to string
    const content = new TextDecoder().decode(file);
    // Remove any leading/trailing whitespace
    const trimmedContent = content.trim();
    // Find the start and end index of the JSON object
    const startIndex = trimmedContent.indexOf("{");
    const endIndex = trimmedContent.lastIndexOf("}") + 1;
    // Extract the JSON object string
    const jsonObjectString = trimmedContent.slice(startIndex, endIndex);
    try {
      const jsonObject = JSON.parse(jsonObjectString);
      return jsonObject;
    } catch (error) {
      console.log("Error parsing JSON:", error);
      return undefined;
    }
  }
}
