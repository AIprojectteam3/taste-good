/**
 * 포인트 로그 모달창 관리 클래스
 * 재사용 가능한 포인트 로그 조회 및 표시 기능 제공
 */
class PointLogModal {
    constructor(options = {}) {
        this.options = {
            modalId: options.modalId || 'pointLogModal',
            triggerId: options.triggerId || 'pointLogBtn',
            apiBaseUrl: options.apiBaseUrl || '/api',
            itemsPerPage: options.itemsPerPage || 20,
            ...options
        };
        
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.totalPages = 0;
        this.isLoading = false;
        
        this.init();
    }

    /**
     * 모달창 초기화
     */
    init() {
        this.createModalHTML();
        this.bindEvents();
    }

    /**
     * 모달창 HTML 생성
     */
    createModalHTML() {
        const modalHTML = `
            <div id="${this.options.modalId}" class="point-modal" style="display: none;">
                <div class="point-modal-overlay">
                    <div class="point-modal-content">
                        <div class="point-modal-header">
                            <h2>포인트 로그</h2>
                            <button class="point-modal-close">&times;</button>
                        </div>
                        
                        <div class="point-modal-body">
                            <!-- 포인트 통계 섹션 -->
                            <div class="point-stats-section">
                                <div class="point-stats-loading">통계 로딩 중...</div>
                                <div class="point-stats-content" style="display: none;">
                                    <div class="current-points">
                                        <span class="label">현재 포인트:</span>
                                        <span class="value" id="currentPointsValue">0</span>점
                                    </div>
                                    <div class="total-earned">
                                        <span class="label">총 획득 포인트:</span>
                                        <span class="value" id="totalEarnedValue">0</span>점
                                    </div>
                                </div>
                            </div>

                            <!-- 필터 섹션 -->
                            <div class="point-filter-section">
                                <label for="actionTypeFilter">활동 유형:</label>
                                <select id="actionTypeFilter">
                                    <option value="all">전체</option>
                                    <option value="POST_CREATE">게시물 작성</option>
                                    <option value="COMMENT_CREATE">댓글 작성</option>
                                </select>
                            </div>

                            <!-- 로그 목록 섹션 -->
                            <div class="point-logs-section">
                                <div class="point-logs-loading">로그 로딩 중...</div>
                                <div class="point-logs-content">
                                    <div class="point-logs-list" id="pointLogsList">
                                        <!-- 로그 항목들이 여기에 동적으로 추가됩니다 -->
                                    </div>
                                </div>
                            </div>

                            <!-- 페이지네이션 -->
                            <div class="point-pagination" id="pointPagination" style="display: none;">
                                <button id="prevPageBtn" class="page-btn">이전</button>
                                <span id="pageInfo">1 / 1</span>
                                <button id="nextPageBtn" class="page-btn">다음</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 기존 모달이 있으면 제거
        const existingModal = document.getElementById(this.options.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        // 새 모달 추가
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // CSS 스타일 추가
        this.addStyles();
    }

    /**
     * CSS 스타일 추가
     */
    addStyles() {
        const styleId = 'pointLogModalStyles';
        if (document.getElementById(styleId)) return;

        const styles = `
            <style id="${styleId}">
                .point-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                }

                .point-modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }

                .point-modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease-out;
                }

                .point-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                    background: #f8f9fa;
                }

                .point-modal-header h2 {
                    margin: 0;
                    color: #333;
                    font-size: 1.5rem;
                }

                .point-modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .point-modal-close:hover {
                    background-color: #f0f0f0;
                    color: #333;
                }

                .point-modal-body {
                    padding: 20px;
                    max-height: calc(90vh - 80px);
                    overflow-y: auto;
                }

                .point-stats-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .point-stats-content {
                    display: flex;
                    justify-content: space-around;
                    text-align: center;
                }

                .current-points, .total-earned {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .current-points .label, .total-earned .label {
                    font-size: 0.9rem;
                    opacity: 0.9;
                }

                .current-points .value, .total-earned .value {
                    font-size: 1.5rem;
                    font-weight: bold;
                }

                .point-filter-section {
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .point-filter-section select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                }

                .point-logs-section {
                    min-height: 200px;
                }

                .point-logs-loading, .point-stats-loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                .point-log-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px;
                    border: 1px solid #eee;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    transition: all 0.2s;
                }

                .point-log-item:hover {
                    background-color: #f8f9fa;
                    border-color: #ddd;
                }

                .point-log-info {
                    flex: 1;
                }

                .point-log-action {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }

                .point-log-description {
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 5px;
                }

                .point-log-date {
                    color: #999;
                    font-size: 0.8rem;
                }

                .point-log-points {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #28a745;
                    text-align: right;
                }

                .point-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }

                .page-btn {
                    padding: 8px 16px;
                    border: 1px solid #ddd;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .page-btn:hover:not(:disabled) {
                    background-color: #f8f9fa;
                    border-color: #adb5bd;
                }

                .page-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                #pageInfo {
                    font-weight: bold;
                    color: #333;
                }

                .no-logs {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .point-modal-content {
                        margin: 10px;
                        max-height: calc(100vh - 20px);
                    }
                    
                    .point-stats-content {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .point-log-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                    
                    .point-log-points {
                        align-self: flex-end;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        const modal = document.getElementById(this.options.modalId);
        const trigger = document.getElementById(this.options.triggerId);
        const closeBtn = modal.querySelector('.point-modal-close');
        const overlay = modal.querySelector('.point-modal-overlay');
        const filterSelect = modal.querySelector('#actionTypeFilter');
        const prevBtn = modal.querySelector('#prevPageBtn');
        const nextBtn = modal.querySelector('#nextPageBtn');

        // 모달 열기
        if (trigger) {
            trigger.addEventListener('click', () => this.open());
        }

        // 모달 닫기
        closeBtn.addEventListener('click', () => this.close());
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.close();
            }
        });

        // 필터 변경
        filterSelect.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.currentPage = 1;
            this.loadLogs();
        });

        // 페이지네이션
        prevBtn.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadLogs();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadLogs();
            }
        });
    }

    /**
     * 모달창 열기
     */
    async open() {
        const modal = document.getElementById(this.options.modalId);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 데이터 로드
        await this.loadStats();
        await this.loadLogs();
    }

    /**
     * 모달창 닫기
     */
    close() {
        const modal = document.getElementById(this.options.modalId);
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    /**
     * 포인트 통계 로드
     */
    async loadStats() {
        const statsLoading = document.querySelector('.point-stats-loading');
        const statsContent = document.querySelector('.point-stats-content');
        
        try {
            statsLoading.style.display = 'block';
            statsContent.style.display = 'none';

            const response = await fetch(`${this.options.apiBaseUrl}/user/point-stats`);
            const data = await response.json();

            if (response.ok) {
                document.getElementById('currentPointsValue').textContent = 
                    data.currentPoints.toLocaleString();
                document.getElementById('totalEarnedValue').textContent = 
                    data.totalEarned.toLocaleString();
                
                statsLoading.style.display = 'none';
                statsContent.style.display = 'flex';
            } else {
                throw new Error(data.message || '통계 로드 실패');
            }
        } catch (error) {
            console.error('포인트 통계 로드 오류:', error);
            statsLoading.textContent = '통계 로드 실패';
        }
    }

    /**
     * 포인트 로그 로드
     */
    async loadLogs() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const logsLoading = document.querySelector('.point-logs-loading');
        const logsList = document.getElementById('pointLogsList');
        
        try {
            logsLoading.style.display = 'block';
            logsList.innerHTML = '';

            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.options.itemsPerPage
            });

            if (this.currentFilter !== 'all') {
                params.append('actionType', this.currentFilter);
            }

            const response = await fetch(`${this.options.apiBaseUrl}/user/point-logs?${params}`);
            const data = await response.json();

            if (response.ok) {
                this.renderLogs(data.logs);
                this.updatePagination(data.pagination);
                logsLoading.style.display = 'none';
            } else {
                throw new Error(data.message || '로그 로드 실패');
            }
        } catch (error) {
            console.error('포인트 로그 로드 오류:', error);
            logsLoading.textContent = '로그 로드 실패';
            logsList.innerHTML = '<div class="no-logs">로그를 불러올 수 없습니다.</div>';
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 로그 목록 렌더링
     */
    renderLogs(logs) {
        const logsList = document.getElementById('pointLogsList');
        
        if (logs.length === 0) {
            logsList.innerHTML = '<div class="no-logs">포인트 로그가 없습니다.</div>';
            return;
        }

        const logsHTML = logs.map(log => this.createLogItemHTML(log)).join('');
        logsList.innerHTML = logsHTML;
    }

    /**
     * 로그 항목 HTML 생성
     */
    createLogItemHTML(log) {
        const actionTypeMap = {
            'POST_CREATE': '게시물 작성',
            'COMMENT_CREATE': '댓글 작성'
        };

        const actionText = actionTypeMap[log.action_type] || log.action_type;
        const date = new Date(log.created_at).toLocaleString('ko-KR');
        
        let description = log.description;
        if (log.post_title) {
            description += ` - "${log.post_title}"`;
        }
        if (log.comment_text) {
            const shortComment = log.comment_text.length > 30 
                ? log.comment_text.substring(0, 30) + '...' 
                : log.comment_text;
            description += ` - "${shortComment}"`;
        }

        return `
            <div class="point-log-item">
                <div class="point-log-info">
                    <div class="point-log-action">${actionText}</div>
                    <div class="point-log-description">${description}</div>
                    <div class="point-log-date">${date}</div>
                </div>
                <div class="point-log-points">+${log.points}</div>
            </div>
        `;
    }

    /**
     * 페이지네이션 업데이트
     */
    updatePagination(pagination) {
        const paginationDiv = document.getElementById('pointPagination');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        const pageInfo = document.getElementById('pageInfo');

        this.totalPages = pagination.totalPages;

        if (pagination.totalPages > 1) {
            paginationDiv.style.display = 'flex';
            pageInfo.textContent = `${pagination.currentPage} / ${pagination.totalPages}`;
            
            prevBtn.disabled = pagination.currentPage <= 1;
            nextBtn.disabled = pagination.currentPage >= pagination.totalPages;
        } else {
            paginationDiv.style.display = 'none';
        }
    }

    /**
     * 모달창 제거
     */
    destroy() {
        const modal = document.getElementById(this.options.modalId);
        const styles = document.getElementById('pointLogModalStyles');
        
        if (modal) modal.remove();
        if (styles) styles.remove();
    }
}

// 전역 사용을 위한 팩토리 함수
window.createPointLogModal = function(options) {
    return new PointLogModal(options);
};

// 기본 인스턴스 생성 (옵션)
window.pointLogModal = new PointLogModal();