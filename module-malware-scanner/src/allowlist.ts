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

import * as fs from 'fs';
import type { AllowlistEntry, SecurityFinding, ScanResult } from './types';

// =============================================================================
// ALLOWLIST LOADING
// =============================================================================

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
export function loadAllowlist(filePath: string): AllowlistEntry[] {
	// If file doesn't exist, that's OK - proceed with no exclusions
	if (!fs.existsSync(filePath)) {
		return [];
	}

	const content = fs.readFileSync(filePath, 'utf8');
	let parsed: unknown;

	// Attempt to parse JSON - throw clear error on syntax issues
	try {
		parsed = JSON.parse(content);
	} catch (error) {
		throw new Error(
			`Invalid JSON in allowlist file "${filePath}": ${(error as Error).message}`
		);
	}

	// Allowlist must be an array
	if (!Array.isArray(parsed)) {
		throw new Error(
			`Allowlist file "${filePath}" must contain a JSON array, got ${typeof parsed}`
		);
	}

	return parsed as AllowlistEntry[];
}

// =============================================================================
// MATCHING LOGIC
// =============================================================================

/**
 * Check if a SecurityFinding matches an allowlist entry.
 *
 * Matching Rules:
 * - All specified fields in the entry must match (AND logic)
 * - Omitted/undefined fields are treated as wildcards (match anything)
 * - Fields ending in "Contains" do substring matching
 * - The "comment" field is never used for matching
 *
 * @param finding - The security finding to check
 * @param entry - The allowlist entry to match against
 * @returns true if finding matches the entry, false otherwise
 */
function matchesFinding(finding: SecurityFinding, entry: AllowlistEntry): boolean {
	// Check exact type match (if specified)
	if (entry.type !== undefined && entry.type !== finding.type) {
		return false;
	}

	// Check exact severity match (if specified)
	if (entry.severity !== undefined && entry.severity !== finding.severity) {
		return false;
	}

	// Check exact title match (if specified)
	if (entry.title !== undefined && entry.title !== finding.title) {
		return false;
	}

	// Check title substring match (if specified)
	if (entry.titleContains !== undefined && !finding.title.includes(entry.titleContains)) {
		return false;
	}

	// Check exact location match (if specified)
	if (entry.location !== undefined && entry.location !== finding.location) {
		return false;
	}

	// Check location substring match (if specified)
	if (entry.locationContains !== undefined && !finding.location.includes(entry.locationContains)) {
		return false;
	}

	// Check evidence substring match (if specified)
	// Note: evidence may be undefined on some findings
	if (entry.evidenceContains !== undefined) {
		if (!finding.evidence || !finding.evidence.includes(entry.evidenceContains)) {
			return false;
		}
	}

	// Check exact SHA256 match (if specified)
	if (entry.sha256 !== undefined && entry.sha256 !== finding.sha256) {
		return false;
	}

	// All specified fields matched
	return true;
}

/**
 * Check if a ScanResult (compromised package) matches an allowlist entry.
 *
 * For package matching, we map fields as follows:
 * - type: Must be 'compromised-package' or unspecified
 * - severity: Maps to result.severity
 * - title/titleContains: Maps to result.package (package name)
 * - location/locationContains: Maps to result.location (file path)
 * - evidenceContains: Matches against "pkg@version" or '"pkg": "version"' patterns
 *
 * @param result - The scan result to check
 * @param entry - The allowlist entry to match against
 * @returns true if result matches the entry, false otherwise
 */
function matchesResult(result: ScanResult, entry: AllowlistEntry): boolean {
	// For packages, only 'compromised-package' type or unspecified makes sense
	if (entry.type !== undefined && entry.type !== 'compromised-package') {
		return false;
	}

	// Check severity match
	if (entry.severity !== undefined && entry.severity !== result.severity) {
		return false;
	}

	// For packages, "title" matches against package name
	if (entry.title !== undefined && entry.title !== result.package) {
		return false;
	}

	// Substring match on package name
	if (entry.titleContains !== undefined && !result.package.includes(entry.titleContains)) {
		return false;
	}

	// Exact location match
	if (entry.location !== undefined && entry.location !== result.location) {
		return false;
	}

	// Substring match on location
	if (entry.locationContains !== undefined && !result.location.includes(entry.locationContains)) {
		return false;
	}

	// Evidence matching for packages - check common patterns
	if (entry.evidenceContains !== undefined) {
		const evidenceVariants = [
			`${result.package}@${result.version}`,           // pkg@1.0.0
			`"${result.package}": "${result.version}"`,      // "pkg": "1.0.0"
			`"${result.package}"`,                           // just the package name
		];
		const matchesEvidence = evidenceVariants.some(v => v.includes(entry.evidenceContains!));
		if (!matchesEvidence) {
			return false;
		}
	}

	return true;
}

// =============================================================================
// ALLOWLIST APPLICATION
// =============================================================================

/**
 * Result of applying an allowlist to scan findings and results.
 */
export interface AllowlistResult {
	/** Security findings that did NOT match any allowlist entry */
	filteredFindings: SecurityFinding[];
	/** Scan results that did NOT match any allowlist entry */
	filteredResults: ScanResult[];
	/** Findings that were excluded, with the entry that matched them */
	allowlistedFindings: Array<{ finding: SecurityFinding; matchedBy: AllowlistEntry }>;
	/** Results that were excluded, with the entry that matched them */
	allowlistedResults: Array<{ result: ScanResult; matchedBy: AllowlistEntry }>;
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
export function applyAllowlist(
	findings: SecurityFinding[],
	results: ScanResult[],
	allowlist: AllowlistEntry[]
): AllowlistResult {
	const filteredFindings: SecurityFinding[] = [];
	const filteredResults: ScanResult[] = [];
	const allowlistedFindings: AllowlistResult['allowlistedFindings'] = [];
	const allowlistedResults: AllowlistResult['allowlistedResults'] = [];

	// Process security findings
	for (const finding of findings) {
		const matchedEntry = allowlist.find(entry => matchesFinding(finding, entry));
		if (matchedEntry) {
			// Finding matched an allowlist entry - exclude it
			allowlistedFindings.push({ finding, matchedBy: matchedEntry });
		} else {
			// No match - keep it in the results
			filteredFindings.push(finding);
		}
	}

	// Process scan results (compromised packages)
	for (const result of results) {
		// Only affected packages can be allowlisted
		if (!result.affected) {
			filteredResults.push(result);
			continue;
		}

		const matchedEntry = allowlist.find(entry => matchesResult(result, entry));
		if (matchedEntry) {
			// Package matched an allowlist entry - exclude it
			allowlistedResults.push({ result, matchedBy: matchedEntry });
		} else {
			// No match - keep it in the results
			filteredResults.push(result);
		}
	}

	return {
		filteredFindings,
		filteredResults,
		allowlistedFindings,
		allowlistedResults,
	};
}
