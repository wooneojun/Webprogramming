class PageViewTracker {
    constructor(pageId, apiEndpoint) {
        this.pageId = pageId;
        this.apiEndpoint = apiEndpoint;
        this.containerEl = null;
        this.updateInterval = null;
        this.isActive = false;
        this.isRefreshing = false;
    }

    async initialize(containerId) {
        this.containerEl = document.getElementById(containerId);
        this.isActive = true;
        await this.trackPageView('enter');
        this.updateInterval = setInterval(() => this.updateStats(), 10000);
        
        // 새로고침 감지를 위한 performance 엔트리 감시
        if (window.performance) {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            if (navigationEntry && navigationEntry.type === 'reload') {
                this.handleExit();
                await new Promise(resolve => setTimeout(resolve, 100));  // exit 요청이 완료될 시간을 줌
            }
        }

        // 페이지 나가기 이벤트
        window.addEventListener('beforeunload', (event) => {
            if (!this.isRefreshing) {
                this.handleExit();
            }
        });
        
        // 페이지 숨김/표시 이벤트
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isActive) {
                this.handleExit();
                this.isActive = false;
            } else if (!document.hidden && !this.isActive) {
                this.handleEnter();
                this.isActive = true;
            }
        });

        // 새로고침 감지
        window.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                this.isRefreshing = true;
                this.handleExit();
            }
        });
        
        await this.updateStats();
    }

    handleExit() {
        const exitRequest = new XMLHttpRequest();
        exitRequest.open('GET', `${this.apiEndpoint}?pageId=${this.pageId}&action=exit`, false);
        try {
            exitRequest.send();
            console.log('Exit request sent successfully');
        } catch (e) {
            console.error('Failed to send exit request:', e);
        }
    }

    async handleEnter() {
        try {
            await this.trackPageView('enter');
            await this.updateStats();
            console.log('Enter request sent successfully');
        } catch (e) {
            console.error('Failed to send enter request:', e);
        }
    }

    async trackPageView(action) {
        try {
            console.log(`Sending ${action} request`);
            const response = await fetch(
                `${this.apiEndpoint}?pageId=${this.pageId}&action=${action}`,
                { method: 'GET' }
            );
            const data = await response.json();
            console.log(`${action} response:`, data);
            return data;
        } catch (error) {
            console.error('Failed to track page view:', error);
            return { activeUsers: 0, totalViews: 0 };
        }
    }

    async updateStats() {
        try {
            const stats = await this.trackPageView('get');
            if (this.containerEl) {
                this.containerEl.innerHTML = `
                    <div class="stats-container">
                        <div class="stat-item">
                            <span class="stat-label">현재 접속자:</span>
                            <span class="stat-value">${stats.activeUsers}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">총 조회수:</span>
                            <span class="stat-value">${stats.totalViews}</span>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.handleExit();
    }
}