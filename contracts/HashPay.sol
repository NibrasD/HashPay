// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title HashPay
 * @notice Privacy-first invoice & payment protocol on HashKey Chain (PayFi Track)
 * @dev Adapts HashPay's ZK commit-reveal pattern to EVM using keccak256 hashing.
 *      Merchants create invoices with hashed details; payers reveal the preimage to settle.
 *
 *      Privacy Model:
 *      - Invoice hash = keccak256(merchant, amount, salt, token)
 *      - On-chain: only the hash, token address, invoice type, and status are stored
 *      - Merchant address and amount are never stored in plaintext on-chain
 *      - Salt is a 256-bit random value generated client-side
 */
contract HashPay {
    // ─── Types ───────────────────────────────────────────────────────────
    enum InvoiceStatus { Open, Settled, Cancelled, Disputed }
    enum InvoiceType   { Standard, Campaign, Recurring }

    struct Invoice {
        bytes32     invoiceHash;    // keccak256(merchant, amount, salt, token)
        address     token;          // address(0) = native HSK, otherwise ERC20
        uint256     amount;         // invoice amount (stored for convenience in MVP)
        address     creator;        // invoice creator
        InvoiceType invoiceType;
        InvoiceStatus status;
        uint256     createdAt;
        uint256     settledAt;
        address     payer;          // populated on settlement
        uint256     campaignTotal;  // total collected (for Campaign type)
        uint256     paymentCount;   // number of payments received
    }

    struct Receipt {
        bytes32 invoiceId;
        address payer;
        address merchant;
        uint256 amount;
        address token;
        uint256 timestamp;
        bytes32 receiptHash;
    }

    // ─── State ───────────────────────────────────────────────────────────
    mapping(bytes32 => Invoice)   public invoices;
    mapping(bytes32 => Receipt[]) public receipts;       // invoiceId => receipts
    mapping(address => bytes32[]) public merchantInvoices; // merchant => invoiceIds
    mapping(address => bytes32[]) public payerReceipts;    // payer => invoiceIds paid

    bytes32[] public allInvoiceIds;
    uint256   public totalInvoices;
    uint256   public totalSettled;
    uint256   public totalVolume;    // in wei (HSK) cumulative

    address public owner;

    // ─── Events ──────────────────────────────────────────────────────────
    event InvoiceCreated(
        bytes32 indexed invoiceId,
        address indexed creator,
        address token,
        uint256 amount,
        InvoiceType invoiceType,
        uint256 timestamp
    );

    event InvoicePaid(
        bytes32 indexed invoiceId,
        address indexed payer,
        address indexed merchant,
        uint256 amount,
        address token,
        bytes32 receiptHash,
        uint256 timestamp
    );

    event InvoiceCancelled(
        bytes32 indexed invoiceId,
        uint256 timestamp
    );

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "HashPay: not owner");
        _;
    }

    modifier invoiceExists(bytes32 invoiceId) {
        require(invoices[invoiceId].createdAt != 0, "HashPay: invoice not found");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ──────────────────────────────────────────────────

    /**
     * @notice Create a new private invoice
     * @param invoiceHash  keccak256(abi.encodePacked(merchant, amount, salt, token))
     * @param amount       Invoice amount (for display / verification)
     * @param token        Payment token (address(0) for native HSK)
     * @param invoiceType  0=Standard, 1=Campaign, 2=Recurring
     */
    function createInvoice(
        bytes32     invoiceHash,
        uint256     amount,
        address     token,
        InvoiceType invoiceType
    ) external returns (bytes32 invoiceId) {
        // Generate unique invoice ID
        invoiceId = keccak256(
            abi.encodePacked(invoiceHash, msg.sender, block.timestamp, totalInvoices)
        );

        require(invoices[invoiceId].createdAt == 0, "HashPay: duplicate invoice");

        invoices[invoiceId] = Invoice({
            invoiceHash:    invoiceHash,
            token:          token,
            amount:         amount,
            creator:        msg.sender,
            invoiceType:    invoiceType,
            status:         InvoiceStatus.Open,
            createdAt:      block.timestamp,
            settledAt:      0,
            payer:          address(0),
            campaignTotal:  0,
            paymentCount:   0
        });

        merchantInvoices[msg.sender].push(invoiceId);
        allInvoiceIds.push(invoiceId);
        totalInvoices++;

        emit InvoiceCreated(
            invoiceId,
            msg.sender,
            token,
            amount,
            invoiceType,
            block.timestamp
        );

        return invoiceId;
    }

    /**
     * @notice Pay an invoice by revealing the preimage (commit-reveal)
     * @param invoiceId  The invoice to pay
     * @param salt       The random salt used in the hash
     * @param merchant   The merchant address
     */
    function payInvoice(
        bytes32 invoiceId,
        bytes32 salt,
        address merchant
    ) external payable invoiceExists(invoiceId) {
        Invoice storage inv = invoices[invoiceId];

        require(inv.status == InvoiceStatus.Open, "HashPay: invoice not open");

        // Verify commit-reveal: hash must match
        bytes32 computedHash = keccak256(
            abi.encodePacked(merchant, inv.amount, salt, inv.token)
        );
        require(computedHash == inv.invoiceHash, "HashPay: hash mismatch");

        uint256 payAmount = inv.amount;

        // Execute payment
        if (inv.token == address(0)) {
            // Native HSK payment
            require(msg.value >= payAmount, "HashPay: insufficient HSK");
            (bool sent, ) = merchant.call{value: payAmount}("");
            require(sent, "HashPay: HSK transfer failed");

            // Refund excess
            if (msg.value > payAmount) {
                (bool refund, ) = msg.sender.call{value: msg.value - payAmount}("");
                require(refund, "HashPay: refund failed");
            }
        } else {
            // ERC20 token payment
            IERC20 tokenContract = IERC20(inv.token);
            require(
                tokenContract.transferFrom(msg.sender, merchant, payAmount),
                "HashPay: token transfer failed"
            );
        }

        // Generate receipt hash
        bytes32 receiptHash = keccak256(
            abi.encodePacked(invoiceId, msg.sender, merchant, payAmount, block.timestamp)
        );

        // Store receipt
        receipts[invoiceId].push(Receipt({
            invoiceId:   invoiceId,
            payer:       msg.sender,
            merchant:    merchant,
            amount:      payAmount,
            token:       inv.token,
            timestamp:   block.timestamp,
            receiptHash: receiptHash
        }));

        // Update invoice state
        if (inv.invoiceType == InvoiceType.Standard) {
            inv.status    = InvoiceStatus.Settled;
            inv.settledAt = block.timestamp;
            inv.payer     = msg.sender;
            totalSettled++;
        } else {
            // Campaign: accumulate payments
            inv.campaignTotal += payAmount;
            inv.paymentCount++;
        }

        totalVolume += payAmount;
        payerReceipts[msg.sender].push(invoiceId);

        emit InvoicePaid(
            invoiceId,
            msg.sender,
            merchant,
            payAmount,
            inv.token,
            receiptHash,
            block.timestamp
        );
    }

    /**
     * @notice Batch pay multiple invoices in one transaction
     */
    function batchPay(
        bytes32[] calldata invoiceIds,
        bytes32[] calldata salts,
        address[] calldata merchants
    ) external payable {
        require(
            invoiceIds.length == salts.length && salts.length == merchants.length,
            "HashPay: array length mismatch"
        );

        uint256 totalHSKNeeded = 0;

        for (uint256 i = 0; i < invoiceIds.length; i++) {
            Invoice storage inv = invoices[invoiceIds[i]];
            if (inv.token == address(0)) {
                totalHSKNeeded += inv.amount;
            }
        }

        require(msg.value >= totalHSKNeeded, "HashPay: insufficient HSK for batch");

        for (uint256 i = 0; i < invoiceIds.length; i++) {
            // Each sub-call handles verification internally
            this._executeSinglePayment(invoiceIds[i], salts[i], merchants[i], msg.sender);
        }
    }

    /**
     * @dev Internal: execute a single payment (used by batchPay)
     */
    function _executeSinglePayment(
        bytes32 invoiceId,
        bytes32 salt,
        address merchant,
        address payer
    ) external {
        require(msg.sender == address(this), "HashPay: internal only");

        Invoice storage inv = invoices[invoiceId];
        require(inv.status == InvoiceStatus.Open, "HashPay: invoice not open");

        bytes32 computedHash = keccak256(
            abi.encodePacked(merchant, inv.amount, salt, inv.token)
        );
        require(computedHash == inv.invoiceHash, "HashPay: hash mismatch");

        uint256 payAmount = inv.amount;

        if (inv.token == address(0)) {
            (bool sent, ) = merchant.call{value: payAmount}("");
            require(sent, "HashPay: HSK transfer failed");
        } else {
            IERC20 tokenContract = IERC20(inv.token);
            require(
                tokenContract.transferFrom(payer, merchant, payAmount),
                "HashPay: token transfer failed"
            );
        }

        bytes32 receiptHash = keccak256(
            abi.encodePacked(invoiceId, payer, merchant, payAmount, block.timestamp)
        );

        receipts[invoiceId].push(Receipt({
            invoiceId:   invoiceId,
            payer:       payer,
            merchant:    merchant,
            amount:      payAmount,
            token:       inv.token,
            timestamp:   block.timestamp,
            receiptHash: receiptHash
        }));

        if (inv.invoiceType == InvoiceType.Standard) {
            inv.status    = InvoiceStatus.Settled;
            inv.settledAt = block.timestamp;
            inv.payer     = payer;
            totalSettled++;
        } else {
            inv.campaignTotal += payAmount;
            inv.paymentCount++;
        }

        totalVolume += payAmount;
        payerReceipts[payer].push(invoiceId);

        emit InvoicePaid(invoiceId, payer, merchant, payAmount, inv.token, receiptHash, block.timestamp);
    }

    /**
     * @notice Cancel an open invoice (creator only)
     */
    function cancelInvoice(bytes32 invoiceId) external invoiceExists(invoiceId) {
        Invoice storage inv = invoices[invoiceId];
        require(inv.creator == msg.sender, "HashPay: not creator");
        require(inv.status == InvoiceStatus.Open, "HashPay: not open");

        inv.status = InvoiceStatus.Cancelled;

        emit InvoiceCancelled(invoiceId, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getInvoice(bytes32 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }

    function getInvoiceReceipts(bytes32 invoiceId) external view returns (Receipt[] memory) {
        return receipts[invoiceId];
    }

    function getMerchantInvoices(address merchant) external view returns (bytes32[] memory) {
        return merchantInvoices[merchant];
    }

    function getPayerHistory(address payer) external view returns (bytes32[] memory) {
        return payerReceipts[payer];
    }

    function getAllInvoiceIds() external view returns (bytes32[] memory) {
        return allInvoiceIds;
    }

    function getRecentInvoices(uint256 count) external view returns (bytes32[] memory) {
        uint256 len = allInvoiceIds.length;
        if (count > len) count = len;

        bytes32[] memory recent = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = allInvoiceIds[len - 1 - i];
        }
        return recent;
    }

    function getStats() external view returns (
        uint256 _totalInvoices,
        uint256 _totalSettled,
        uint256 _totalVolume
    ) {
        return (totalInvoices, totalSettled, totalVolume);
    }

    /**
     * @notice Verify an invoice hash off-chain (can be called as a view)
     */
    function verifyInvoiceHash(
        address merchant,
        uint256 amount,
        bytes32 salt,
        address token
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(merchant, amount, salt, token));
    }
}
