import { FeaturedProjectDescriptionLinkType } from './portfolioInformation'

/**
 * Debounce function for performance optimization
 *
 * @param {function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {function} The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout
	return (...args: Parameters<T>) => {
		clearTimeout(timeout)
		timeout = setTimeout(() => func(...args), wait)
	}
}

/**
 * Intersection Observer hook helper
 *
 * @param {IntersectionObserverCallback} callback - The callback function for the observer
 * @param {IntersectionObserverInit} options - The options for the observer
 * @returns {IntersectionObserver} The created intersection observer
 */
export function createIntersectionObserver(
	callback: IntersectionObserverCallback,
	options: IntersectionObserverInit = { threshold: 0.1 }
): IntersectionObserver {
	return new IntersectionObserver(callback, options)
}

/**
 * SEO-friendly text truncation
 *
 * @param {string} text - The text to truncate
 * @param {number} maxLength - The maximum length of the truncated text
 * @returns {string} The truncated text
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text
	return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format dates consistently
 *
 * @param {Date | string} date - The date to format
 * @returns {string} The formatted date
 */
export function formatDate(date: Date | string): string {
	const d = new Date(date)
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

/**
 * Generate meta description from content
 *
 * @param {string} content - The content to generate a meta description from
 * @param {number} maxLength - The maximum length of the meta description
 * @returns {string} The generated meta description
 */
export function generateMetaDescription(content: string, maxLength: number = 160): string {
	const stripped = content.replace(/<[^>]*>/g, '')
	return truncateText(stripped, maxLength)
}

/**
 * Smooth scroll to element
 *
 * @param {string} elementId - The ID of the element to scroll to
 */
export function smoothScrollTo(elementId: string): void {
	const element = document.getElementById(elementId)
	if (element) {
		element.scrollIntoView({ behavior: 'smooth', block: 'start' })
	}
}

/**
 * Check if element is in viewport
 *
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} Whether the element is in the viewport
 */
export function isInViewport(element: HTMLElement): boolean {
	const rect = element.getBoundingClientRect()
	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	)
}

/**
 * Generate random ID for keys
 *
 * @param {string} prefix - The prefix for the ID
 * @returns {string} The generated ID
 */
export function generateId(prefix: string = ''): string {
	return `${prefix}${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format large numbers (e.g., 1000 -> 1K)
 *
 * @param {number} num - The number to format
 * @returns {string} The formatted number
 */
export function formatNumber(num: number): string {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M'
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K'
	}
	return num.toString()
}

/**
 * Calculate reading time
 *
 * @param {string} text - The text to calculate the reading time for
 * @returns {number} The reading time in minutes
 */
export function calculateReadingTime(text: string): number {
	const wordsPerMinute = 200
	const words = text.trim().split(/\s+/).length
	return Math.ceil(words / wordsPerMinute)
}

/**
 * Sanitize HTML content
 *
 * @param {string} html - The HTML content to sanitize
 * @returns {string} The sanitized HTML content
 */
export function sanitizeHTML(html: string): string {
	const div = document.createElement('div')
	div.textContent = html
	return div.innerHTML
}

/**
 * Generate social share URL
 *
 * @param {string} platform - The social media platform to share on
 * @param {string} url - The URL to share
 * @param {string} title - The title of the content to share
 * @returns {string} The generated social share URL
 */
export function generateShareUrl(platform: 'twitter' | 'linkedin' | 'facebook', url: string, title: string): string {
	const encodedUrl = encodeURIComponent(url)
	const encodedTitle = encodeURIComponent(title)

	switch (platform) {
		case 'twitter':
			return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
		case 'linkedin':
			return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
		case 'facebook':
			return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
		default:
			return url
	}
}

/**
 * Check if device is mobile
 *
 * @returns {boolean} Whether the device is a mobile device
 */
export function isMobileDevice(): boolean {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Format file size
 *
 * @param {number} bytes - The number of bytes to format
 * @returns {string} The formatted file size
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes'
	const k = 1024
	const sizes = ['Bytes', 'KB', 'MB', 'GB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
