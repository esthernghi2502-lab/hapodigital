// Popup Script for HapoDigital Chrome Extension
class HapoDigitalPopup {
    constructor() {
        this.currentTab = 'seo';
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupToolButtons();
        this.loadSettings();
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                this.currentTab = targetTab;
            });
        });
    }

    setupToolButtons() {
        // SEO Tools
        document.getElementById('checkTitle').addEventListener('click', () => {
            this.checkTitleTags();
        });

        document.getElementById('checkMeta').addEventListener('click', () => {
            this.checkMetaDescription();
        });

        document.getElementById('checkHeadings').addEventListener('click', () => {
            this.checkHeadingStructure();
        });

        document.getElementById('checkImages').addEventListener('click', () => {
            this.checkImageAltText();
        });

        // Backlink Tools
        document.getElementById('checkBacklinks').addEventListener('click', () => {
            this.analyzeBacklinks();
        });

        document.getElementById('findOpportunities').addEventListener('click', () => {
            this.findBacklinkOpportunities();
        });

        // Analysis Tools
        document.getElementById('pageSpeed').addEventListener('click', () => {
            this.checkPageSpeed();
        });

        document.getElementById('mobileCheck').addEventListener('click', () => {
            this.checkMobileFriendly();
        });

        document.getElementById('structuredData').addEventListener('click', () => {
            this.checkStructuredData();
        });
    }

    showLoading() {
        const resultContent = document.getElementById('resultContent');
        resultContent.innerHTML = '<div class="loading"></div> Đang phân tích...';
    }

    showResult(content) {
        const resultContent = document.getElementById('resultContent');
        resultContent.innerHTML = content;
    }

    async executeContentScript(func, ...args) {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: func,
                    args: args
                }, (results) => {
                    resolve(results[0].result);
                });
            });
        });
    }

    async checkTitleTags() {
        this.showLoading();
        
        const result = await this.executeContentScript(() => {
            const title = document.title;
            const titleLength = title.length;
            let status = '';
            let suggestions = [];

            if (titleLength === 0) {
                status = 'error';
                suggestions.push('Title tag bị thiếu!');
            } else if (titleLength < 30) {
                status = 'warning';
                suggestions.push('Title quá ngắn (< 30 ký tự)');
            } else if (titleLength > 60) {
                status = 'warning';
                suggestions.push('Title quá dài (> 60 ký tự), có thể bị cắt trên SERP');
            } else {
                status = 'success';
            }

            return {
                title,
                length: titleLength,
                status,
                suggestions
            };
        });

        const statusClass = result.status;
        let resultHTML = `
            <div class="${statusClass}">
                <strong>Title Tag:</strong> ${result.title}<br>
                <strong>Độ dài:</strong> ${result.length} ký tự
            </div>
        `;

        if (result.suggestions.length > 0) {
            resultHTML += '<div class="suggestions"><strong>Gợi ý:</strong><ul>';
            result.suggestions.forEach(suggestion => {
                resultHTML += `<li>${suggestion}</li>`;
            });
            resultHTML += '</ul></div>';
        }

        if (result.status === 'success') {
            resultHTML += '<div class="success">✅ Title tag tối ưu tốt!</div>';
        }

        this.showResult(resultHTML);
    }

    async checkMetaDescription() {
        this.showLoading();

        const result = await this.executeContentScript(() => {
            const metaDesc = document.querySelector('meta[name="description"]');
            let description = '';
            let length = 0;
            let status = '';
            let suggestions = [];

            if (!metaDesc) {
                status = 'error';
                suggestions.push('Meta description bị thiếu!');
            } else {
                description = metaDesc.getAttribute('content') || '';
                length = description.length;

                if (length === 0) {
                    status = 'error';
                    suggestions.push('Meta description trống!');
                } else if (length < 120) {
                    status = 'warning';
                    suggestions.push('Meta description quá ngắn (< 120 ký tự)');
                } else if (length > 160) {
                    status = 'warning';
                    suggestions.push('Meta description quá dài (> 160 ký tự)');
                } else {
                    status = 'success';
                }
            }

            return {
                description,
                length,
                status,
                suggestions
            };
        });

        const statusClass = result.status;
        let resultHTML = `
            <div class="${statusClass}">
                <strong>Meta Description:</strong> ${result.description || 'Không có'}<br>
                <strong>Độ dài:</strong> ${result.length} ký tự
            </div>
        `;

        if (result.suggestions.length > 0) {
            resultHTML += '<div class="suggestions"><strong>Gợi ý:</strong><ul>';
            result.suggestions.forEach(suggestion => {
                resultHTML += `<li>${suggestion}</li>`;
            });
            resultHTML += '</ul></div>';
        }

        this.showResult(resultHTML);
    }

    async checkHeadingStructure() {
        this.showLoading();

        const result = await this.executeContentScript(() => {
            const headings = {
                h1: document.querySelectorAll('h1').length,
                h2: document.querySelectorAll('h2').length,
                h3: document.querySelectorAll('h3').length,
                h4: document.querySelectorAll('h4').length,
                h5: document.querySelectorAll('h5').length,
                h6: document.querySelectorAll('h6').length
            };

            let suggestions = [];
            let status = 'success';

            if (headings.h1 === 0) {
                status = 'error';
                suggestions.push('Thiếu thẻ H1');
            } else if (headings.h1 > 1) {
                status = 'warning';
                suggestions.push(`Có ${headings.h1} thẻ H1 (nên chỉ có 1)`);
            }

            if (headings.h2 === 0) {
                suggestions.push('Nên có ít nhất 1 thẻ H2');
            }

            return {
                headings,
                suggestions,
                status
            };
        });

        let resultHTML = '<div class="heading-analysis">';
        Object.entries(result.headings).forEach(([tag, count]) => {
            const color = count > 0 ? (tag === 'h1' && count === 1 ? 'success' : 'info') : 'warning';
            resultHTML += `<div class="${color}"><strong>${tag.toUpperCase()}:</strong> ${count}</div>`;
        });
        resultHTML += '</div>';

        if (result.suggestions.length > 0) {
            resultHTML += '<div class="suggestions"><strong>Gợi ý:</strong><ul>';
            result.suggestions.forEach(suggestion => {
                resultHTML += `<li>${suggestion}</li>`;
            });
            resultHTML += '</ul></div>';
        }

        this.showResult(resultHTML);
    }

    async checkImageAltText() {
        this.showLoading();

        const result = await this.executeContentScript(() => {
            const images = document.querySelectorAll('img');
            let totalImages = images.length;
            let imagesWithAlt = 0;
            let imagesWithoutAlt = 0;

            images.forEach(img => {
                if (img.getAttribute('alt') && img.getAttribute('alt').trim() !== '') {
                    imagesWithAlt++;
                } else {
                    imagesWithoutAlt++;
                }
            });

            const percentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

            return {
                totalImages,
                imagesWithAlt,
                imagesWithoutAlt,
                percentage
            };
        });

        const statusClass = result.percentage === 100 ? 'success' : result.percentage >= 80 ? 'warning' : 'error';
        
        let resultHTML = `
            <div class="${statusClass}">
                <strong>Tổng số ảnh:</strong> ${result.totalImages}<br>
                <strong>Có Alt text:</strong> ${result.imagesWithAlt}<br>
                <strong>Không có Alt text:</strong> ${result.imagesWithoutAlt}<br>
                <strong>Tỷ lệ tối ưu:</strong> ${result.percentage}%
            </div>
        `;

        if (result.imagesWithoutAlt > 0) {
            resultHTML += `<div class="warning">⚠️ Có ${result.imagesWithoutAlt} ảnh chưa có Alt text</div>`;
        } else {
            resultHTML += '<div class="success">✅ Tất cả ảnh đều có Alt text!</div>';
        }

        this.showResult(resultHTML);
    }

    analyzeBacklinks() {
        this.showLoading();
        setTimeout(() => {
            const resultHTML = `
                <div class="info">
                    <strong>Phân tích Backlink:</strong><br>
                    Để phân tích chi tiết backlink, bạn cần sử dụng các công cụ chuyên nghiệp.
                </div>
                <div class="success">
                    <strong>Dịch vụ HapoDigital:</strong><br>
                    • Backlink từ 40+ trang báo uy tín<br>
                    • DA/PA cao, Trust Flow tốt<br>
                    • Anchor text đa dạng, tự nhiên<br>
                    • Báo cáo chi tiết hàng tháng
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <a href="https://hapodigital.com/mua-backlink/" target="_blank" rel="noopener" class="btn btn-primary" style="width: auto; padding: 8px 16px; font-size: 12px;">
                        Xem dịch vụ Backlink
                    </a>
                </div>
            `;
            this.showResult(resultHTML);
        }, 1500);
    }

    findBacklinkOpportunities() {
        this.showLoading();
        setTimeout(() => {
            const resultHTML = `
                <div class="info">
                    <strong>Cơ hội Backlink được đề xuất:</strong>
                </div>
                <div class="success">
                    <strong>1. Guest Post:</strong><br>
                    • Viết bài cho các blog cùng ngành<br>
                    • DA 15+ với traffic tốt
                </div>
                <div class="success">
                    <strong>2. PR Báo điện tử:</strong><br>
                    • Dantri, VnExpress, 24h<br>
                    • Zing, Kenh14, Eva.vn
                </div>
                <div class="success">
                    <strong>3. Social Backlink:</strong><br>
                    • Profile các mạng xã hội<br>
                    • Thư mục doanh nghiệp
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <a href="tel:0965899745" class="btn btn-contact" style="width: auto; padding: 8px 16px; font-size: 12px;">
                        Tư vấn miễn phí
                    </a>
                </div>
            `;
            this.showResult(resultHTML);
        }, 1500);
    }

    checkPageSpeed() {
        this.showLoading();
        setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const url = tabs[0].url;
                const resultHTML = `
                    <div class="info">
                        <strong>Kiểm tra tốc độ trang:</strong><br>
                        Đang phân tích ${url}
                    </div>
                    <div class="warning">
                        Để có kết quả chính xác nhất, hãy sử dụng Google PageSpeed Insights
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-primary" style="width: auto; padding: 8px 16px; font-size: 12px;">
                            Kiểm tra PageSpeed
                        </a>
                    </div>
                `;
                this.showResult(resultHTML);
            });
        }, 1000);
    }

    checkMobileFriendly() {
        this.showLoading();
        setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const url = tabs[0].url;
                const resultHTML = `
                    <div class="info">
                        <strong>Kiểm tra Mobile Friendly:</strong><br>
                        Phân tích khả năng tương thích mobile
                    </div>
                    <div class="success">
                        <strong>Công cụ kiểm tra của Google:</strong><br>
                        • Mobile-Friendly Test<br>
                        • Responsive design check<br>
                        • Core Web Vitals
                    </div>
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-success" style="width: auto; padding: 8px 16px; font-size: 12px;">
                            Test Mobile
                        </a>
                    </div>
                `;
                this.showResult(resultHTML);
            });
        }, 1000);
    }

    checkStructuredData() {
        this.showLoading();

        setTimeout(async () => {
            const result = await this.executeContentScript(() => {
                // Check for JSON-LD
                const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
                
                // Check for microdata
                const microdata = document.querySelectorAll('[itemscope]');
                
                // Check for Open Graph
                const ogTags = document.querySelectorAll('meta[property^="og:"]');
                
                // Check for Twitter Cards
                const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');

                return {
                    jsonLd: jsonLd.length,
                    microdata: microdata.length,
                    openGraph: ogTags.length,
                    twitterCards: twitterTags.length
                };
            });

            let resultHTML = '<div class="structured-data-analysis">';
            
            resultHTML += `<div class="${result.jsonLd > 0 ? 'success' : 'warning'}">
                <strong>JSON-LD:</strong> ${result.jsonLd} schema found
            </div>`;
            
            resultHTML += `<div class="${result.microdata > 0 ? 'success' : 'warning'}">
                <strong>Microdata:</strong> ${result.microdata} elements
            </div>`;
            
            resultHTML += `<div class="${result.openGraph > 0 ? 'success' : 'warning'}">
                <strong>Open Graph:</strong> ${result.openGraph} tags
            </div>`;
            
            resultHTML += `<div class="${result.twitterCards > 0 ? 'success' : 'warning'}">
                <strong>Twitter Cards:</strong> ${result.twitterCards} tags
            </div>`;

            resultHTML += '</div>';

            if (result.jsonLd === 0 && result.microdata === 0) {
                resultHTML += '<div class="error">⚠️ Không tìm thấy Structured Data</div>';
            }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const url = tabs[0].url;
                resultHTML += `
                    <div style="text-align: center; margin-top: 10px;">
                        <a href="https://search.google.com/structured-data/testing-tool?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" class="btn btn-primary" style="width: auto; padding: 8px 16px; font-size: 12px;">
                            Test Google
                        </a>
                    </div>
                `;
                this.showResult(resultHTML);
            });
        }, 1000);
    }

    loadSettings() {
        // Load saved settings from chrome.storage
        chrome.storage.sync.get(['hapoSettings'], (result) => {
            if (result.hapoSettings) {
                // Apply saved settings
                console.log('Loaded settings:', result.hapoSettings);
            }
        });
    }

    saveSettings() {
        const settings = {
            lastUsed: Date.now(),
            currentTab: this.currentTab
        };
        
        chrome.storage.sync.set({ hapoSettings: settings });
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HapoDigitalPopup();
});

// Save settings when popup is closed
window.addEventListener('beforeunload', () => {
    if (window.hapoPopup) {
        window.hapoPopup.saveSettings();
    }
});