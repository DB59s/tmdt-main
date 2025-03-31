const RefundStatusBadge = ({ status }) => {
    let badgeClass = '';
    
    switch (status) {
        case 'Đang xử lý':
            badgeClass = 'bg-info';
            break;
        case 'Đã hoàn tiền':
            badgeClass = 'bg-success';
            break;
        case 'Từ chối':
            badgeClass = 'bg-danger';
            break;
        default:
            badgeClass = 'bg-dark';
            break;
    }

    return (
        <span className={`badge ${badgeClass}`}>
            {status}
        </span>
    );
};

export default RefundStatusBadge; 