// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import langsung dari URL â€” tidak perlu npm install (cocok untuk Remix)
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";

/**
 * @title PressChain
 * @dev Payment routing contract for citizen journalism
 *      Supports pay-per-read, tips, and media licensing
 *      Synthesis Hackathon 2026 â€” Theme: Agents that Pay
 */
contract PressChain is Ownable {

    // â”€â”€ Structs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    struct Report {
        address reporter;       // Reporter's wallet
        string ipfsCID;         // IPFS content identifier
        uint256 publishedAt;    // Timestamp on-chain
        uint256 readPrice;      // Price per read in wei (0 = free)
        uint256 licensePrice;   // Price for media license in wei
        uint256 totalEarned;    // Total earnings accumulated
        uint256 tipCount;       // Number of tips received
        bool active;            // Is report active
    }

    // â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    uint256 private _reportIdCounter;

    // reportId â†’ Report
    mapping(uint256 => Report) public reports;

    // reporter address â†’ total lifetime earnings
    mapping(address => uint256) public reporterEarnings;

    // reporter address â†’ report count (reputation)
    mapping(address => uint256) public reporterReputation;

    // reportId â†’ reader address â†’ has paid
    mapping(uint256 => mapping(address => bool)) public hasPaidToRead;

    // Platform fee in basis points (e.g. 500 = 5%)
    uint256 public platformFeeBps = 500;

    // â”€â”€ Events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    event ReportPublished(
        uint256 indexed reportId,
        address indexed reporter,
        string ipfsCID,
        uint256 timestamp
    );

    event ReportRead(
        uint256 indexed reportId,
        address indexed reader,
        uint256 amount
    );

    event TipSent(
        uint256 indexed reportId,
        address indexed tipper,
        address indexed reporter,
        uint256 amount
    );

    event LicensePurchased(
        uint256 indexed reportId,
        address indexed buyer,
        address indexed reporter,
        uint256 amount
    );

    // â”€â”€ Core Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Publish a new report on-chain
     * @param reporter      Reporter's wallet address
     * @param ipfsCID       IPFS CID of the report content
     * @param readPrice     Price per read in wei (0 = free)
     * @param licensePrice  Price for media license in wei
     */
    function publishReport(
        address reporter,
        string calldata ipfsCID,
        uint256 readPrice,
        uint256 licensePrice
    ) external returns (uint256) {
        require(reporter != address(0), "Invalid reporter address");
        require(bytes(ipfsCID).length > 0, "CID cannot be empty");

        uint256 reportId = _reportIdCounter++;

        reports[reportId] = Report({
            reporter: reporter,
            ipfsCID: ipfsCID,
            publishedAt: block.timestamp,
            readPrice: readPrice,
            licensePrice: licensePrice,
            totalEarned: 0,
            tipCount: 0,
            active: true
        });

        reporterReputation[reporter]++;

        emit ReportPublished(reportId, reporter, ipfsCID, block.timestamp);
        return reportId;
    }

    /**
     * @notice Pay to read a report
     * @param reportId  The report to unlock
     */
    function payToRead(uint256 reportId) external payable {
        Report storage report = reports[reportId];
        require(report.active, "Report not active");
        require(!hasPaidToRead[reportId][msg.sender], "Already paid");
        require(msg.value >= report.readPrice, "Insufficient payment");

        hasPaidToRead[reportId][msg.sender] = true;

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 payout = msg.value - fee;

        report.totalEarned += payout;
        reporterEarnings[report.reporter] += payout;

        payable(report.reporter).transfer(payout);

        emit ReportRead(reportId, msg.sender, msg.value);
    }

    /**
     * @notice Send a tip to a reporter
     * @param reportId  The report to tip
     */
    function tipReporter(uint256 reportId) external payable {
        Report storage report = reports[reportId];
        require(report.active, "Report not active");
        require(msg.value > 0, "Tip must be > 0");

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 payout = msg.value - fee;

        report.totalEarned += payout;
        report.tipCount++;
        reporterEarnings[report.reporter] += payout;

        payable(report.reporter).transfer(payout);

        emit TipSent(reportId, msg.sender, report.reporter, payout);
    }

    /**
     * @notice Purchase media license for a report
     * @param reportId  The report to license
     */
    function purchaseLicense(uint256 reportId) external payable {
        Report storage report = reports[reportId];
        require(report.active, "Report not active");
        require(msg.value >= report.licensePrice, "Insufficient payment");

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 payout = msg.value - fee;

        report.totalEarned += payout;
        reporterEarnings[report.reporter] += payout;

        payable(report.reporter).transfer(payout);

        emit LicensePurchased(reportId, msg.sender, report.reporter, payout);
    }

    // â”€â”€ View Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    function getReport(uint256 reportId) external view returns (Report memory) {
        return reports[reportId];
    }

    function totalReports() external view returns (uint256) {
        return _reportIdCounter;
    }

    function canRead(uint256 reportId, address reader) external view returns (bool) {
        Report memory report = reports[reportId];
        return report.readPrice == 0 || hasPaidToRead[reportId][reader];
    }

    // â”€â”€ Owner Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Max fee is 10%");
        platformFeeBps = _feeBps;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
