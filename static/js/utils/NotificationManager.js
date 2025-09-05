const NOTIFICATION_TYPES = {
    info:   'alert-info',
    success:'alert-success',
    warning:'alert-warning',
    danger: 'alert-danger'
};

function showNotification(message, type = 'info', options = {}) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    let timestampHtml = '';
    if (options.timestamp) timestampHtml = `<div class="text-end text-muted small mt-1">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>`;

    const notification = document.createElement('div');
    notification.className = `notification alert ${NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        <span>${message}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        ${timestampHtml}
    `;

    // Remove notification on close
    notification.querySelector('.btn-close').onclick = () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 200);
    };

    container.appendChild(notification);

    // Auto-dismiss after timeout (default 4s for info/success, 8s for warning, never for danger unless specified)
    let timeout = options.timeout;
    if (timeout === undefined) {
        timeout = (type === 'warning') ? 8000 : (type === 'danger' ? null : 4000);
    }
    if (timeout) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 200);
        }, timeout);
    }
}
