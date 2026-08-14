/* 
  Home Tuition Management Agency - Dashboard JS
  Handles: Charts (Tuition Sessions), Session Logs, Tab Switching, 
  New Assignment Creation, Live Chat, CSV Export, Filtering & Dark/RTL Mode
*/

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initSessionChart();
    initTabSwitching();
    initNewAssignmentModal();
    initLiveChat();
    initExportCsv();
    initDownloadReport();
    initLogFilters();
});

// Helper: Show Bootstrap Toast Notification
const showToast = (title, message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const iconClass = type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-info-circle-fill text-primary';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" style="border-radius: 12px; background: var(--bg-surface, #fff); color: var(--text-dark, #333);">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-3 py-3">
                    <i class="bi ${iconClass} fs-4"></i>
                    <div>
                        <strong class="d-block mb-1">${title}</strong>
                        <span class="small text-muted">${message}</span>
                    </div>
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    if (toastEl && typeof bootstrap !== 'undefined') {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
};

// Mobile Sidebar & Backdrop Handler
const initSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.querySelector('.sidebar-backdrop');
    const toggles = document.querySelectorAll('.sidebar-toggle');

    const toggleSidebar = () => {
        if (!sidebar) return;
        const isActive = sidebar.classList.toggle('active');
        if (backdrop) {
            if (isActive) {
                backdrop.classList.add('show');
            } else {
                backdrop.classList.remove('show');
            }
        }
    };

    if (toggles.length > 0 && sidebar) {
        toggles.forEach(toggle => {
            toggle.addEventListener('click', toggleSidebar);
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('active');
            backdrop.classList.remove('show');
        });
    }
};

// Tuition Sessions Completion Chart (Interactive Multi-range)
let sessionChart = null;
let currentChartRange = 'week';

const chartDataMap = {
    week: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        completed: [6, 8, 7, 10, 12, 14, 9],
        scheduled: [7, 9, 8, 11, 13, 14, 10],
        totalCompleted: '66',
        totalScheduled: '72',
        rate: '91.6%',
        peak: 'Sat (14/day)'
    },
    month: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        completed: [58, 66, 72, 80],
        scheduled: [62, 70, 75, 84],
        totalCompleted: '276',
        totalScheduled: '291',
        rate: '94.8%',
        peak: 'Week 4 (80/wk)'
    },
    quarter: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        completed: [210, 245, 276, 310, 295, 340],
        scheduled: [225, 260, 291, 325, 310, 350],
        totalCompleted: '1,676',
        totalScheduled: '1,761',
        rate: '95.2%',
        peak: 'Jun (340/mo)'
    }
};

const initSessionChart = () => {
    const canvas = document.getElementById('sessionChart');
    if (!canvas) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#B2BEC3' : '#636E72';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

    if (typeof Chart !== 'undefined') {
        if (sessionChart) {
            sessionChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#2563eb';
        const infoColor = '#0284c7';

        // Gradients
        const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient1.addColorStop(0, 'rgba(37, 99, 235, 0.35)');
        gradient1.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

        const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
        gradient2.addColorStop(0, 'rgba(2, 132, 199, 0.15)');
        gradient2.addColorStop(1, 'rgba(2, 132, 199, 0.0)');

        const activeData = chartDataMap[currentChartRange] || chartDataMap.week;

        // Update Summary Headers
        const completedEl = document.getElementById('trendCompletedCount');
        const scheduledEl = document.getElementById('trendScheduledCount');
        const rateEl = document.getElementById('trendCompletionRate');
        const peakEl = document.getElementById('trendPeakDay');

        if (completedEl) completedEl.innerHTML = `${activeData.totalCompleted} <small class="fs-6 text-gray fw-normal">sessions</small>`;
        if (scheduledEl) scheduledEl.innerHTML = `${activeData.totalScheduled} <small class="fs-6 text-gray fw-normal">sessions</small>`;
        if (rateEl) rateEl.textContent = activeData.rate;
        if (peakEl) peakEl.textContent = activeData.peak;

        sessionChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: activeData.labels,
                datasets: [
                    {
                        label: 'Completed Sessions',
                        data: activeData.completed,
                        borderColor: primaryColor,
                        backgroundColor: gradient1,
                        borderWidth: 3,
                        pointBackgroundColor: primaryColor,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Scheduled Sessions',
                        data: activeData.scheduled,
                        borderColor: infoColor,
                        backgroundColor: gradient2,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointBackgroundColor: infoColor,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#ffffff',
                        titleColor: isDark ? '#F1F5F9' : '#0F172A',
                        bodyColor: isDark ? '#CBD5E1' : '#475569',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        borderWidth: 1,
                        padding: 14,
                        boxPadding: 6,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y} sessions`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { family: 'Nunito, sans-serif', size: 12 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'Nunito, sans-serif', size: 12 } }
                    }
                }
            }
        });
    }
};

// Bind Range Filter Buttons
document.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('#chartFilterGroup button');
    if (filterBtn) {
        const range = filterBtn.getAttribute('data-range');
        if (range && chartDataMap[range]) {
            currentChartRange = range;

            const groupBtns = document.querySelectorAll('#chartFilterGroup button');
            groupBtns.forEach(btn => {
                btn.classList.remove('btn-primary', 'active');
                btn.classList.add('btn-outline-secondary', 'border-0');
            });
            filterBtn.classList.remove('btn-outline-secondary', 'border-0');
            filterBtn.classList.add('btn-primary', 'active');

            initSessionChart();
        }
    }
});

// Re-init chart on Theme attribute mutation
const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme' || mutation.attributeName === 'dir') {
            initSessionChart();
        }
    });
});
themeObserver.observe(document.documentElement, { attributes: true });

// Dashboard Section / Tab Switching
const initTabSwitching = () => {
    const links = document.querySelectorAll('.sidebar-nav .nav-link');
    const sections = document.querySelectorAll('.dashboard-section');

    const switchTab = (targetId) => {
        if (!targetId) return;

        const targetSection = document.getElementById(targetId);
        const targetLink = document.querySelector(`.sidebar-nav .nav-link[href="#${targetId}"]`);

        if (targetSection) {
            links.forEach(l => l.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            targetSection.classList.add('active');
            if (targetLink) targetLink.classList.add('active');

            // Re-init chart if switching back to overview
            if (targetId === 'overview') {
                setTimeout(initSessionChart, 100);
            }
        }
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);

                history.pushState(null, null, '#' + targetId);
                switchTab(targetId);
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Auto-close sidebar on mobile
                const sidebar = document.querySelector('.sidebar');
                const backdrop = document.querySelector('.sidebar-backdrop');
                if (window.innerWidth < 992 && sidebar && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                    if (backdrop) backdrop.classList.remove('show');
                }
            }
        });
    });

    // Load initial tab from hash or default to overview
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        switchTab(initialHash);
        // Force scroll to top to prevent browser's native anchor jump on load
        setTimeout(() => window.scrollTo(0, 0), 0);
    }
};

// New Assignment Form Submission Modal
const initNewAssignmentModal = () => {
    const form = document.getElementById('newAssignmentForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const studentName = document.getElementById('studentName')?.value.trim();
        const tutorName = document.getElementById('tutorName')?.value.trim();
        const subject = document.getElementById('subjectSelect')?.value.trim();
        const rate = document.getElementById('sessionRate')?.value.trim();
        const schedule = document.getElementById('sessionSchedule')?.value.trim();

        if (!studentName || !tutorName || !subject) return;

        // 1. Add Row to Recent Session Logs Table
        const recentLogsTable = document.getElementById('recentLogsTable');
        if (recentLogsTable) {
            const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const newRowHTML = `
                <tr class="table-success bg-opacity-10">
                    <td class="p-3 fw-medium">${dateStr}</td>
                    <td class="p-3 text-gray">${tutorName}</td>
                    <td class="p-3 text-gray">${studentName} (${subject})</td>
                    <td class="p-3"><span class="badge bg-primary-subtle text-primary px-3">Assigned</span></td>
                </tr>
            `;
            recentLogsTable.insertAdjacentHTML('afterbegin', newRowHTML);
        }

        // 2. Add Item to Today's Schedule
        const todaysScheduleList = document.getElementById('todaysScheduleList');
        if (todaysScheduleList) {
            const newItemHTML = `<li class="mb-2"><i class="bi bi-clock-history text-primary me-2"></i> ${schedule} - ${studentName} (${subject}) - ${tutorName}</li>`;
            todaysScheduleList.insertAdjacentHTML('afterbegin', newItemHTML);
        }

        // 3. Update Stat Counts
        const activeSessionsEl = document.getElementById('activeSessionsCount');
        if (activeSessionsEl) {
            let count = parseInt(activeSessionsEl.textContent) || 45;
            activeSessionsEl.textContent = count + 1;
        }

        const pendingAssignmentsEl = document.getElementById('pendingAssignmentsCount');
        if (pendingAssignmentsEl) {
            let count = parseInt(pendingAssignmentsEl.textContent) || 12;
            if (count > 0) pendingAssignmentsEl.textContent = count - 1;
        }

        // 4. Hide Modal
        const modalEl = document.getElementById('newAssignmentModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }

        // Reset form & Notify
        form.reset();
        showToast('Assignment Created!', `Successfully matched ${studentName} with ${tutorName} for ${subject} ($${rate}/hr).`);
    });
};

// Live Chat Sending Functionality
const initLiveChat = () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');

    if (!chatForm || !chatInput || !chatBody) return;

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // User Sent Bubble
        const sentBubble = document.createElement('div');
        sentBubble.className = 'chat-bubble sent';
        sentBubble.innerHTML = `
            ${escapeHTML(messageText)}
            <div class="small mt-1 opacity-50">${timeStr}</div>
        `;
        chatBody.appendChild(sentBubble);

        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Auto-reply Simulation
        setTimeout(() => {
            const replies = [
                "Thank you for the update! I will coordinate with the tutor right away.",
                "Sounds great! Please let me know if we need to adjust next week's schedule.",
                "Received! I will verify the invoice details with our accounts team."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const receivedBubble = document.createElement('div');
            receivedBubble.className = 'chat-bubble received';
            receivedBubble.innerHTML = `
                ${randomReply}
                <div class="small mt-1 opacity-50">${replyTime}</div>
            `;
            chatBody.appendChild(receivedBubble);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1200);
    });
};

// Export CSV for Session Logs
const initExportCsv = () => {
    const btn = document.getElementById('btnExportCsv');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const rows = [
            ['Date', 'Subject', 'Tutor', 'Duration', 'Rating', 'Feedback'],
            ['Mar 21, 2026', 'Math', 'Alan Smith', '2.0h', '5/5', 'Excellent progress on Calculus.'],
            ['Mar 20, 2026', 'Science', 'Sarah Jenkins', '1.5h', '4/5', 'Needs more focus on Chemistry basics.'],
            ['Mar 19, 2026', 'English', 'Michael Chang', '1.0h', '5/5', 'Great essay writing practice.'],
            ['Mar 18, 2026', 'Spanish', 'Elena Rodriguez', '2.0h', '4/5', 'Conversational skills improving.']
        ];

        let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tuition_session_logs_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('CSV Exported', 'Session logs downloaded to your device.');
    });
};

// Download Strategic Report
const initDownloadReport = () => {
    const btn = document.getElementById('btnDownloadReport');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const reportContent = "COORDINATOR MATCHING REPORT\n" +
            "===========================\n" +
            "Active Weekly Sessions: 45\n" +
            "Pending Matches: 12\n" +
            "Avg Tutor Rating: 4.8 / 5.0\n" +
            "Matching Completion Rate: 75%\n\n" +
            "STRATEGIC RECOMMENDATIONS:\n" +
            "1. Priority match for Mathematics students with Dr. Alan Smith.\n" +
            "2. Offer 30-minute trial sessions for new requests.\n";

        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `coordinator_report_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Report Downloaded', 'Strategic summary downloaded successfully.');
    });
};

// Filter Session Logs
const initLogFilters = () => {
    const filterForm = document.getElementById('filterLogsForm');
    const resetBtn = document.getElementById('resetFilterBtn');
    const detailedLogsTable = document.getElementById('detailedLogsTable');

    if (!filterForm || !detailedLogsTable) return;

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const subjectVal = document.getElementById('filterSubject')?.value;
        const statusVal = document.getElementById('filterStatus')?.value;

        const trs = detailedLogsTable.querySelectorAll('tr');
        let visibleCount = 0;

        trs.forEach(tr => {
            const subjectTd = tr.children[1]?.textContent.trim();
            const feedbackTd = tr.children[5]?.textContent.trim();

            let matchesSubject = (subjectVal === 'all' || subjectTd === subjectVal);
            let matchesStatus = true;

            if (statusVal === 'Completed') {
                matchesStatus = !feedbackTd.includes('Needs');
            } else if (statusVal === 'Pending Feedback') {
                matchesStatus = feedbackTd.includes('Needs');
            }

            if (matchesSubject && matchesStatus) {
                tr.style.display = '';
                visibleCount++;
            } else {
                tr.style.display = 'none';
            }
        });

        const modalEl = document.getElementById('filterLogsModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
        }

        showToast('Filter Applied', `Showing ${visibleCount} matching session log(s).`);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            filterForm.reset();
            const trs = detailedLogsTable.querySelectorAll('tr');
            trs.forEach(tr => tr.style.display = '');
            showToast('Filter Reset', 'Showing all session logs.');
        });
    }
};

// Utility: HTML Escaping
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
