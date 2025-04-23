// Types for NFT data
export interface NFTMetadata {
  id: string
  name: string
  image: string
  description?: string
  attributes?: Array<{
    value: string | number
  }>
}

export interface NFTData {
  energy: number
  level: number
  form: number
  quality: number
  owner: string
  count: number
  lastMutated: number
  mutationProbability: number
  evolutionDeadline: number
}

export const getMyNFTs = (address: string): NFTMetadata[] => {
  try {
    // 并行获取两个键的数据（localStorage 是同步操作）
    const createdNFTs = JSON.parse(localStorage.getItem("createdNFTs") || "[]");
    const myNFTs = JSON.parse(localStorage.getItem("myNFTs") || "[]");
    
    // 合并并过滤
    const allNFTs = [...createdNFTs, ...myNFTs];
    const filtered = allNFTs.filter(nft => {
      if (nft.owner) return nft.owner.toLowerCase() === address.toLowerCase()
    })
    return filtered;
  } catch (error) {
    console.error("Error reading createdNFTs from localStorage:", error)
    return []
  }
}


// Get NFT data (evolution data)
export const getNFTData = (id: string): NFTData | undefined => {
  try {
    const key = `nftData_${id}`
    const data = localStorage.getItem(key)

    if (data) {
      return JSON.parse(data)
    }

    // If no data exists, create default data
    const defaultData: NFTData = {
      energy: 0,
      level: 1,
      form: 0,
      quality: 0,
      owner: "",
      count: 0,
      lastMutated: 0,
      mutationProbability: 60,
      evolutionDeadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days from now
    }

    localStorage.setItem(key, JSON.stringify(defaultData))
    return defaultData
  } catch (error) {
    console.error(`Error reading NFT data for ID ${id}:`, error)
    return undefined
  }
}

// Save NFT data
export const saveNFTData = (id: string, data: NFTData): void => {
  try {
    const key = `nftData_${id}`
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving NFT data for ID ${id}:`, error)
  }
}

// Bind NFT to user
export const bindNFT = (id: string, userAddress: string): void => {
  try {
    const data = getNFTData(id)
    if (data) {
      data.owner = userAddress
      saveNFTData(id, data)
    }
  } catch (error) {
    console.error(`Error binding NFT ${id} to user ${userAddress}:`, error)
  }
}

// Evolve NFT
export const evolveNFT = (id: string): boolean => {
  try {
    const data = getNFTData(id)
    if (!data) return false

    const requiredEnergy = data.level * 10 + 100

    if (data.energy < requiredEnergy || data.level >= 60) {
      return false
    }

    // Update level and form based on level thresholds
    data.energy -= requiredEnergy
    data.level += 1

    // Update form based on level
    if (data.level >= 50) {
      data.form = 3 // Legendary
    } else if (data.level >= 30) {
      data.form = 2 // Sublimation
    } else if (data.level >= 10) {
      data.form = 1 // Awakening
    }

    saveNFTData(id, data)
    return true
  } catch (error) {
    console.error(`Error evolving NFT ${id}:`, error)
    return false
  }
}

// Mutate NFT
export const mutateNFT = (id: string): { success: boolean; newQuality?: number } => {
  try {
    const data = getNFTData(id)
    if (!data) return { success: false }

    const now = Math.floor(Date.now() / 1000)
    if (now - data.lastMutated < 30) {
      return { success: false } // Cooldown period
    }

    data.lastMutated = now

    // Check if mutation is successful based on probability
    const roll = Math.random() * 100
    const success = roll <= data.mutationProbability

    if (success && data.quality < 4) {
      data.quality += 1
      data.mutationProbability = Math.max(10, data.mutationProbability - 10) // Decrease probability for next time
    }

    saveNFTData(id, data)
    return { success, newQuality: success ? data.quality : undefined }
  } catch (error) {
    console.error(`Error mutating NFT ${id}:`, error)
    return { success: false }
  }
}

// Complete task
export const completeTask = (id: string, taskType: number): boolean => {
  try {
    const data = getNFTData(id)
    if (!data) return false

    // Energy rewards based on task type
    const energyRewards = [50, 100, 30]
    const reward = energyRewards[taskType] || 20

    data.energy += reward
    saveNFTData(id, data)
    return true
  } catch (error) {
    console.error(`Error completing task for NFT ${id}:`, error)
    return false
  }
}
