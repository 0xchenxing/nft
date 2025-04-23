"use client"

interface TasksProps {
  onCompleteTask: (taskType: number) => void
  isLoading: boolean
}

interface Task {
  id: number
  name: string
  description: string
  reward: number
}

export const TasksSection = ({ onCompleteTask, isLoading }: TasksProps) => {
  // Define available tasks
  const tasks: Task[] = [
    {
      id: 0,
      name: "Mint NFT",
      description: "Mint a new NFT to earn energy",
      reward: 50,
    },
    {
      id: 1,
      name: "Trade NFT",
      description: "Buy or sell an NFT to earn energy",
      reward: 100,
    },
    {
      id: 2,
      name: "Community Interaction",
      description: "Interact with the community to earn energy",
      reward: 30,
    },
  ]

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
      <h2 className="text-2xl font-bold mb-4 text-purple-300">Tasks</h2>
      <p className="mb-4 text-gray-300">Complete tasks to earn energy for evolution.</p>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-black/40 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/50 transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">{task.name}</h3>
              <span className="text-green-400 text-sm">+{task.reward} Energy</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{task.description}</p>
            <button
              onClick={() => onCompleteTask(task.id)}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-purple-800 hover:bg-purple-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Complete Task"}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
