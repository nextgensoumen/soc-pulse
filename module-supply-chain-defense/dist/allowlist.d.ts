/**
 * Allowlist Module for Shai-Hulud 2.0 Detector
 * =============================================
 *
 * This module implements the allowlist feature requested in Discussion #17.
 * It allows users to exclude known false positives from scan results by
 * defining matching rules in a JSON file.
 *
 * Key Design Decisions (per @buggedcom feedback):
 * - Malformed JSON FAILS the scan (safest approach)
 * - All specified fields must match (AND logic)
 * - Omitted fields act as wildcards
 *
 * @see https://github.com/gensecaihq/Shai-Hulud-2.0-Detector/discussions/17
 */
import type { AllowlistEntry, SecurityFinding, ScanResult } from './types';
/**
 * Load and parse the allowlist file.
 *
 * Behavior:
 * - File doesn't exist → Returns empty array (no exclusions)
 * - File exists, valid JSON array → Returns parsed entries
 * - File exists, invalid JSON → THROWS Error (scan will fail)
 * - File exists, not an array → THROWS Error (scan will fail)
 *
 * The "fail on malformed" behavior is intentional per @buggedcom:
 * Silently ignoring a broken allowlist could let critical findings slip through.
 *
 * @param filePath - Path to the allowlist JSON file
 * @returns Array of allowlist entries, or empty array if file doesn't exist
 * @throws Error if file exists but contains invalid JSON or is not an array
 */
export declare function loadAllowlist(filePath: string): AllowlistEntry[];
/**
 * Result of applying an allowlist to scan findings and results.
 */
export interface AllowlistResult {
    /** Security findings that did NOT match any allowlist entry */
    filteredFindings: SecurityFinding[];
    /** Scan results that did NOT match any allowlist entry */
    filteredResults: ScanResult[];
    /** Findings that were excluded, with the entry that matched them */
    allowlistedFindings: Array<{
        finding: SecurityFinding;
        matchedBy: AllowlistEntry;
    }>;
    /** Results that were excluded, with the entry that matched them */
    allowlistedResults: Array<{
        result: ScanResult;
        matchedBy: AllowlistEntry;
    }>;
}
/**
 * Apply allowlist to findings and results.
 *
 * This is the main entry point for allowlist processing. It:
 * 1. Iterates through all security findings and scan results
 * 2. Checks each against the allowlist entries
 * 3. Separates them into "filtered" (kept) and "allowlisted" (excluded) groups
 * 4. Returns both groups so the caller can report/warn on exclusions
 *
 * @param findings - All security findings from the scan
 * @param results - All scan results (packages) from the scan
 * @param allowlist - The allowlist entries to apply
 * @returns Object containing filtered and allowlisted items
 */
export declare function applyAllowlist(findings: SecurityFinding[], results: ScanResult[], allowlist: AllowlistEntry[]): AllowlistResult;
