'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CategoryModal = ({ isOpen, type, category, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (type === 'edit' && category) {
                setName(category.name);
            } else {
                setName('');
            }
            setError('');
        }
    }, [isOpen, type, category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate
        if (!name.trim()) {
            setError('Tên danh mục không được để trống');
            return;
        }

        setIsSubmitting(true);
        
        try {
            await onSubmit({ name });
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Tên danh mục <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nhập tên danh mục"
                            disabled={isSubmitting}
                        />
                    </div>

                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                        <Button 
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting 
                                ? 'Đang xử lý...' 
                                : type === 'add' 
                                    ? 'Thêm danh mục' 
                                    : 'Cập nhật'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CategoryModal; 