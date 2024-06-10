export type Base64String = string

export function encodeBase64(value: Uint8Array): Base64String {
	if (typeof window !== 'undefined') {
		return btoa(String.fromCharCode(...value))
	} else {
		return Buffer.from(value).toString('base64')
	}
}

export function decodeBase64(value: Base64String): Uint8Array {
	if (typeof window !== 'undefined') {
		return Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
	} else {
		return Buffer.from(value, 'base64')
	}
}
