const ReturnTypeBadge = ({ type }) => {
    let badgeClass = '';
    
    const requestTypeLabels = {
        'refund': 'Hoàn tiền',
        'exchange': 'Đổi hàng'
    };
    
    switch (type) {
        case 'refund':
            badgeClass = 'bg-dark';
            break;
        case 'exchange':
            badgeClass = 'bg-primary';
            break;
        default:
            badgeClass = 'bg-dark';
            break;
    }

    return (
        <span className={`badge ${badgeClass}`}>
            {requestTypeLabels[type] || type}
        </span>
    );
};

export default ReturnTypeBadge; 