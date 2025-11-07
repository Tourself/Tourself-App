
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks';
import { useAuth } from '../contexts';
import { Card, Input, Button, Header } from '../components';

export const LoginPage: React.FC = () => {
    const { t } = useTranslations();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(username, password);
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (user.role === 'guide') {
                    navigate('/dashboard/quests');
                }
            } else {
                setError(t('login_failed'));
            }
        } catch (err) {
            setError(t('login_failed'));
        }
    };

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={t('login')} showBack />
            <div className="flex items-center justify-center p-4">
                <Card className="w-full max-w-sm mt-8">
                    <h1 className="text-2xl font-bold text-center mb-6">{t('login_to_your_account')}</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input 
                            id="username"
                            label={t('username')}
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <Input 
                            id="password"
                            label={t('password')}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">{t('login')}</Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};
