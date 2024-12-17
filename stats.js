class PageViewTracker {
    constructor(pageId, apiEndpoint) {
        this.pageId = pageId;
        this.apiEndpoint = apiEndpoint;
        this.containerEl = null;
        this.updateInterval = null;
    }

    async initialize(containerId) {
        this.containerEl = document.getElementById(containerId);
        await this.trackPageView('enter');
        this.updateInterval = setInterval(() => this.updateStats(), 10000);
        window.addEventListener('beforeunload', async (event) => {
            event.preventDefault();
            await this.trackPageView('exit');
        });
        await this.updateStats();
    }

    async trackPageView(action) {
        try {
            const response = await fetch(
                `${this.apiEndpoint}?pageId=${this.pageId}&action=${action}`,
                { method: 'GET' }
            );
            return await response.json();
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
    }
}