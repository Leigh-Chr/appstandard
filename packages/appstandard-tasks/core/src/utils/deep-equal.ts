/**
 * Deep equality and cloning utilities
 */

import { dequal } from "dequal";

/**
 * Deep equality comparison
 */
export function deepEqual<T>(a: T, b: T): boolean {
	return dequal(a, b);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
	return structuredClone(obj);
}

/**
 * Shallow clone an object
 */
export function shallowClone<T extends object>(obj: T): T {
	return { ...obj };
}
