const ReturnStatusBadge = ({ status }) => {
    let badgeClass = '';
    
    const statusLabels = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'approved': 'Đã chấp nhận',
        'completed': 'Hoàn thành',
        'rejected': 'Từ chối'
    };
    
    switch (status) {
        case 'pending':
            badgeClass = 'bg-warning';
            break;
        case 'processing':
            badgeClass = 'bg-info';
            break;
        case 'approved':
            badgeClass = 'bg-primary';
            break;
        case 'completed':
            badgeClass = 'bg-success';
            break;
        case 'rejected':
            badgeClass = 'bg-danger';
            break;
        default:
            badgeClass = 'bg-dark';
            break;
    }

    return (
        <span className={`badge ${badgeClass}`}>
            {statusLabels[status] || status}
        </span>
    );
};

export default ReturnStatusBadge; 