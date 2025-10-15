// Content Script for HapoDigital Chrome Extension
class HapoDigitalContent {
    constructor() {
        this.isInjected = false;
        this.seoData = {};
        this.init();
    }

    init() {
        if (this.isInjected) return;
        
        this.isInjected = true;
        this.setupMessageListeners();
        this.analyzePage();
        this.injectHapoWidget();
        this.trackPageView();
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'getPageSEOData':
                    sendResponse(this.getPageSEOData());
                    break;
                case 'highlightSEOIssues':
                    this.highlightSEOIssues();
                    sendResponse({ success: true });
                    break;
                case 'showHapoWidget':
                    this.showHapoWidget();
                    sendResponse({ success: true });
                    break;
                case 'hideHapoWidget':
                    this.hideHapoWidget();
                    sendResponse({ success: true });
                    break;
                default:
                    sendResponse({ error: 'Unknown action' });
            }
        });
    }

    analyzePage() {
        this.seoData = {
            url: window.location.href,
            title: this.analyzeTitle(),
            meta: this.analyzeMeta(),
            headings: this.analyzeHeadings(),
            images: this.analyzeImages(),
            links: this.analyzeLinks(),
            content: this.analyzeContent(),
            structured_data: this.analyzeStructuredData(),
            performance: this.analyzePerformance(),
            timestamp: Date.now()
        };
    }

    analyzeTitle() {
        const title = document.title;
        const length = title.length;
        
        return {
            text: title,
            length: length,
            status: this.getTitleStatus(length),
            suggestions: this.getTitleSuggestions(title, length)
        };
    }

    getTitleStatus(length) {
        if (length === 0) return 'error';
        if (length < 30 || length > 60) return 'warning';
        return 'good';
    }

    getTitleSuggestions(title, length) {
        const suggestions = [];
        
        if (length === 0) {
            suggestions.push('Thêm title tag cho trang');
        } else if (length < 30) {
            suggestions.push('Title quá ngắn, nên dài 30-60 ký tự');
        } else if (length > 60) {
            suggestions.push('Title quá dài, có thể bị cắt trên SERP');
        }
        
        if (!title.includes(window.location.hostname.replace('www.', ''))) {
            suggestions.push('Nên bao gồm tên thương hiệu trong title');
        }
        
        return suggestions;
    }

    analyzeMeta() {
        const metaDesc = document.querySelector('meta[name="description"]');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const ogImage = document.querySelector('meta[property="og:image"]');
        
        const description = metaDesc ? metaDesc.getAttribute('content') : '';
        const descLength = description.length;
        
        return {
            description: {
                text: description,
                length: descLength,
                status: this.getMetaDescStatus(descLength),
                suggestions: this.getMetaDescSuggestions(description, descLength)
            },
            keywords: metaKeywords ? metaKeywords.getAttribute('content') : '',
            openGraph: {
                title: ogTitle ? ogTitle.getAttribute('content') : '',
                description: ogDesc ? ogDesc.getAttribute('content') : '',
                image: ogImage ? ogImage.getAttribute('content') : '',
                hasAll: !!(ogTitle && ogDesc && ogImage)
            }
        };
    }

    getMetaDescStatus(length) {
        if (length === 0) return 'error';
        if (length < 120 || length > 160) return 'warning';
        return 'good';
    }

    getMetaDescSuggestions(description, length) {
        const suggestions = [];
        
        if (length === 0) {
            suggestions.push('Thêm meta description');
        } else if (length < 120) {
            suggestions.push('Meta description quá ngắn');
        } else if (length > 160) {
            suggestions.push('Meta description quá dài');
        }
        
        return suggestions;
    }

    analyzeHeadings() {
        const headings = {
            h1: Array.from(document.querySelectorAll('h1')),
            h2: Array.from(document.querySelectorAll('h2')),
            h3: Array.from(document.querySelectorAll('h3')),
            h4: Array.from(document.querySelectorAll('h4')),
            h5: Array.from(document.querySelectorAll('h5')),
            h6: Array.from(document.querySelectorAll('h6'))
        };

        const counts = {};
        const suggestions = [];
        
        Object.entries(headings).forEach(([tag, elements]) => {
            counts[tag] = elements.length;
        });

        // Check H1
        if (counts.h1 === 0) {
            suggestions.push('Thiếu thẻ H1');
        } else if (counts.h1 > 1) {
            suggestions.push(`Có ${counts.h1} thẻ H1 (nên chỉ có 1)`);
        }

        // Check hierarchy
        if (counts.h1 > 0 && counts.h2 === 0) {
            suggestions.push('Nên có ít nhất 1 thẻ H2');
        }

        return {
            counts,
            elements: headings,
            suggestions,
            status: suggestions.length === 0 ? 'good' : 'warning'
        };
    }

    analyzeImages() {
        const images = Array.from(document.querySelectorAll('img'));
        const total = images.length;
        let withAlt = 0;
        let withoutAlt = 0;
        const issues = [];

        images.forEach((img, index) => {
            const alt = img.getAttribute('alt');
            const src = img.getAttribute('src');
            
            if (!alt || alt.trim() === '') {
                withoutAlt++;
                issues.push({
                    element: img,
                    issue: 'missing_alt',
                    src: src
                });
            } else {
                withAlt++;
            }

            // Check for large images
            if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
                issues.push({
                    element: img,
                    issue: 'large_image',
                    size: `${img.naturalWidth}x${img.naturalHeight}`,
                    src: src
                });
            }
        });

        const altPercentage = total > 0 ? Math.round((withAlt / total) * 100) : 100;

        return {
            total,
            withAlt,
            withoutAlt,
            altPercentage,
            issues,
            status: altPercentage === 100 ? 'good' : altPercentage >= 80 ? 'warning' : 'error',
            suggestions: this.getImageSuggestions(withoutAlt, issues)
        };
    }

    getImageSuggestions(withoutAlt, issues) {
        const suggestions = [];
        
        if (withoutAlt > 0) {
            suggestions.push(`Thêm alt text cho ${withoutAlt} hình ảnh`);
        }
        
        const largeImages = issues.filter(issue => issue.issue === 'large_image').length;
        if (largeImages > 0) {
            suggestions.push(`Tối ưu kích thước ${largeImages} hình ảnh lớn`);
        }
        
        return suggestions;
    }

    analyzeLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        let internal = 0;
        let external = 0;
        let nofollow = 0;
        const issues = [];

        links.forEach(link => {
            const href = link.getAttribute('href');
            const rel = link.getAttribute('rel') || '';
            
            if (href.startsWith('http')) {
                if (href.includes(window.location.hostname)) {
                    internal++;
                } else {
                    external++;
                    if (!rel.includes('nofollow')) {
                        issues.push({
                            element: link,
                            issue: 'external_without_nofollow',
                            href: href
                        });
                    }
                }
            } else {
                internal++;
            }

            if (rel.includes('nofollow')) {
                nofollow++;
            }

            // Check for empty anchor text
            if (!link.textContent.trim() && !link.querySelector('img')) {
                issues.push({
                    element: link,
                    issue: 'empty_anchor_text',
                    href: href
                });
            }
        });

        return {
            total: links.length,
            internal,
            external,
            nofollow,
            issues,
            status: issues.length === 0 ? 'good' : 'warning',
            suggestions: this.getLinkSuggestions(issues)
        };
    }

    getLinkSuggestions(issues) {
        const suggestions = [];
        
        const emptyAnchors = issues.filter(issue => issue.issue === 'empty_anchor_text').length;
        if (emptyAnchors > 0) {
            suggestions.push(`Thêm anchor text cho ${emptyAnchors} link`);
        }
        
        const externalWithoutNofollow = issues.filter(issue => issue.issue === 'external_without_nofollow').length;
        if (externalWithoutNofollow > 0) {
            suggestions.push(`Thêm rel="nofollow" cho ${externalWithoutNofollow} link ngoài`);
        }
        
        return suggestions;
    }

    analyzeContent() {
        const textContent = document.body.textContent || '';
        const wordCount = textContent.trim().split(/\s+/).length;
        const paragraphs = document.querySelectorAll('p').length;
        
        return {
            wordCount,
            paragraphs,
            readingTime: Math.ceil(wordCount / 200), // Average reading speed
            status: wordCount >= 300 ? 'good' : 'warning',
            suggestions: wordCount < 300 ? ['Nội dung quá ngắn, nên có ít nhất 300 từ'] : []
        };
    }

    analyzeStructuredData() {
        const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const microdata = Array.from(document.querySelectorAll('[itemscope]'));
        const rdfa = Array.from(document.querySelectorAll('[vocab]'));
        
        const schemas = [];
        
        jsonLd.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                schemas.push({
                    type: 'JSON-LD',
                    schema: data['@type'] || 'Unknown',
                    element: script
                });
            } catch (e) {
                console.warn('Invalid JSON-LD:', e);
            }
        });

        return {
            jsonLd: jsonLd.length,
            microdata: microdata.length,
            rdfa: rdfa.length,
            schemas,
            status: schemas.length > 0 ? 'good' : 'warning',
            suggestions: schemas.length === 0 ? ['Thêm Structured Data để cải thiện SEO'] : []
        };
    }

    analyzePerformance() {
        const suggestions = [];
        
        // Check for performance issues
        if (document.querySelectorAll('script').length > 10) {
            suggestions.push('Quá nhiều script, có thể ảnh hưởng tốc độ tải');
        }
        
        if (document.querySelectorAll('link[rel="stylesheet"]').length > 5) {
            suggestions.push('Quá nhiều CSS file, nên gộp lại');
        }
        
        return {
            scripts: document.querySelectorAll('script').length,
            stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
            suggestions,
            status: suggestions.length === 0 ? 'good' : 'warning'
        };
    }

    getPageSEOData() {
        return this.seoData;
    }

    highlightSEOIssues() {
        // Remove existing highlights
        document.querySelectorAll('.hapo-seo-highlight').forEach(el => {
            el.classList.remove('hapo-seo-highlight');
        });

        // Highlight images without alt text
        this.seoData.images.issues.forEach(issue => {
            if (issue.issue === 'missing_alt') {
                issue.element.classList.add('hapo-seo-highlight');
                this.addTooltip(issue.element, 'Thiếu alt text');
            }
        });

        // Highlight problematic links
        this.seoData.links.issues.forEach(issue => {
            issue.element.classList.add('hapo-seo-highlight');
            if (issue.issue === 'empty_anchor_text') {
                this.addTooltip(issue.element, 'Link không có anchor text');
            } else if (issue.issue === 'external_without_nofollow') {
                this.addTooltip(issue.element, 'Link ngoài nên có rel="nofollow"');
            }
        });
    }

    addTooltip(element, text) {
        element.setAttribute('title', `HapoDigital SEO: ${text}`);
        element.style.border = '2px dashed #ff6b6b';
    }

    injectHapoWidget() {
        // Create floating widget
        const widget = document.createElement('div');
        widget.id = 'hapo-seo-widget';
        widget.innerHTML = `
            <div class="hapo-widget-toggle">
                <img src="${chrome.runtime.getURL('assets/logo.png')}" alt="HapoDigital">
                <span>SEO</span>
            </div>
            <div class="hapo-widget-content">
                <h4>HapoDigital SEO</h4>
                <div class="hapo-widget-stats">
                    <div class="stat">
                        <span class="label">Title:</span>
                        <span class="status ${this.seoData.title.status}">${this.seoData.title.status}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Meta:</span>
                        <span class="status ${this.seoData.meta.description.status}">${this.seoData.meta.description.status}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Images:</span>
                        <span class="status ${this.seoData.images.status}">${this.seoData.images.altPercentage}%</span>
                    </div>
                </div>
                <div class="hapo-widget-actions">
                    <button id="hapo-highlight-issues">Highlight Issues</button>
                    <button id="hapo-get-help">Nhận hỗ trợ</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        // Widget functionality
        const toggle = widget.querySelector('.hapo-widget-toggle');
        const content = widget.querySelector('.hapo-widget-content');
        
        toggle.addEventListener('click', () => {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });

        widget.querySelector('#hapo-highlight-issues').addEventListener('click', () => {
            this.highlightSEOIssues();
        });

        widget.querySelector('#hapo-get-help').addEventListener('click', () => {
            window.open('https://hapodigital.com/lien-he/', '_blank');
        });
    }

    showHapoWidget() {
        const widget = document.getElementById('hapo-seo-widget');
        if (widget) {
            widget.style.display = 'block';
        }
    }

    hideHapoWidget() {
        const widget = document.getElementById('hapo-seo-widget');
        if (widget) {
            widget.style.display = 'none';
        }
    }

    trackPageView() {
        // Send page view data to background script
        chrome.runtime.sendMessage({
            action: 'trackEvent',
            eventName: 'page_analyzed',
            eventData: {
                url: window.location.href,
                title: document.title,
                seoScore: this.calculateSEOScore()
            }
        });
    }

    calculateSEOScore() {
        let score = 0;
        let maxScore = 0;

        // Title score (20 points)
        maxScore += 20;
        if (this.seoData.title.status === 'good') score += 20;
        else if (this.seoData.title.status === 'warning') score += 10;

        // Meta description score (20 points)
        maxScore += 20;
        if (this.seoData.meta.description.status === 'good') score += 20;
        else if (this.seoData.meta.description.status === 'warning') score += 10;

        // Headings score (15 points)
        maxScore += 15;
        if (this.seoData.headings.status === 'good') score += 15;
        else if (this.seoData.headings.status === 'warning') score += 8;

        // Images score (15 points)
        maxScore += 15;
        if (this.seoData.images.status === 'good') score += 15;
        else if (this.seoData.images.status === 'warning') score += 8;

        // Content score (15 points)
        maxScore += 15;
        if (this.seoData.content.status === 'good') score += 15;
        else if (this.seoData.content.status === 'warning') score += 8;

        // Structured data score (15 points)
        maxScore += 15;
        if (this.seoData.structured_data.status === 'good') score += 15;
        else if (this.seoData.structured_data.status === 'warning') score += 8;

        return Math.round((score / maxScore) * 100);
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HapoDigitalContent();
    });
} else {
    new HapoDigitalContent();
}