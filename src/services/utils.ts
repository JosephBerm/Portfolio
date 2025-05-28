import { FeaturedProjectDescriptionLinkType } from "./portfolioInformation";

// 1. Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// 2. Intersection Observer hook helper
export function createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = { threshold: 0.1 }
): IntersectionObserver {
    return new IntersectionObserver(callback, options);
}

// 3. SEO-friendly text truncation
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

// 4. Format dates consistently
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 5. Generate meta description from content
export function generateMetaDescription(content: string, maxLength: number = 160): string {
    const stripped = content.replace(/<[^>]*>/g, '');
    return truncateText(stripped, maxLength);
}

// 6. Smooth scroll to element
export function smoothScrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 7. Check if element is in viewport
export function isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// 8. Generate random ID for keys
export function generateId(prefix: string = ''): string {
    return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

// 9. Format large numbers (e.g., 1000 -> 1K)
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 10. Get text with links (your existing function)
export function getTextWithLinks(str: string, links: FeaturedProjectDescriptionLinkType[]): string {
    let allText = str;

    for (let key in links) {
        const { text, link } = links[key];
        const regex = new RegExp(text, 'g');
        allText = allText.replace(
            regex,
            `<a href=${link} target="_blank" rel='noopener noreferrer'>${text}</a>`
        );
    }

    return allText;
}

// 11. Calculate reading time
export function calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// 12. Sanitize HTML content
export function sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// 13. Generate social share URL
export function generateShareUrl(
    platform: 'twitter' | 'linkedin' | 'facebook',
    url: string,
    title: string
): string {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    switch (platform) {
        case 'twitter':
            return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        default:
            return url;
    }
}

// 14. Check if device is mobile
export function isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );
}

// 15. Format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
