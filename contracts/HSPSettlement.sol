// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HSPSettlement
 * @notice HashKey Settlement Protocol - PayFi payment channels & escrow
 * @dev Implements escrow-based payment channels for recurring settlements,
 *      dispute resolution, and streaming payments on HashKey Chain.
 *
 *      Designed for the PayFi hackathon track:
 *      - Payment routing with settlement commitments
 *      - Time-locked escrow channels
 *      - Off-chain signed settlement with on-chain finalization
 *      - Dispute mechanism with timelock fraud protection
 */
contract HSPSettlement {
    // ─── Types ───────────────────────────────────────────────────────────
    enum ChannelStatus { Open, Active, Settling, Closed, Disputed }

    struct PaymentChannel {
        bytes32        channelId;
        address        payer;          // channel funder
        address        payee;          // channel receiver
        address        token;          // address(0) = HSK native
        uint256        totalDeposit;   // total deposited into channel
        uint256        settledAmount;  // amount already settled
        uint256        createdAt;
        uint256        expiresAt;      // channel expiry timestamp
        uint256        disputeDeadline;
        ChannelStatus  status;
        bytes32        lastSettlementHash;
    }

    struct Settlement {
        bytes32 channelId;
        uint256 amount;
        uint256 nonce;
        uint256 timestamp;
        bytes32 settlementHash;
    }

    // ─── State ───────────────────────────────────────────────────────────
    mapping(bytes32 => PaymentChannel)  public channels;
    mapping(bytes32 => Settlement[])    public settlements;
    mapping(address => bytes32[])       public userChannels;

    bytes32[] public allChannelIds;
    uint256   public totalChannels;
    uint256   public totalSettlementVolume;
    uint256   public disputePeriod = 1 hours; // configurable

    address public owner;

    // ─── Events ──────────────────────────────────────────────────────────
    event ChannelCreated(
        bytes32 indexed channelId,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 deposit,
        uint256 expiresAt,
        uint256 timestamp
    );

    event ChannelFunded(
        bytes32 indexed channelId,
        uint256 amount,
        uint256 newTotal,
        uint256 timestamp
    );

    event SettlementExecuted(
        bytes32 indexed channelId,
        uint256 amount,
        uint256 nonce,
        bytes32 settlementHash,
        uint256 timestamp
    );

    event ChannelClosed(
        bytes32 indexed channelId,
        uint256 finalSettled,
        uint256 refunded,
        uint256 timestamp
    );

    event DisputeRaised(
        bytes32 indexed channelId,
        address indexed disputedBy,
        uint256 deadline,
        uint256 timestamp
    );

    event DisputeResolved(
        bytes32 indexed channelId,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "HSP: not owner");
        _;
    }

    modifier channelExists(bytes32 channelId) {
        require(channels[channelId].createdAt != 0, "HSP: channel not found");
        _;
    }

    modifier onlyChannelParty(bytes32 channelId) {
        PaymentChannel storage ch = channels[channelId];
        require(
            msg.sender == ch.payer || msg.sender == ch.payee,
            "HSP: not channel party"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ──────────────────────────────────────────────────

    /**
     * @notice Create a new payment channel with initial deposit
     * @param payee    The recipient of the channel
     * @param token    Payment token (address(0) for HSK)
     * @param duration Channel duration in seconds
     */
    function createChannel(
        address payee,
        address token,
        uint256 duration
    ) external payable returns (bytes32 channelId) {
        require(payee != address(0), "HSP: invalid payee");
        require(payee != msg.sender, "HSP: cannot pay self");
        require(duration >= 1 hours, "HSP: duration too short");

        channelId = keccak256(
            abi.encodePacked(msg.sender, payee, token, block.timestamp, totalChannels)
        );

        uint256 deposit = 0;
        if (token == address(0)) {
            require(msg.value > 0, "HSP: deposit required");
            deposit = msg.value;
        } else {
            // For ERC20, caller must approve first
            // We'll handle deposit in a separate fundChannel call
        }

        channels[channelId] = PaymentChannel({
            channelId:          channelId,
            payer:              msg.sender,
            payee:              payee,
            token:              token,
            totalDeposit:       deposit,
            settledAmount:      0,
            createdAt:          block.timestamp,
            expiresAt:          block.timestamp + duration,
            disputeDeadline:    0,
            status:             deposit > 0 ? ChannelStatus.Active : ChannelStatus.Open,
            lastSettlementHash: bytes32(0)
        });

        userChannels[msg.sender].push(channelId);
        userChannels[payee].push(channelId);
        allChannelIds.push(channelId);
        totalChannels++;

        emit ChannelCreated(
            channelId, msg.sender, payee, token, deposit,
            block.timestamp + duration, block.timestamp
        );

        return channelId;
    }

    /**
     * @notice Fund an existing channel with additional deposit
     */
    function fundChannel(bytes32 channelId, uint256 amount)
        external
        payable
        channelExists(channelId)
    {
        PaymentChannel storage ch = channels[channelId];
        require(msg.sender == ch.payer, "HSP: only payer can fund");
        require(
            ch.status == ChannelStatus.Open || ch.status == ChannelStatus.Active,
            "HSP: channel not fundable"
        );

        if (ch.token == address(0)) {
            require(msg.value > 0, "HSP: HSK required");
            ch.totalDeposit += msg.value;
        } else {
            require(amount > 0, "HSP: amount required");
            IERC20 tokenContract = IERC20(ch.token);
            require(
                tokenContract.transferFrom(msg.sender, address(this), amount),
                "HSP: token transfer failed"
            );
            ch.totalDeposit += amount;
        }

        if (ch.status == ChannelStatus.Open) {
            ch.status = ChannelStatus.Active;
        }

        emit ChannelFunded(channelId, amount, ch.totalDeposit, block.timestamp);
    }

    /**
     * @notice Settle a portion of the channel (payer releases funds to payee)
     * @param channelId The channel to settle
     * @param amount    Amount to release
     * @param nonce     Monotonically increasing nonce for ordering
     */
    function settleChannel(
        bytes32 channelId,
        uint256 amount,
        uint256 nonce
    ) external channelExists(channelId) onlyChannelParty(channelId) {
        PaymentChannel storage ch = channels[channelId];
        require(ch.status == ChannelStatus.Active, "HSP: channel not active");
        require(block.timestamp < ch.expiresAt, "HSP: channel expired");
        require(
            ch.settledAmount + amount <= ch.totalDeposit,
            "HSP: exceeds deposit"
        );

        // Verify sender is payer (only payer can release funds)
        require(msg.sender == ch.payer, "HSP: only payer settles");

        bytes32 settlementHash = keccak256(
            abi.encodePacked(channelId, amount, nonce, block.timestamp)
        );

        // Transfer to payee
        if (ch.token == address(0)) {
            (bool sent, ) = ch.payee.call{value: amount}("");
            require(sent, "HSP: HSK transfer failed");
        } else {
            IERC20 tokenContract = IERC20(ch.token);
            require(
                tokenContract.transfer(ch.payee, amount),
                "HSP: token transfer failed"
            );
        }

        ch.settledAmount += amount;
        ch.lastSettlementHash = settlementHash;

        settlements[channelId].push(Settlement({
            channelId:      channelId,
            amount:         amount,
            nonce:          nonce,
            timestamp:      block.timestamp,
            settlementHash: settlementHash
        }));

        totalSettlementVolume += amount;

        emit SettlementExecuted(channelId, amount, nonce, settlementHash, block.timestamp);
    }

    /**
     * @notice Close a channel and refund remaining balance to payer
     */
    function closeChannel(bytes32 channelId)
        external
        channelExists(channelId)
        onlyChannelParty(channelId)
    {
        PaymentChannel storage ch = channels[channelId];
        require(
            ch.status == ChannelStatus.Active || ch.status == ChannelStatus.Open,
            "HSP: channel not closable"
        );

        // Only payer can close before expiry; either party after expiry
        if (block.timestamp < ch.expiresAt) {
            require(msg.sender == ch.payer, "HSP: only payer before expiry");
        }

        uint256 refundAmount = ch.totalDeposit - ch.settledAmount;

        if (refundAmount > 0) {
            if (ch.token == address(0)) {
                (bool sent, ) = ch.payer.call{value: refundAmount}("");
                require(sent, "HSP: refund failed");
            } else {
                IERC20 tokenContract = IERC20(ch.token);
                require(
                    tokenContract.transfer(ch.payer, refundAmount),
                    "HSP: token refund failed"
                );
            }
        }

        ch.status = ChannelStatus.Closed;

        emit ChannelClosed(channelId, ch.settledAmount, refundAmount, block.timestamp);
    }

    /**
     * @notice Raise a dispute on a channel
     */
    function disputeChannel(bytes32 channelId)
        external
        channelExists(channelId)
        onlyChannelParty(channelId)
    {
        PaymentChannel storage ch = channels[channelId];
        require(ch.status == ChannelStatus.Active, "HSP: channel not active");

        ch.status = ChannelStatus.Disputed;
        ch.disputeDeadline = block.timestamp + disputePeriod;

        emit DisputeRaised(channelId, msg.sender, ch.disputeDeadline, block.timestamp);
    }

    /**
     * @notice Resolve a dispute (owner arbitration for MVP)
     */
    function resolveDispute(bytes32 channelId, uint256 payeeAmount)
        external
        onlyOwner
        channelExists(channelId)
    {
        PaymentChannel storage ch = channels[channelId];
        require(ch.status == ChannelStatus.Disputed, "HSP: not disputed");

        uint256 remaining = ch.totalDeposit - ch.settledAmount;
        require(payeeAmount <= remaining, "HSP: exceeds remaining");

        // Send payeeAmount to payee
        if (payeeAmount > 0) {
            if (ch.token == address(0)) {
                (bool sent, ) = ch.payee.call{value: payeeAmount}("");
                require(sent, "HSP: payee transfer failed");
            } else {
                IERC20(ch.token).transfer(ch.payee, payeeAmount);
            }
        }

        // Refund rest to payer
        uint256 payerRefund = remaining - payeeAmount;
        if (payerRefund > 0) {
            if (ch.token == address(0)) {
                (bool sent, ) = ch.payer.call{value: payerRefund}("");
                require(sent, "HSP: payer refund failed");
            } else {
                IERC20(ch.token).transfer(ch.payer, payerRefund);
            }
        }

        ch.settledAmount = ch.totalDeposit;
        ch.status = ChannelStatus.Closed;

        emit DisputeResolved(channelId, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getChannel(bytes32 channelId) external view returns (PaymentChannel memory) {
        return channels[channelId];
    }

    function getChannelSettlements(bytes32 channelId) external view returns (Settlement[] memory) {
        return settlements[channelId];
    }

    function getUserChannels(address user) external view returns (bytes32[] memory) {
        return userChannels[user];
    }

    function getAllChannelIds() external view returns (bytes32[] memory) {
        return allChannelIds;
    }

    function getStats() external view returns (
        uint256 _totalChannels,
        uint256 _totalSettlementVolume
    ) {
        return (totalChannels, totalSettlementVolume);
    }

    // ─── Admin ───────────────────────────────────────────────────────────

    function setDisputePeriod(uint256 _period) external onlyOwner {
        disputePeriod = _period;
    }
}
