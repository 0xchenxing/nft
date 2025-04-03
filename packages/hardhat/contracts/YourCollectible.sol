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

    uint256 public newTokenId;//盲盒新开出的tokenId

    // 交易历史结构体
    struct TransactionHistory {
        address seller; // 卖家地址
        address buyer; // 买家地址
        uint256 price; // 交易价格
        uint256 timestamp; // 交易时间戳
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

    // 存入盲盒事件
    event NFTDeposited(address depositor, uint256 tokenId);
    // 盲盒购买事件
    event MysteryBoxPurchased(address buyer, uint256 tokenId);

    // 构造函数初始化NFT名称和符号
    constructor() ERC721("YourCollectible", "ETH") {}

    /**
     * @dev 基础URI实现（返回空字符串表示使用完全自定义URI）
     */
    function _baseURI() internal pure override returns (string memory) {
        return "";
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

        newTokenId = tokenId;

        // 触发购买事件
        emit MysteryBoxPurchased(msg.sender, tokenId);
    }

    // 获取盲盒信息
    function getMysteryBox() public view returns (MysteryBox memory) {
        return mysteryBox;
    }
}