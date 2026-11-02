// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ScamShield
 * @notice Community-driven phishing and malicious URL threat intelligence registry.
 * @dev Stores SHA-256 fingerprints of reported URLs on-chain to provide an immutable,
 *      decentralized repository of threat indicators. Does NOT store raw URLs or private data.
 */
contract ScamShield {
    // -------------------------------------------------------------------------
    // Type Definitions
    // -------------------------------------------------------------------------

    /**
     * @notice Structure storing metadata for an on-chain threat report.
     * @param urlHash SHA-256 fingerprint of the normalized URL.
     * @param reporter Address of the initial reporter.
     * @param category Classification of the threat (1: Phishing, 2: Malware, etc.).
     * @param reportedAt Unix timestamp (seconds) when the URL was first reported.
     * @param reportCount Total number of times community members have flagged this URL.
     * @param exists Sentinel flag indicating whether the record exists.
     */
    struct Report {
        bytes32 urlHash;
        address reporter;
        uint8 category;
        uint256 reportedAt;
        uint256 reportCount;
        bool exists;
    }

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /// @notice Valid category minimum bound (1 = Phishing).
    uint8 public constant MIN_CATEGORY = 1;

    /// @notice Valid category maximum bound (5 = Brand Impersonation).
    uint8 public constant MAX_CATEGORY = 5;

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------

    /// @notice Mapping from SHA-256 URL fingerprint to the corresponding report record.
    mapping(bytes32 => Report) private _reports;

    /// @notice Array of all unique reported URL fingerprints in chronological order.
    bytes32[] private _uniqueURLHashes;

    /// @notice Mapping from reporter address to the list of unique fingerprints they first registered.
    mapping(address => bytes32[]) private _reporterToURLs;

    /// @notice Total cumulative submissions received (including duplicates).
    uint256 private _totalSubmissions;

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    /// @dev Thrown when an invalid zero bytes32 hash is provided.
    error ZeroHashNotAllowed();

    /// @dev Thrown when an invalid threat category identifier is supplied.
    error InvalidCategory(uint8 category);

    /// @dev Thrown when attempting to retrieve a non-existent report record.
    error ReportNotFound(bytes32 urlHash);

    /// @dev Thrown when accessing a report by an out-of-bounds index.
    error IndexOutOfBounds(uint256 index, uint256 total);

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /**
     * @notice Emitted when a new, previously unrecorded URL fingerprint is registered.
     * @param urlHash The SHA-256 fingerprint of the normalized URL.
     * @param reporter The account that submitted the report.
     * @param category The classification category ID.
     * @param timestamp The block timestamp of the initial report.
     */
    event URLReported(
        bytes32 indexed urlHash,
        address indexed reporter,
        uint8 category,
        uint256 timestamp
    );

    /**
     * @notice Emitted when an existing URL fingerprint receives an additional community report.
     * @param urlHash The SHA-256 fingerprint of the normalized URL.
     * @param reporter The account submitting the repeated report.
     * @param category The category indicated in this repeated report.
     * @param newReportCount The updated total report count for this URL.
     * @param timestamp The block timestamp of this repeat submission.
     */
    event RepeatReport(
        bytes32 indexed urlHash,
        address indexed reporter,
        uint8 category,
        uint256 newReportCount,
        uint256 timestamp
    );

    // -------------------------------------------------------------------------
    // External Write Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Submit a URL fingerprint for registration or verification.
     * @dev If the URL fingerprint is new, creates a new record. If it already exists,
     *      increments the report count without altering the original reporter or timestamp.
     * @param urlHash SHA-256 fingerprint of the normalized URL.
     * @param category Threat category identifier (1 to 5).
     * @return isNewReport True if a new record was created, false if an existing record was incremented.
     */
    function reportURL(bytes32 urlHash, uint8 category) external returns (bool isNewReport) {
        if (urlHash == bytes32(0)) {
            revert ZeroHashNotAllowed();
        }
        if (category < MIN_CATEGORY || category > MAX_CATEGORY) {
            revert InvalidCategory(category);
        }

        _totalSubmissions += 1;

        if (!_reports[urlHash].exists) {
            // New record creation
            _reports[urlHash] = Report({
                urlHash: urlHash,
                reporter: msg.sender,
                category: category,
                reportedAt: block.timestamp,
                reportCount: 1,
                exists: true
            });

            _uniqueURLHashes.push(urlHash);
            _reporterToURLs[msg.sender].push(urlHash);

            emit URLReported(urlHash, msg.sender, category, block.timestamp);
            return true;
        } else {
            // Repeat report: increment counter while preserving original reporter & timestamp
            Report storage existing = _reports[urlHash];
            existing.reportCount += 1;

            emit RepeatReport(urlHash, msg.sender, category, existing.reportCount, block.timestamp);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // External View Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Check whether a given URL fingerprint has been reported.
     * @param urlHash SHA-256 fingerprint of the URL.
     * @return True if reported at least once, false otherwise.
     */
    function checkURL(bytes32 urlHash) external view returns (bool) {
        return _reports[urlHash].exists;
    }

    /**
     * @notice Retrieve the complete report record for a given URL fingerprint.
     * @dev Reverts with `ReportNotFound` if the fingerprint has not been registered.
     * @param urlHash SHA-256 fingerprint of the URL.
     * @return Complete Report struct.
     */
    function getReport(bytes32 urlHash) external view returns (Report memory) {
        if (!_reports[urlHash].exists) {
            revert ReportNotFound(urlHash);
        }
        return _reports[urlHash];
    }

    /**
     * @notice Returns the total count of unique URL fingerprints reported.
     * @return Total unique URL fingerprints registered.
     */
    function getTotalUniqueURLs() external view returns (uint256) {
        return _uniqueURLHashes.length;
    }

    /**
     * @notice Returns the total cumulative submissions count (new + repeat reports).
     * @return Total submissions recorded.
     */
    function getTotalSubmissions() external view returns (uint256) {
        return _totalSubmissions;
    }

    /**
     * @notice Retrieve a reported URL fingerprint and its report record by historical index.
     * @dev Reverts with `IndexOutOfBounds` if index is out of bounds.
     * @param index Zero-based index within the unique reports array.
     * @return urlHash The fingerprint at the given index.
     * @return report The corresponding report record.
     */
    function getURLByIndex(uint256 index) external view returns (bytes32 urlHash, Report memory report) {
        uint256 total = _uniqueURLHashes.length;
        if (index >= total) {
            revert IndexOutOfBounds(index, total);
        }
        urlHash = _uniqueURLHashes[index];
        report = _reports[urlHash];
    }

    /**
     * @notice Returns the number of unique fingerprints first submitted by a specified reporter address.
     * @param reporter Address of the reporter.
     * @return Number of unique reports initiated by the address.
     */
    function getMyReportCount(address reporter) external view returns (uint256) {
        return _reporterToURLs[reporter].length;
    }

    /**
     * @notice Retrieve a report submitted by a specific reporter by index.
     * @param reporter Address of the reporter.
     * @param index Zero-based index within the reporter's submissions.
     * @return urlHash Fingerprint submitted.
     * @return report Complete report record.
     */
    function getMyReportByIndex(address reporter, uint256 index)
        external
        view
        returns (bytes32 urlHash, Report memory report)
    {
        uint256 count = _reporterToURLs[reporter].length;
        if (index >= count) {
            revert IndexOutOfBounds(index, count);
        }
        urlHash = _reporterToURLs[reporter][index];
        report = _reports[urlHash];
    }

    /**
     * @notice Paginated retrieval of reports in reverse chronological or standard order.
     * @param offset Start index from the beginning.
     * @param limit Maximum number of records to return.
     * @return batch Array of report structs.
     * @return total Total number of unique reports on-chain.
     */
    function getBatchReports(uint256 offset, uint256 limit)
        external
        view
        returns (Report[] memory batch, uint256 total)
    {
        total = _uniqueURLHashes.length;
        if (offset >= total || limit == 0) {
            return (new Report[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 batchSize = end - offset;
        batch = new Report[](batchSize);

        for (uint256 i = 0; i < batchSize; i++) {
            bytes32 hash = _uniqueURLHashes[offset + i];
            batch[i] = _reports[hash];
        }
    }
}

