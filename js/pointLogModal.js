/**
 * 포인트 로그 모달창 관리 클래스
 * 재사용 가능한 포인트 로그 조회 및 표시 기능 제공
 */
class PointLogModal {
    constructor(options = {}) {
        this.options = {
            modalId: options.modalId || 'pointLogModal',
            triggerId: options.triggerId || 'pointLogBtn',
            triggerClass: options.triggerClass || 'point-log-trigger',
            apiBaseUrl: options.apiBaseUrl || '/api',
            itemsPerPage: options.itemsPerPage || 20,
            ...options
        };
        
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.currentPointTypeFilter = 'all'; // 새로 추가: 적립/차감 필터
        this.totalPages = 0;
        this.isLoading = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
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
        if (!document.body) {
            console.error('document.body가 아직 로드되지 않았습니다.');
            return;
        }

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
                                        <span class="value" id="totalEarnedValue">0</span>점
                                    </div>
                                    <div class="total-earned">
                                        <span class="label">총 획득 포인트:</span>
                                        <span class="value" id="currentPointsValue">0</span>점
                                    </div>
                                </div>
                            </div>

                            <!-- 필터 섹션 -->
                            <div class="point-filter-section">
                                <div class="filter-row">
                                    <div class="filter_group">
                                        <label for="pointTypeFilter">포인트 유형:</label>
                                        <select id="pointTypeFilter">
                                            <option value="all">전체</option>
                                            <option value="earned">적립</option>
                                            <option value="spent">차감</option>
                                        </select>
                                    </div>
                                    <div class="filter_group">
                                        <label for="actionTypeFilter">활동 유형:</label>
                                        <select id="actionTypeFilter">
                                            <option value="all">전체</option>
                                            <option value="POST_CREATE">게시물 작성</option>
                                            <option value="COMMENT_CREATE">댓글 작성</option>
                                            <option value="attendance">출석체크</option>
                                        </select>
                                    </div>
                                </div>
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

        const existingModal = document.getElementById(this.options.modalId);
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
                    background: linear-gradient(135deg, #ff6f61 0%, #e65a50 100%);
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
                }

                .filter-row {
                    display: flex;
                    gap: 20px;
                    flex-wrap: wrap;
                }

                .filter_group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .filter_group label {
                    font-weight: 500;
                    color: #333;
                    white-space: nowrap;
                }

                .filter_group select {
                    padding: 4px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 14px;
                    min-width: 120px;
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

                .point-log-item.earned {
                    border-left: 4px solid #28a745;
                }

                .point-log-item.spent {
                    border-left: 4px solid #dc3545;
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
                    text-align: right;
                }

                .point-log-points.earned {
                    color: #28a745;
                }

                .point-log-points.spent {
                    color: #dc3545;
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
                    
                    .filter-row {
                        flex-direction: column;
                        gap: 10px;
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
        if (!modal) {
            console.error('모달 요소를 찾을 수 없습니다.');
            return;
        }

        // 트리거 이벤트 바인딩
        this.bindTriggerEvents();

        const closeBtn = modal.querySelector('.point-modal-close');
        const overlay = modal.querySelector('.point-modal-overlay');
        const pointTypeFilter = modal.querySelector('#pointTypeFilter');
        const actionTypeFilter = modal.querySelector('#actionTypeFilter');
        const prevBtn = modal.querySelector('#prevPageBtn');
        const nextBtn = modal.querySelector('#nextPageBtn');

        // 모달 닫기
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                this.close();
            }
        });

        // 포인트 유형 필터 변경
        if (pointTypeFilter) {
            pointTypeFilter.addEventListener('change', (e) => {
                this.currentPointTypeFilter = e.target.value;
                this.currentPage = 1;
                this.loadLogs();
            });
        }

        // 활동 유형 필터 변경
        if (actionTypeFilter) {
            actionTypeFilter.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.currentPage = 1;
                this.loadLogs();
            });
        }

        // 페이지네이션
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadLogs();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.loadLogs();
                }
            });
        }
    }

    /**
     * 트리거 이벤트 바인딩
     */
    bindTriggerEvents() {
        // 1. 단일 ID 트리거
        if (typeof this.options.triggerId === 'string') {
            const trigger = document.getElementById(this.options.triggerId);
            if (trigger) {
                trigger.addEventListener('click', () => this.open());
            }
        }

        // 2. 다중 ID 트리거 (배열)
        if (Array.isArray(this.options.triggerId)) {
            this.options.triggerId.forEach(id => {
                const trigger = document.getElementById(id);
                if (trigger) {
                    trigger.addEventListener('click', () => this.open());
                }
            });
        }

        // 3. 클래스 기반 트리거
        const classTriggers = document.querySelectorAll(`.${this.options.triggerClass}`);
        classTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => this.open());
        });

        // 4. 데이터 속성 기반 트리거
        const dataTriggers = document.querySelectorAll('[data-modal="point-log"]');
        dataTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => this.open());
        });
    }

    /**
     * 모달창 열기
     */
    async open() {
        const modal = document.getElementById(this.options.modalId);
        if (!modal) {
            console.error('모달을 찾을 수 없습니다.');
            return;
        }
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        await this.loadStats();
        await this.loadLogs();
    }

    /**
     * 모달창 닫기
     */
    close() {
        const modal = document.getElementById(this.options.modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * 포인트 통계 로드
     */
    async loadStats() {
        const statsLoading = document.querySelector('.point-stats-loading');
        const statsContent = document.querySelector('.point-stats-content');
        
        if (!statsLoading || !statsContent) return;
        
        try {
            statsLoading.style.display = 'block';
            statsContent.style.display = 'none';

            const response = await fetch(`${this.options.apiBaseUrl}/user/point-stats`);
            const data = await response.json();

            if (response.ok) {
                const currentPointsEl = document.getElementById('currentPointsValue');
                const totalEarnedEl = document.getElementById('totalEarnedValue');
                
                if (currentPointsEl) currentPointsEl.textContent = data.currentPoints.toLocaleString();
                if (totalEarnedEl) totalEarnedEl.textContent = data.totalEarned.toLocaleString();
                
                statsLoading.style.display = 'none';
                statsContent.style.display = 'flex';
            } else {
                throw new Error(data.message || '통계 로드 실패');
            }
        } catch (error) {
            console.error('포인트 통계 로드 오류:', error);
            if (statsLoading) statsLoading.textContent = '통계 로드 실패';
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

            if (this.currentPointTypeFilter !== 'all') {
                params.append('pointType', this.currentPointTypeFilter);
            }

            const response = await fetch(`${this.options.apiBaseUrl}/user/point-logs?${params}`);
            
            // 응답 상태 확인
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Content-Type 확인
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('서버에서 JSON이 아닌 응답을 받았습니다:', text);
                throw new Error('서버에서 올바르지 않은 응답을 받았습니다.');
            }

            const data = await response.json();

            if (data.success) {
                this.renderLogs(data.logs);
                this.updatePagination(data.pagination);
                logsLoading.style.display = 'none';
            } else {
                throw new Error(data.message || '로그 로드 실패');
            }
        } catch (error) {
            console.error('포인트 로그 로드 오류:', error);
            if (logsLoading) {
                logsLoading.textContent = `로그 로드 실패: ${error.message}`;
            }
            if (logsList) {
                logsList.innerHTML = `<div class="error-message">포인트 로그를 불러올 수 없습니다: ${error.message}</div>`;
            }
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 로그 목록 렌더링
     */
    renderLogs(logs) {
        const logsList = document.getElementById('pointLogsList');
        if (!logsList) return;
        
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
            'COMMENT_CREATE': '댓글 작성',
            'attendance_check_in': '출석체크',
            'TAMAGOTCHI_FEED': '다마고치-먹이주기',
            'TAMAGOTCHI_CARE': '다마고치-돌보기',
            'TAMAGOTCHI_PLAY': '다마고치-놀아주기'
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

        // 포인트 유형 판별 (양수면 적립, 음수면 차감)
        const isEarned = log.points > 0;
        const pointClass = isEarned ? 'earned' : 'spent';
        const pointPrefix = isEarned ? '+' : '';

        return `
            <div class="point-log-item ${pointClass}">
                <div class="point-log-info">
                    <div class="point-log-action">${actionText}</div>
                    <div class="point-log-description">${description}</div>
                    <div class="point-log-date">${date}</div>
                </div>
                <div class="point-log-points ${pointClass}">${pointPrefix}${log.points}</div>
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

        if (!paginationDiv || !prevBtn || !nextBtn || !pageInfo) return;

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

// DOM이 로드된 후 기본 인스턴스 생성
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.pointLogModal = new PointLogModal();
    });
} else {
    window.pointLogModal = new PointLogModal();
}