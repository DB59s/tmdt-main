const OrderStatusBadge = ({ status }) => {
    let badgeClass = '';
    
    switch (status) {
        case 'Đang xác nhận':
            badgeClass = 'bg-info';
            break;
        case 'Đang đóng gói':
            badgeClass = 'bg-secondary';
            break;
        case 'Đang giao hàng':
            badgeClass = 'bg-primary';
            break;
        case 'Đã giao hàng':
            badgeClass = 'bg-success';
            break;
        case 'Đã hủy':
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

export default OrderStatusBadge; 