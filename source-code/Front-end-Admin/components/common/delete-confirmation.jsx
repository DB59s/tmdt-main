'use client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, title, message, confirmDisabled = false }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{title || 'Xác nhận xóa'}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-gray-700">
                        {message || 'Bạn có chắc chắn muốn xóa?'}
                    </p>
                </div>

                <DialogFooter>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                    >
                        Hủy
                    </Button>
                    <Button 
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={confirmDisabled}
                    >
                        Xóa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteConfirmation; 