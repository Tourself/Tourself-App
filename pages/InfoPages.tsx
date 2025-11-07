
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../hooks';
import { useAuth } from '../contexts';
import { Header, Card, Input, Button, LoadingSpinner } from '../components';
import { api } from '../services';
import { InfoPage } from '../types';

const InfoPageContent: React.FC<{ pageId: string, defaultTitleKey: string }> = ({ pageId, defaultTitleKey }) => {
    const { t, language } = useTranslations();
    const [page, setPage] = useState<InfoPage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getInfoPage(pageId).then(data => {
            setPage(data || null);
            setLoading(false);
        });
    }, [pageId]);

    return (
        <div>
            <Header title={page ? page.title[language] : t(defaultTitleKey)} showMenu />
            <main className="p-4">
                <Card>
                    {loading ? <LoadingSpinner /> : page ? (
                        <>
                            <h2 className="text-2xl font-bold mb-4">{page.title[language]}</h2>
                            <div className="content-display" dangerouslySetInnerHTML={{ __html: page.content[language] }} />
                        </>
                    ) : <p>Page content not found.</p>}
                </Card>
            </main>
        </div>
    );
};


export const HowItWorksPage: React.FC = () => <InfoPageContent pageId="how-it-works" defaultTitleKey="how_quests_work" />;
export const FAQPage: React.FC = () => <InfoPageContent pageId="faq" defaultTitleKey="faq" />;
export const ContactPage: React.FC = () => <InfoPageContent pageId="contact" defaultTitleKey="contact_us" />;

export const ForGuidesPage: React.FC = () => {
    const { t, language } = useTranslations();
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const [page, setPage] = useState<InfoPage | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '', fullName: '', city: '', country: '', email: '', phone: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    useEffect(() => {
        api.getInfoPage('for-guides').then(data => {
            setPage(data || null);
            setLoading(false);
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (formData.password !== formData.confirmPassword) {
            setError(t('passwords_do_not_match'));
            return;
        }
        try {
            const newUser = await register(formData);
            if (newUser) {
                setSuccess(t('registration_successful'));
                setFormData({ username: '', password: '', confirmPassword: '', fullName: '', city: '', country: '', email: '', phone: '' });
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div>
            <Header title={page ? page.title[language] : t('for_local_guides')} showMenu />
            <main className="p-4">
                <Card>
                    {loading ? <LoadingSpinner /> : page ? (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">{page.title[language]}</h2>
                            <div className="content-display" dangerouslySetInnerHTML={{ __html: page.content[language] }} />
                        </div>
                    ) : null}
                    
                    <h3 className="text-xl font-bold mb-4 mt-8">{t('register_as_guide')}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Input name="fullName" label={t('full_name')} value={formData.fullName} onChange={handleChange} required />
                           <Input name="username" label={t('username')} value={formData.username} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="password" type="password" label={t('password')} value={formData.password} onChange={handleChange} required />
                            <Input name="confirmPassword" type="password" label={t('confirm_password')} value={formData.confirmPassword} onChange={handleChange} required />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="city" label={t('city')} value={formData.city} onChange={handleChange} required />
                            <Input name="country" label={t('country')} value={formData.country} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input name="email" type="email" label={t('email_address')} value={formData.email} onChange={handleChange} required />
                            <Input name="phone" label={t('contact_phone')} value={formData.phone} onChange={handleChange} required />
                        </div>
                        
                        {error && <p className="text-red-500">{error}</p>}
                        {success && <p className="text-green-600">{success}</p>}

                        <Button type="submit" className="w-full">{t('register')}</Button>
                    </form>
                </Card>
            </main>
        </div>
    );
};