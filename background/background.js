// Background Script for HapoDigital Chrome Extension v3
class HapoDigitalBackground {
    constructor() {
        this.init();
    }

    init() {
        this.setupContextMenus();
        this.setupTabListeners();
        this.setupMessageListeners();
        this.setupInstallListener();
    }

    setupContextMenus() {
        chrome.runtime.onInstalled.addListener(() => {
            // Context menu cho SEO analysis
            chrome.contextMenus.create({
                id: 'hapo-seo-analysis',
                title: 'Phân tích SEO trang này',
                contexts: ['page']
            });

            // Context menu cho kiểm tra backlink
            chrome.contextMenus.create({
                id: 'hapo-backlink-check',
                title: 'Kiểm tra backlink',
                contexts: ['selection', 'link']
            });

            // Context menu cho HapoDigital services
            chrome.contextMenus.create({
                id: 'hapo-services',
                title: 'Dịch vụ HapoDigital',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'hapo-contact',
                title: '📞 Liên hệ tư vấn: 0965.899.745',
                parentId: 'hapo-services',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'hapo-website',
                title: '🌐 Truy cập HapoDigital.com',
                parentId: 'hapo-services',
                contexts: ['page']
            });
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            this.handleContextMenuClick(info, tab);
        });
    }

    setupTabListeners() {
        // Listen for tab updates to inject content script if needed
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
                this.handleTabUpdate(tabId, tab);
            }
        });
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep channel open for async response
        });
    }

    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });
    }

    handleContextMenuClick(info, tab) {
        switch (info.menuItemId) {
            case 'hapo-seo-analysis':
                this.performSEOAnalysis(tab);
                break;
            case 'hapo-backlink-check':
                this.checkBacklinks(info, tab);
                break;
            case 'hapo-contact':
                chrome.tabs.create({ url: 'tel:0965899745' });
                break;
            case 'hapo-website':
                chrome.tabs.create({ url: 'https://hapodigital.com' });
                break;
        }
    }

    handleTabUpdate(tabId, tab) {
        // Store tab information for analysis
        chrome.storage.local.set({
            [`tab_${tabId}`]: {
                url: tab.url,
                title: tab.title,
                timestamp: Date.now()
            }
        });
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'getSEOData':
                this.getSEOData(message.url)
                    .then(data => sendResponse({ success: true, data }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                break;

            case 'saveAnalysisResult':
                this.saveAnalysisResult(message.data)
                    .then(() => sendResponse({ success: true }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                break;

            case 'getHapoServices':
                sendResponse(this.getHapoServices());
                break;

            case 'trackEvent':
                this.trackEvent(message.eventName, message.eventData);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    async performSEOAnalysis(tab) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.analyzePage
            });

            // Show notification with results
            this.showNotification('SEO Analysis Complete', 
                `Phân tích hoàn tất cho ${tab.title}`);

            // Save results
            await this.saveAnalysisResult({
                url: tab.url,
                title: tab.title,
                analysis: result[0].result,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('SEO Analysis failed:', error);
            this.showNotification('Lỗi phân tích', 'Không thể phân tích trang này');
        }
    }

    // Function to be executed in content script context
    analyzePage() {
        const analysis = {
            title: {
                text: document.title,
                length: document.title.length,
                status: document.title.length >= 30 && document.title.length <= 60 ? 'good' : 'warning'
            },
            meta: {
                description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
                keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
            },
            headings: {
                h1: document.querySelectorAll('h1').length,
                h2: document.querySelectorAll('h2').length,
                h3: document.querySelectorAll('h3').length
            },
            images: {
                total: document.querySelectorAll('img').length,
                withAlt: document.querySelectorAll('img[alt]').length
            },
            links: {
                internal: 0,
                external: 0
            }
        };

        // Count internal and external links
        document.querySelectorAll('a[href]').forEach(link => {
            const href = link.getAttribute('href');
            if (href.startsWith('http')) {
                if (href.includes(window.location.hostname)) {
                    analysis.links.internal++;
                } else {
                    analysis.links.external++;
                }
            } else {
                analysis.links.internal++;
            }
        });

        return analysis;
    }

    async checkBacklinks(info, tab) {
        const url = info.linkUrl || info.selectionText || tab.url;
        
        // Open HapoDigital backlink service page
        chrome.tabs.create({ 
            url: `https://hapodigital.com/mua-backlink/?url=${encodeURIComponent(url)}` 
        });

        this.trackEvent('backlink_check', { url, source: 'context_menu' });
    }

    async getSEOData(url) {
        // Fetch SEO data (mock implementation)
        return {
            url,
            timestamp: Date.now(),
            suggestions: [
                'Tối ưu title tag để tăng CTR',
                'Thêm meta description hấp dẫn',
                'Cải thiện cấu trúc heading',
                'Bổ sung alt text cho hình ảnh'
            ],
            hapoServices: this.getHapoServices()
        };
    }

    async saveAnalysisResult(data) {
        const key = `analysis_${Date.now()}`;
        await chrome.storage.local.set({ [key]: data });
        
        // Keep only last 50 analyses
        const allKeys = await chrome.storage.local.get(null);
        const analysisKeys = Object.keys(allKeys)
            .filter(key => key.startsWith('analysis_'))
            .sort()
            .reverse();
            
        if (analysisKeys.length > 50) {
            const keysToRemove = analysisKeys.slice(50);
            await chrome.storage.local.remove(keysToRemove);
        }
    }

    getHapoServices() {
        return {
            backlink: {
                name: 'Dịch vụ Backlink Báo',
                description: 'Backlink từ 40+ trang báo lớn, DA cao',
                url: 'https://hapodigital.com/mua-backlink/',
                features: [
                    'Backlink từ báo uy tín',
                    'DA/PA cao trên 50',
                    'Anchor text đa dạng',
                    'Báo cáo chi tiết'
                ]
            },
            seo: {
                name: 'Dịch vụ SEO Tổng thể',
                description: 'SEO toàn diện giúp website lên TOP',
                url: 'https://hapodigital.com/dich-vu-seo/',
                features: [
                    'SEO Onpage chuyên sâu',
                    'SEO Offpage hiệu quả',
                    'Tăng hàng nghìn từ khóa',
                    'Cam kết KPIs cụ thể'
                ]
            },
            guestpost: {
                name: 'Dịch vụ Guest Post',
                description: '100+ Guest Post chất lượng cao',
                url: 'https://hapodigital.com/dich-vu-guest-post/',
                features: [
                    'DA/PA trên 15',
                    'Traffic lớn',
                    'Đa dạng lĩnh vực',
                    'Giá cả cạnh tranh'
                ]
            },
            pr: {
                name: 'Dịch vụ PR Báo',
                description: 'Book bài PR trên các báo lớn',
                url: 'https://hapodigital.com/dich-vu-book-bai-pr/',
                features: [
                    'Dantri, VnExpress, 24h',
                    'Zing, Kenh14, Eva',
                    'Tăng thương hiệu',
                    'SEO hiệu quả'
                ]
            }
        };
    }

    showNotification(title, message) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message
        });
    }

    trackEvent(eventName, eventData = {}) {
        // Track events for analytics
        const event = {
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            extension_version: chrome.runtime.getManifest().version
        };

        chrome.storage.local.get(['events'], (result) => {
            const events = result.events || [];
            events.push(event);
            
            // Keep only last 1000 events
            if (events.length > 1000) {
                events.splice(0, events.length - 1000);
            }
            
            chrome.storage.local.set({ events });
        });
    }

    handleFirstInstall() {
        // Welcome new users
        chrome.tabs.create({ 
            url: 'https://hapodigital.com/chrome-extension-welcome' 
        });

        this.showNotification(
            'Chào mừng đến với HapoDigital!',
            'Extension đã được cài đặt thành công. Click vào icon để bắt đầu!'
        );

        this.trackEvent('extension_installed');
    }

    handleUpdate(previousVersion) {
        console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
        
        this.trackEvent('extension_updated', { 
            from: previousVersion, 
            to: chrome.runtime.getManifest().version 
        });
    }
}

// Initialize background script
new HapoDigitalBackground();