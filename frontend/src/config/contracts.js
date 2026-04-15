/**
 * Contract ABIs and addresses
 * After deployment, update the addresses below
 */

export const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export const HASHPAY_ADDRESS = '0x0E450e769dB21D7d33EE8e36495b229EA7574519'; // HashKey Chain Deployment

export const HASHPAY_ABI = [
  // createInvoice
  "function createInvoice(bytes32 invoiceHash, uint256 amount, address token, uint8 invoiceType) external returns (bytes32)",
  // payInvoice
  "function payInvoice(bytes32 invoiceId, bytes32 salt, address merchant) external payable",
  // batchPay
  "function batchPay(bytes32[] calldata invoiceIds, bytes32[] calldata salts, address[] calldata merchants) external payable",
  // cancelInvoice
  "function cancelInvoice(bytes32 invoiceId) external",
  // View functions
  "function getInvoice(bytes32 invoiceId) external view returns (tuple(bytes32 invoiceHash, address token, uint256 amount, address creator, uint8 invoiceType, uint8 status, uint256 createdAt, uint256 settledAt, address payer, uint256 campaignTotal, uint256 paymentCount))",
  "function getInvoiceReceipts(bytes32 invoiceId) external view returns (tuple(bytes32 invoiceId, address payer, address merchant, uint256 amount, address token, uint256 timestamp, bytes32 receiptHash)[])",
  "function getMerchantInvoices(address merchant) external view returns (bytes32[])",
  "function getPayerHistory(address payer) external view returns (bytes32[])",
  "function getRecentInvoices(uint256 count) external view returns (bytes32[])",
  "function getStats() external view returns (uint256, uint256, uint256)",
  "function verifyInvoiceHash(address merchant, uint256 amount, bytes32 salt, address token) external pure returns (bytes32)",
  "function totalInvoices() external view returns (uint256)",
  "function totalSettled() external view returns (uint256)",
  "function totalVolume() external view returns (uint256)",
  // Events
  "event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address token, uint256 amount, uint8 invoiceType, uint256 timestamp)",
  "event InvoicePaid(bytes32 indexed invoiceId, address indexed payer, address indexed merchant, uint256 amount, address token, bytes32 receiptHash, uint256 timestamp)",
  "event InvoiceCancelled(bytes32 indexed invoiceId, uint256 timestamp)",
];

export const HSP_ADDRESS = '0xbc02f24aeBd2b9CAB29eD8DBF27298A103193F34'; // HashKey Chain Deployment

export const HSP_ABI = [
  // createChannel
  "function createChannel(address payee, address token, uint256 duration) external payable returns (bytes32)",
  // fundChannel
  "function fundChannel(bytes32 channelId, uint256 amount) external payable",
  // settleChannel
  "function settleChannel(bytes32 channelId, uint256 amount, uint256 nonce) external",
  // closeChannel
  "function closeChannel(bytes32 channelId) external",
  // disputeChannel
  "function disputeChannel(bytes32 channelId) external",
  // View functions
  "function getChannel(bytes32 channelId) external view returns (tuple(bytes32 channelId, address payer, address payee, address token, uint256 totalDeposit, uint256 settledAmount, uint256 createdAt, uint256 expiresAt, uint256 disputeDeadline, uint8 status, bytes32 lastSettlementHash))",
  "function getChannelSettlements(bytes32 channelId) external view returns (tuple(bytes32 channelId, uint256 amount, uint256 nonce, uint256 timestamp, bytes32 settlementHash)[])",
  "function getUserChannels(address user) external view returns (bytes32[])",
  "function getStats() external view returns (uint256, uint256)",
  "function totalChannels() external view returns (uint256)",
  "function totalSettlementVolume() external view returns (uint256)",
  // Events
  "event ChannelCreated(bytes32 indexed channelId, address indexed payer, address indexed payee, address token, uint256 deposit, uint256 expiresAt, uint256 timestamp)",
  "event SettlementExecuted(bytes32 indexed channelId, uint256 amount, uint256 nonce, bytes32 settlementHash, uint256 timestamp)",
  "event ChannelClosed(bytes32 indexed channelId, uint256 finalSettled, uint256 refunded, uint256 timestamp)",
];

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];
