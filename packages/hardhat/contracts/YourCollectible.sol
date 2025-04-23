// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

// 导入OpenZeppelin合约库
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title 可收集数字资产合约
 * @dev 继承ERC721标准及扩展功能，支持元数据存储、枚举和版税功能
 */
contract YourCollectible is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable
{
    using Counters for Counters.Counter;

    // Token ID计数器
    Counters.Counter public tokenIdCounter;

    // Token定价映射（当前未在purchase中使用）
    mapping(uint256 => uint256) public tokenPrices;

    // 创作者地址映射
    mapping(uint256 => address) private _creators;

    // 版税百分比（默认5%）
    uint256 public royaltyPercentage = 5;

    // 交易历史记录映射
    mapping(uint256 => TransactionHistory[]) public tokenTransactionHistory;

    // 交易历史结构体
    struct TransactionHistory {
        address seller; // 卖家地址
        address buyer; // 买家地址
        uint256 price; // 交易价格
        uint256 timestamp; // 交易时间戳
    }

    // 版税支付事件
    event RoyaltyPaid(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount
    );

    // NFT出售事件
    event NFTSold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );

    // 构造函数初始化NFT名称和符号
    constructor() ERC721("YourCollectible", "ETH") {}

    /**
     * @dev 基础URI实现（返回空字符串表示使用完全自定义URI）
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    // 以下为必须的覆盖函数（继承多个父合约需要明确调用顺序）

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage, ERC721)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 提取合约中的ETH
    function withdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }

    //转账
    function sendETH(address payable recipient) external payable {
        require(msg.value > 0, "The amount of ETH sent must be greater than 0");
        require(recipient != address(0), "The recipient address cannot be the zero address");

        recipient.transfer(msg.value);
    }





    /**
     * @dev 铸造新NFT
     * @param to NFT接收地址
     * @param uri 元数据URI
     * @return 新铸造的tokenId
     * 注意：任何用户都可以铸造，创作者地址记录为调用者
     */
    function mintItem(address to, string memory uri) public returns (uint256) {
        tokenIdCounter.increment();
        uint256 tokenId = tokenIdCounter.current();//从1开始
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _creators[tokenId] = msg.sender; // 记录NFT创作者
        return tokenId;
    }

    /**
     * @dev 购买NFT函数
     * @param tokenId 要购买的NFT ID
     * @param from 卖家地址
     * @param price 预期价格（需与msg.value匹配）
     * 流程：验证 -> 支付版税 -> 支付卖家 -> 转移所有权 -> 记录交易
     */
    function purchase(
        uint256 tokenId,
        address from,
        uint256 price
    ) public payable {
        // require(_exists(tokenId), "Token does not exist");
        require(from == ownerOf(tokenId), "From address is not the owner");
        require(msg.value == price, "Incorrect price");

        address creator = _creators[tokenId];
        require(creator != address(0), "Creator not found");

        // 计算版税和卖家所得
        uint256 royaltyAmount = (msg.value * royaltyPercentage) / 100;
        uint256 sellerAmount = msg.value - royaltyAmount;

        // 支付版税给创作者
        (bool royaltySuccess, ) = payable(creator).call{value: royaltyAmount}(
            ""
        );
        require(royaltySuccess, "Royalty payment failed");
        emit RoyaltyPaid(tokenId, creator, royaltyAmount);

        // 支付剩余金额给卖家
        (bool sellerSuccess, ) = payable(from).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");

        // 转移NFT所有权
        _transfer(from, msg.sender, tokenId);

        // 记录交易历史
        tokenTransactionHistory[tokenId].push(
            TransactionHistory({
                seller: from,
                buyer: msg.sender,
                price: price,
                timestamp: block.timestamp
            })
        );

        emit NFTSold(tokenId, from, msg.sender, price);
    }

    /**
     * @dev 查询NFT创作者
     * @param tokenId 要查询的NFT ID
     */
    function getCreator(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _creators[tokenId];
    }

    /**
     * @dev 获取NFT交易历史
     * @param tokenId 要查询的NFT ID
     * @return 交易历史数组
     */
    function getTokenTransactionHistory(uint256 tokenId)
        public
        view
        returns (TransactionHistory[] memory)
    {
        return tokenTransactionHistory[tokenId];
    }

    







    // 定义一个结构体MysteryBox，用于存储盲盒的相关信息
    struct MysteryBox {
        string name; // 盲盒名称
        string description; // 盲盒描述
        uint256 price; // 盲盒价格
        uint256[] tokenIds; // 盲盒中包含的NFT ID列表
        uint256 totalSupply; // 盲盒总供应量
        uint256 remainingSupply; // 盲盒剩余供应量
    }
    // 盲盒实例
    MysteryBox public mysteryBox = MysteryBox({
        name: "Mystery Box",
        description: "A mystery box",
        price: 1000000000000000000, // 1 ether，直接使用wei单位
        tokenIds: new uint256[](0), // 初始为空
        totalSupply: 0,
        remainingSupply: 0
    });

    // 存入盲盒事件
    event NFTDeposited(address depositor, uint256 tokenId);
    // 盲盒购买事件
    event MysteryBoxPurchased(address buyer, uint256 tokenId);

    // 存入NFT到盲盒
    function depositToMysteryBox(uint256 tokenId) public {
        // 检查NFT是否存在
        // require(_exists(tokenId), "Token does not exist");
        // 检查NFT是否属于调用者
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");

        // 将NFT转移到盲盒
        _transfer(msg.sender, address(this), tokenId);
        // 将NFT ID添加到盲盒的NFT列表中
        mysteryBox.tokenIds.push(tokenId);
        // 增加盲盒的总供应量和剩余供应量
        mysteryBox.totalSupply++;
        mysteryBox.remainingSupply++;

        // 触发存入事件
        emit NFTDeposited(msg.sender, tokenId);
    }

    // 购买盲盒
    function purchaseMysteryBox() public payable {
        // 检查盲盒是否存在
        require(mysteryBox.totalSupply > 0, "Box does not exist");
        // 检查盲盒是否已售罄
        require(mysteryBox.remainingSupply > 0, "Box sold out");

        // 生成一个随机索引，用于从盲盒的NFT列表中选择一个NFT
         // 1. 生成随机种子（需优化随机性，见方案3）
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp,msg.sender)));
        // 2. 筛选可用ID
        uint256 remaining = mysteryBox.tokenIds.length;
        require(remaining > 0, "No NFTs left");
        uint256 randomIndex = seed % remaining;
         // 3. 交换并删除
        uint256 tokenId = mysteryBox.tokenIds[randomIndex];
        mysteryBox.tokenIds[randomIndex] = mysteryBox.tokenIds[remaining - 1];
        mysteryBox.tokenIds.pop();

        // 将NFT从盲盒池中转移到购买者
        _transfer(address(this), msg.sender, tokenId);

        // 减少盲盒的剩余供应量
        mysteryBox.remainingSupply--;

        // 触发购买事件
        emit MysteryBoxPurchased(msg.sender, tokenId);
    }

    // 获取盲盒信息
    function getMysteryBox() public view returns (MysteryBox memory) {
        return mysteryBox;
    }







    // 定义拍卖结构体
    struct Auction {
        uint256 tokenId;        // 被拍卖的NFT ID
        address seller;         // 拍卖发起人
        uint256 minBid;         // 最低出价
        uint256 endTime;        // 拍卖结束时间
        address highestBidder;  // 当前最高出价者
        uint256 highestBid;     // 当前最高出价
        bool active;            // 拍卖是否激活
    }

    // 拍卖映射：Token ID -> 拍卖详情
    mapping(uint256 => Auction) public auctions;

    // 拍卖出价事件
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 bidAmount);

    // 拍卖结束事件
    event AuctionEnded(uint256 indexed tokenId, address winner, uint256 finalBid);

    /**
    * @dev 创建拍卖
    * @param tokenId 拍卖的NFT ID
    * @param minBid 最低出价
    * @param duration 拍卖持续时间（以秒为单位）
    */
    function createAuction(uint256 tokenId, uint256 minBid, uint256 duration) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(duration > 0, "Duration must be greater than 0");

        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            minBid: minBid,
            endTime: block.timestamp + duration,
            highestBidder: address(0),
            highestBid: 0,
            active: true
        });

        // 将NFT转移到合约保管
        _transfer(msg.sender, address(this), tokenId);
    }

    /**
    * @dev 出价功能
    * @param tokenId 拍卖的NFT ID
    */
    function placeBid(uint256 tokenId) public payable {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, string(abi.encodePacked("Auction ended", Strings.toString(block.timestamp))));
        require(msg.value > auction.highestBid && msg.value >= auction.minBid, "Bid not high enough");

        // 如果已经有最高出价，退还给之前的出价者
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    /**
    * @dev 结束拍卖
    * @param tokenId 拍卖的NFT ID
    */
    function endAuction(uint256 tokenId) public {
        Auction storage auction = auctions[tokenId];
        require(auction.active, "Auction not active");
        require(block.timestamp >= auction.endTime, string(abi.encodePacked("Auction not yet ended. Debug info: block.timestamp = ", Strings.toString(block.timestamp))));
        require(msg.sender == auction.seller, "Only seller can end auction");

        auction.active = false;

        if (auction.highestBidder != address(0)) {
            // 转移NFT给最高出价者
            _transfer(address(this), auction.highestBidder, tokenId);

            // 支付卖家
            payable(auction.seller).transfer(auction.highestBid);

            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            // 如果无人出价，将NFT还给卖家
            _transfer(address(this), auction.seller, tokenId);
        }
    }






    /*
    进化共生协议说明： 一对多 一个用户对多个NFT 类似宠物系统
    1. 每个 NFT 都拥有能量、等级、形态、品质等属性，用户可通过完成任务获得能量，再用能量推动 NFT 进化；
    2. NFT 的进化由等级和形态构成，等级从 1 至 60，达到一定等级后可进化形态（如：创生之初、觉醒异变、昇华进化、传世神韵）；
    3. 除了进化外还包含变异，用户支付固定 ETH 费用触发变异，通过随机机制有一定概率提高 NFT 的品质（同时也可能下降），品质直接影响 NFT 的色泽及价值；
    4. 每个 NFT 只能绑定给一个用户，在绑定后，用户对该 NFT 进行进化和变异操作。
    */
    /// @notice 存储 NFT 的进化和变异相关数据的结构体
    struct NFTData {
        uint256 energy;               // NFT 当前的能量，用于进化升级 
        uint256 level;                // NFT 当前等级，总共 60 级
        uint256 form;                 // NFT 形态，对应进化阶段（枚举值）
        uint256 quality;              // NFT 品质，变异过程中随机变化决定 NFT 的稀有度及价值
        address owner;                // NFT 与绑定用户（仅允许一个用户绑定）
        uint256 count;                // 当前状态的变异次数
        uint256 lastMutated;          // 最近一次变异的时间戳，用于冷却时间逻辑
        uint256 mutationProbability;  // 变异成功提升品质的概率，变异成功时品质提升，否则下降
        uint256 evolutionDeadline;    // NFT 允许进化和变异的截止时间：只有在当前时间小于这个时间戳时才允许进化和变异  
    }

    /// @notice 定义 NFT 的形态阶段，分别代表不同的进化状态
    /// - Genesis（创生之初）：初始，仅显示正面
    /// - Awakening（觉醒异变）：进化到 10-29 级，背面可显示照片信息
    /// - Sublimation（昇华进化）：进化到 30-59 级，背面展示二维基因动态
    /// - Legendary（传世神韵）：进化到 60 级，展现完全3D效果
    enum Forms { Genesis, Awakening, Sublimation, Legendary }
    
    /// @notice 定义 NFT 的品质分级，对应品质由低到高
    /// - White（白色）、Blue（蓝色）、Purple（紫色）、Gold（金色）、Red（红色）
    enum Quality { White, Blue, Purple, Gold, Red }
    
    // 内部映射：tokenId 对应 NFTData 数据
    mapping(uint256 => NFTData) public _nftData;
    // // 映射：每个用户（地址），存储该用户绑定的 tokenId 每个用户可以绑定多个NFT
    // mapping(address => uint256) public userNFT;

    // 合约常量定义
    uint256 public constant MAX_LEVEL = 60;                  // NFT 最大进化等级
    uint256 public constant MUTATION_COOLDOWN = 30 seconds;      // 变异冷却时间（每天一次）
    uint256 public constant BASE_MUTATION_COST = 1 ether;    // 变异基础费用
    uint256 public constant DURATION_COOLDOWN = 10 minutes;      // 协议总时间

    // 事件定义：当 NFT 进化时触发，包含 tokenId、更新后的等级以及形态
    event Evolved(uint256 indexed tokenId, uint256 newLevel, Forms newForm);
    // 事件定义：当 NFT 变异时触发，包含 tokenId 以及变异后 NFT 的品质
    event Mutated(uint256 indexed tokenId, Quality newQuality);

    /**
     * @notice 绑定 NFT 到用户账户，每个NFT只能绑定一个用户
     * @dev 用户必须为 NFT 的所有者，每个用户可以绑定多个NFT
     */
    function bindNFT(uint256 tokenId) external {
        // 检查调用者是否为 NFT 的当前持有者
        require(ownerOf(tokenId) == msg.sender, "Not NFT owner");
        // 检查调用者目前是否已经绑定NFT
        // require(userNFT[msg.sender] == 0 || block.timestamp > _nftData[userNFT[msg.sender]].evolutionDeadline , "Not NFT owner");
        // 检查NFT是否被绑定过
        require(_nftData[tokenId].owner == address(0), "Not NFT owner");
        // 记录绑定关系：更新 NFTData 中的 owner 字段
        _nftData[tokenId].level = 1;
        _nftData[tokenId].owner = msg.sender;
        _nftData[tokenId].mutationProbability = 60;// 默认60%概率变异成功
        _nftData[tokenId].evolutionDeadline = block.timestamp + DURATION_COOLDOWN;
        // // 将该 tokenId 记录到用户绑定映射中
        // userNFT[msg.sender] = tokenId;
    }

    /**
     * @notice 进化函数：使用能量升级 NFT 等级并改变其形态
     * @dev 进化消耗能量，等级上升后按条件更新形态，并分发进化奖励（奖励分发逻辑需进一步实现）
     *      任务系统中积累能量后，用户可以通过进化提升 NFT 的整体价值和展示效果
     */
    function evolve(uint256 tokenId) external {
        NFTData storage data = _nftData[tokenId];
        // 验证调用者是否为 NFT 绑定者
        require(data.owner == msg.sender, "Not owner");
        // 限制 NFT 不能超过最高等级
        require(data.level < MAX_LEVEL, "Max level reached");
        
        // 根据当前等级计算所需能量，能量消耗随等级提高而增多
        uint256 requiredEnergy = _calculateRequiredEnergy(data.level);
        require(data.energy >= requiredEnergy, "Insufficient energy");
        
        // 扣除能量用于进化
        data.energy -= requiredEnergy;
        // 进化成功后达到下一级
        data.level++;
        
        // 根据新的等级更新 NFT 的形态，如达到特定级别后切换到昇华进化或传世神韵
        _updateForm(tokenId);
        // 分发额外的进化奖励（例如稀有道具、额外能量等），具体逻辑后续根据项目需求实现
        _distributeEvolutionRewards(tokenId);
        
        // 发出进化成功事件，便于前端监听 NFT 状态变化
        emit Evolved(tokenId, data.level, Forms(data.form));
    }

    /**
     * @notice 变异函数：用户支付 ETH 以触发 NFT 的变异，变异有概率提升或降低 NFT 品质
     * @dev 变异涉及：
     *      - 支付固定 ETH 费用（1 ETH）
     *      - 冷却时间限制（每天只能变异一次）
     *      - 根据随机数与 mutationProbability 决定品质升降
     *      - 变异成功后，能量增加（类似任务奖励），mutationProbability 随变异次数增加（上限 95）
     */
    function mutate(uint256 tokenId) external payable {
        NFTData storage data = _nftData[tokenId];
        // 检查支付费用是否满足变异基础成本
        require(msg.value >= BASE_MUTATION_COST, "Insufficient ETH");
        // 检查变异是否在冷却期之外
        require(block.timestamp >= data.lastMutated + MUTATION_COOLDOWN, "Cooldown active");

        // 执行随机变异逻辑，决定 NFT 品质的变化
        _randomMutation(tokenId);
        // 更新时间戳，记录本次变异操作
        data.lastMutated = block.timestamp;
        
        // 作为任务奖励，在每次变异后增加固定能量，支持 NFT 进化
        data.energy += 100;
        
        // 每次变异后提高变异成功的概率（最多 95%），鼓励用户长期参与进化活动
        if(data.count > 0){
            data.mutationProbability = data.mutationProbability < 95 
            ? data.mutationProbability + 5 
            : 95;
        }
        
    }

    /**
     * @notice 辅助函数：根据当前等级计算升级所需能量
     * @param currentLevel NFT 的当前等级
     * @return 所需能量，公式：currentLevel * 10 + 100
     */
    function _calculateRequiredEnergy(uint256 currentLevel) private pure returns (uint256) {
        return currentLevel * 10 + 100;
    }

    /**
     * @notice 辅助函数：更新 NFT 的形态，根据进化等级调整外观特效
     * @dev 当 NFT 达到一定等级（例如昇华进化 30-59 级，传世神韵 60 级）时更新 form 属性，
     *      形态信息用于前端决定展示正反面、动态效果、3D效果等
     */
    function _updateForm(uint256 tokenId) private {
        NFTData storage data = _nftData[tokenId];
        if (data.level >= 10 && data.level < 30) {
            data.form = uint256(Forms.Awakening);
        } 
        // 当 NFT 进化等级达到 30 级（对应昇华进化阶段），更新形态为昇华进化
        else if (data.level >= 30 && data.level < 60) {
            data.form = uint256(Forms.Sublimation);
        } 
        // 当 NFT 进化等级达到最高等级 60 级，更新形态为传世神韵（完全 3D 效果）
        else if (data.level >= 60) {
            data.form = uint256(Forms.Legendary);
        }
        // 其他阶段保持默认形态（Genesis），可根据项目需求增加更多逻辑
    }

    /**
     * @notice 辅助函数：执行 NFT 随机变异逻辑，决定品质的提升或下降
     * @dev 通过 keccak256 生成伪随机数（结合当前区块时间和调用者地址），
     *      如果随机数小于 mutationProbability 则视为成功，NFT 品质提升；否则降低品质
     *      NFT 品质范围在最低（白色）和最高（红色）之间变化。
     */
    function _randomMutation(uint256 tokenId) private {
        NFTData storage data = _nftData[tokenId];
        // 生成 0~99 的随机整数
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100;
        
        if (rand < data.mutationProbability) {
            // 若随机数低于当前变异概率，视为变异成功：提升 NFT 品质（上限为 Red）
            if (data.quality < uint256(Quality.Red)) {
                data.quality++;
                data.count = 0;
                data.mutationProbability = 60 - data.quality * 5;
            }
        } else {
            // 若随机数高于变异概率，视为变异失败：不变或降低 NFT 品质（下限为 White）
            if (data.quality > uint256(Quality.White) && rand >= 95) {
                data.quality--;
                data.count++;
            }
        }
        // 触发变异事件，通知前端 NFT 品质的更新变化
        emit Mutated(tokenId, Quality(data.quality));
    }

    /**
     * @notice 用户完成任务获取能量的接口，任务种类涵盖：
     *         铸造NFT、买卖NFT、抽取NFT、拍卖NFT、浏览NFT市场、社区互动等
     *         根据不同任务类型分发不同能量奖励，推动 NFT 的进化
     */
    function completeTask(uint256 tokenId, uint256 taskType) external {
        // // 获取用户绑定的 NFT tokenId，确保该用户已绑定 NFT
        // uint256 tokenId = userNFT[msg.sender];
        require(tokenId != 0, "No NFT bound");
        
        // 根据任务类型（数字标识）增加相应奖励能量
        _nftData[tokenId].energy += _getTaskReward(taskType);
    }

    /**
     * @notice 内部函数：根据任务类型计算能量奖励
     * @param taskType 数字标识任务类型（如 0：铸造；1：交易；其他类型均给予默认奖励）
     * @return 对应任务奖励的能量值
     */
    function _getTaskReward(uint256 taskType) private pure returns (uint256) {
        // 不同任务类型对应不同奖励：铸造任务奖励 50 能量，交易任务奖励 100 能量
        if (taskType == 0) return 50;   // 任务类型 0：铸造NFT
        if (taskType == 1) return 100;  // 任务类型 1：NFT 交易
        // 如果是其他任务类型，则给予默认奖励
        return 30; // 默认任务奖励
    }

    /**
     * @notice 占位函数：分发 NFT 进化奖励
     * @dev 目前仅为占位，未来可根据项目逻辑实现额外奖励分配（例如稀有道具、社区代币等）
     */
    function _distributeEvolutionRewards(uint256 tokenId) private {
        // TODO: 根据整体项目经济设计，在 NFT 进化成功时分发额外奖励
    }
}