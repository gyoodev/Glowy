// src/components/RoleSelectionBubble.tsx
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RoleSelectionBubbleProps {
    userId: string;
    onRoleSelected: () => void; // Callback to hide the bubble
}

const RoleSelectionBubble: React.FC<RoleSelectionBubbleProps> = ({ userId, onRoleSelected }) => {
    const [selectedRole, setSelectedRole] = useState<'customer' | 'business'>('customer');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveRole = async () => {
        setIsSubmitting(true);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: selectedRole,
            });
            onRoleSelected(); // Hide the bubble after saving
        } catch (error) {
            console.error('Error updating user role:', error);
            // Handle error (e.g., show a toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'center'
        }}>
            <p>Моля, изберете своята роля, за да продължите:</p>
            <div className="flex items-center space-x-2">
                <Label htmlFor="role">Role:</Label>
                <Select
                    value={selectedRole}
                    onValueChange={(value: 'customer' | 'business') => setSelectedRole(value)}
                    disabled={isSubmitting}
                >
                    <SelectTrigger id="role" className="w-[180px]">
                        <SelectValue placeholder="Изберете роля" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="customer">Клиент</SelectItem>
                        <SelectItem value="business">Бизнес</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleSaveRole} disabled={isSubmitting}>Запазване на ролята</Button>
        </div>
    );
};

export default RoleSelectionBubble;