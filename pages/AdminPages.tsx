import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, NavLink, useParams, Link } from 'react-router-dom';
import { useTranslations } from '../hooks';
import { useAuth } from '../contexts';
import { Button, Card, Header, Input, StarRating, LoadingSpinner, Textarea, Select, ImageUpload, LocationSearchInput, RichTextInput } from '../components';
import { api, authService } from '../services';
import { Review, Quest, QuestDifficulty, QuestionType, QuestStep, Language, LocalGuideItem, QuestStatus, AuthUser, InfoPage, HomePageContent, ServiceSubCategory } from '../types';

export const AdminLayout: React.FC = () => {
    const { t } = useTranslations();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    const navLinkClasses = "block px-4 py-2 rounded-md text-sm font-medium";
    const activeLinkClasses = "bg-primary text-white";
    const inactiveLinkClasses = "text-gray-700 hover:bg-gray-200";

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
            <aside className="w-full md:w-64 bg-white p-4 space-y-2 border-b md:border-b-0 md:border-r">
                <h2 className="text-xl font-bold text-dark mb-4">{t('admin_dashboard')}</h2>
                <nav className="space-y-1">
                    <NavLink to="/admin/dashboard" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('dashboard')}</NavLink>
                    <NavLink to="/admin/quests" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('manage_quests')}</NavLink>
                    <NavLink to="/admin/guide" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('manage_guide')}</NavLink>
                    <NavLink to="/admin/pages" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('edit_pages')}</NavLink>
                    <NavLink to="/admin/submissions" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('submissions')}</NavLink>
                    <NavLink to="/admin/guides" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('manage_guides')}</NavLink>
                    <NavLink to="/admin/reviews" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('manage_reviews')}</NavLink>
                    <NavLink to="/admin/notifications" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('send_notification')}</NavLink>
                    <NavLink to="/admin/settings" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('settings')}</NavLink>
                </nav>
                 <div className="pt-4">
                    <Button variant="outline" onClick={handleLogout} className="w-full">{t('logout')}</Button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Routes>
                        <Route path="dashboard" element={<AdminDashboardPage />} />
                        <Route path="quests" element={<AdminQuestListPage />} />
                        <Route path="quests/new" element={<AdminQuestFormPage />} />
                        <Route path="quests/edit/:id" element={<AdminQuestFormPage />} />
                        <Route path="guide" element={<AdminGuideListPage />} />
                        <Route path="guide/new" element={<AdminGuideFormPage />} />
                        <Route path="guide/edit/:id" element={<AdminGuideFormPage />} />
                        <Route path="guides" element={<AdminGuidesListPage />} />
                        <Route path="pages" element={<AdminPagesListPage />} />
                        <Route path="pages/edit/home" element={<AdminHomePageFormPage />} />
                        <Route path="pages/edit/:id" element={<AdminPageEditForm />} />
                        <Route path="submissions" element={<AdminSubmissionsPage />} />
                        <Route path="reviews" element={<AdminReviewManagementPage />} />
                        <Route path="notifications" element={<AdminPushNotificationPage />} />
                        <Route path="settings" element={<AdminSettingsPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

export const GuideLayout: React.FC = () => {
    const { t } = useTranslations();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    const navLinkClasses = "block px-4 py-2 rounded-md text-sm font-medium";
    const activeLinkClasses = "bg-primary text-white";
    const inactiveLinkClasses = "text-gray-700 hover:bg-gray-200";
    
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
            <aside className="w-full md:w-64 bg-white p-4 space-y-2 border-b md:border-b-0 md:border-r">
                <h2 className="text-xl font-bold text-dark mb-4">{t('guide_dashboard')}</h2>
                <nav className="space-y-1">
                    <NavLink to="/dashboard/quests" className={({isActive}) => `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}>{t('my_quests')}</NavLink>
                </nav>
                 <div className="pt-4">
                    <Button variant="outline" onClick={handleLogout} className="w-full">{t('logout')}</Button>
                </div>
            </aside>
            <div className="flex-1 flex flex-col">
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Routes>
                        <Route path="quests" element={<GuideQuestsPage />} />
                        <Route path="quests/new" element={<AdminQuestFormPage />} />
                        <Route path="quests/edit/:id" element={<AdminQuestFormPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};


export const AdminDashboardPage: React.FC = () => {
    const { t } = useTranslations();
    const [stats, setStats] = useState({ quests: 0, guides: 0, submissions: 0, reviews: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const [questsData, guidesData, submissionsData, reviewsData] = await Promise.all([
                api.getAllQuests(),
                authService.getGuides(),
                api.getPendingQuests(),
                api.getAllReviews(),
            ]);
            setStats({
                quests: questsData.length,
                guides: guidesData.length,
                submissions: submissionsData.length,
                reviews: reviewsData.filter(r => !r.isApproved).length, // pending reviews
            });
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('dashboard')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Total Quests</h3>
                    <p className="text-3xl font-bold text-dark">{stats.quests}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Registered Guides</h3>
                    <p className="text-3xl font-bold text-dark">{stats.guides}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Pending Submissions</h3>
                    <p className="text-3xl font-bold text-primary">{stats.submissions}</p>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-gray-500">Pending Reviews</h3>
                    <p className="text-3xl font-bold text-primary">{stats.reviews}</p>
                </Card>
            </div>
        </div>
    );
};
export const AdminReviewManagementPage: React.FC = () => {
    const { t } = useTranslations();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReviews = async () => {
        setLoading(true);
        const data = await api.getAllReviews();
        setReviews(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleToggleApproval = async (reviewId: string) => {
        await api.toggleReviewApproval(reviewId);
        fetchReviews(); // Re-fetch to update the list
    };
    
    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('manage_reviews')}</h1>
            <Card className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('comment')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('rating')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {reviews.map(review => (
                            <tr key={review.id}>
                                <td className="px-6 py-4">
                                    <p className="font-medium">{review.comment}</p>
                                    <p className="text-sm text-gray-500">{review.userName} on {review.date}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap"><StarRating rating={review.rating} size="sm" /></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${review.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {review.isApproved ? t('approved') : t('pending')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button onClick={() => handleToggleApproval(review.id)} size="sm">
                                        {review.isApproved ? 'Unapprove' : t('approve')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};
export const AdminPushNotificationPage: React.FC = () => {
    const { t } = useTranslations();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        const success = await api.sendNotification(title, message);
        if (success) {
            alert(t('notification_sent'));
            setTitle('');
            setMessage('');
        } else {
            alert('Notification failed. User may have denied permission.');
        }
        setIsSending(false);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('send_notification')}</h1>
            <Card>
                <form onSubmit={handleSend} className="space-y-4 max-w-lg">
                    <Input label={t('notification_title')} value={title} onChange={e => setTitle(e.target.value)} required />
                    <Textarea label={t('notification_message')} value={message} onChange={e => setMessage(e.target.value)} rows={4} required />
                    <Button type="submit" disabled={isSending}>
                        {isSending ? t('loading') : t('send')}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

const AdminQuestListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const navigate = useNavigate();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchQuests = async () => {
        setLoading(true);
        const data = await api.getAllQuests();
        setQuests(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchQuests();
    }, []);

    const handleDelete = async (questId: string) => {
        if (window.confirm('Are you sure you want to delete this quest?')) {
            await api.deleteQuest(questId);
            fetchQuests();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark">{t('manage_quests')}</h1>
                <Button onClick={() => navigate('/admin/quests/new')}>{t('create_new_quest')}</Button>
            </div>
            {loading ? <LoadingSpinner /> : (
                <Card className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quest_title')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quests.map(quest => (
                                <tr key={quest.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{quest.title[language]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            quest.status === QuestStatus.Published ? 'bg-green-100 text-green-800' : 
                                            quest.status === QuestStatus.Pending ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {t(quest.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{quest.steps.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <Button onClick={() => navigate(`/admin/quests/edit/${quest.id}`)} variant="secondary">Edit</Button>
                                        <Button onClick={() => handleDelete(quest.id)} variant="outline">Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

const emptyMLString = { en: '', ru: '', ge: '' };
// FIX: Implemented the getNewStep function to return a valid QuestStep object.
const getNewStep = (index: number): QuestStep => ({
    stepIndex: index,
    title: { ...emptyMLString },
    clue: { ...emptyMLString },
    image: '',
    coords: { lat: 41.6935, lng: 44.8015 }, // Default to Tbilisi center
    question: {
        type: QuestionType.OpenText,
        question: { ...emptyMLString },
        answer: { ...emptyMLString },
        hint: { ...emptyMLString },
    },
    postAnswerInfo: { ...emptyMLString },
    postAnswerImage: '',
});

const AdminQuestFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslations();
    const { user } = useAuth();
    
    const [quest, setQuest] = useState<Omit<Quest, 'id'>>({
        title: { ...emptyMLString },
        description: { ...emptyMLString },
        mainImage: '',
        difficulty: QuestDifficulty.Easy,
        duration: 60,
        category: '',
        price: 9.99,
        steps: [],
        status: user?.role === 'guide' ? QuestStatus.Draft : QuestStatus.Published,
        authorId: user?.id,
    });
    const [loading, setLoading] = useState(!!id);
    const [isSaving, setIsSaving] = useState(false);
    const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            api.getQuest(id).then(data => {
                if (data) setQuest(data);
                setLoading(false);
            });
        }
    }, [id]);

    const handleQuestChange = (field: keyof Omit<Quest, 'id' | 'title' | 'description' | 'steps'>, value: any) => {
        setQuest(prev => ({ ...prev, [field]: value }));
    };
    const handleMLChange = (field: 'title' | 'description', lang: Language, value: string) => {
         setQuest(prev => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
    };
    const handleAddStep = () => {
        setQuest(prev => ({ ...prev, steps: [...prev.steps, getNewStep(prev.steps.length)] }));
    };
    const handleRemoveStep = (index: number) => {
        setQuest(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));
    };
    const handleStepChange = (index: number, field: keyof Omit<QuestStep, 'title' | 'clue' | 'question' | 'postAnswerInfo'>, value: any) => {
        setQuest(prev => {
            const newSteps = [...prev.steps];
            (newSteps[index] as any)[field] = value;
            return { ...prev, steps: newSteps };
        });
    };
    const handleStepMLChange = (index: number, field: 'title' | 'clue' | 'postAnswerInfo', lang: Language, value: string) => {
        setQuest(prev => {
            const newSteps = [...prev.steps];
            (newSteps[index][field] as any)[lang] = value;
            return { ...prev, steps: newSteps };
        });
    };
    const handleQuestionChange = (index: number, field: keyof Omit<QuestStep['question'], 'question' | 'answer' | 'hint' | 'options'>, value: any) => {
        setQuest(prev => {
            const newSteps = [...prev.steps];
            (newSteps[index].question as any)[field] = value;
            return { ...prev, steps: newSteps };
        });
    };
    const handleQuestionMLChange = (index: number, field: 'question' | 'answer' | 'hint', lang: Language, value: string) => {
        setQuest(prev => {
            const newSteps = [...prev.steps];
            (newSteps[index].question[field] as any)[lang] = value;
            return { ...prev, steps: newSteps };
        });
    };
     const handleQuestionOptionsChange = (index: number, lang: Language, value: string) => {
        setQuest(prev => {
            const newSteps = [...prev.steps];
            const oldOptions = newSteps[index].question.options || [];
            const newOptions = [...oldOptions];
            if (!newOptions[0]) newOptions[0] = {...emptyMLString};
            if (!newOptions[1]) newOptions[1] = {...emptyMLString};
            if (!newOptions[2]) newOptions[2] = {...emptyMLString};
            
            const values = value.split(',').map(s => s.trim());
            newOptions[0][lang] = values[0] || '';
            newOptions[1][lang] = values[1] || '';
            newOptions[2][lang] = values[2] || '';

            newSteps[index].question.options = newOptions;
            return { ...prev, steps: newSteps };
        });
    };

    const handleSubmit = async (e: React.FormEvent, submissionType: 'save' | 'submit') => {
        e.preventDefault();
        setIsSaving(true);
        
        let questToSave = { ...quest };
        if (submissionType === 'submit') {
            questToSave.status = QuestStatus.Pending;
        }

        if (id) {
            await api.updateQuest(id, questToSave as Quest);
        } else {
            await api.createQuest(questToSave);
        }
        setIsSaving(false);
        navigate(user?.role === 'admin' ? '/admin/quests' : '/dashboard/quests');
    };

    const handleApprove = async () => {
        if (id) {
            await api.approveQuest(id);
            navigate('/admin/submissions');
        }
    };
    
    if (loading) return <LoadingSpinner />;

    const isGuide = user?.role === 'guide';
    const isPendingSubmission = quest.status === QuestStatus.Pending;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{id ? t('edit_quest') : t('create_new_quest')}</h1>
            <form>
                <Card className="space-y-6">
                     <ImageUpload
                        label={t('main_image_url')}
                        currentImage={quest.mainImage}
                        onImageUpload={(base64) => handleQuestChange('mainImage', base64)}
                    />

                    <div>
                        <h3 className="font-semibold mb-2">{t('quest_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={quest.title.en} onChange={e => handleMLChange('title', 'en', e.target.value)} required />
                            <Input label="RU" value={quest.title.ru} onChange={e => handleMLChange('title', 'ru', e.target.value)} />
                            <Input label="GE" value={quest.title.ge} onChange={e => handleMLChange('title', 'ge', e.target.value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">{t('quest_description')}</h3>
                        <div className="space-y-2">
                             <RichTextInput label="EN" value={quest.description.en} onChange={value => handleMLChange('description', 'en', value)} />
                             <RichTextInput label="RU" value={quest.description.ru} onChange={value => handleMLChange('description', 'ru', value)} />
                             <RichTextInput label="GE" value={quest.description.ge} onChange={value => handleMLChange('description', 'ge', value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <Select label={t('difficulty')} value={quest.difficulty} onChange={e => handleQuestChange('difficulty', e.target.value)}>
                            <option value={QuestDifficulty.Easy}>{t('easy')}</option>
                            <option value={QuestDifficulty.Medium}>{t('medium')}</option>
                            <option value={QuestDifficulty.Hard}>{t('hard')}</option>
                        </Select>
                        <Input type="number" label={t('duration')} value={quest.duration} onChange={e => handleQuestChange('duration', parseInt(e.target.value))} />
                        <Input label={t('category')} value={quest.category} onChange={e => handleQuestChange('category', e.target.value)} />
                        <Input type="number" label={t('price')} value={quest.price} onChange={e => handleQuestChange('price', parseFloat(e.target.value))} />
                    </div>
                </Card>
                
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">{t('quest_steps')}</h2>
                     <div className="space-y-4">
                        {quest.steps.map((step, index) => (
                           <Card key={index}>
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveStepIndex(activeStepIndex === index ? null : index)}>
                                    <h3 className="text-xl font-semibold">Step {index + 1}: {step.title.en || 'New Step'}</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveStep(index); }}>{t('delete')}</Button>
                                </div>
                                {activeStepIndex === index && (
                                   <div className="mt-4 space-y-4 pt-4 border-t">
                                        <ImageUpload label={t('step_image_url')} currentImage={step.image} onImageUpload={base64 => handleStepChange(index, 'image', base64)} />
                                        <div>
                                            <h4 className="font-semibold mb-2">{t('edit_step')} Title</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <Input label="EN" value={step.title.en} onChange={e => handleStepMLChange(index, 'title', 'en', e.target.value)} />
                                                <Input label="RU" value={step.title.ru} onChange={e => handleStepMLChange(index, 'title', 'ru', e.target.value)} />
                                                <Input label="GE" value={step.title.ge} onChange={e => handleStepMLChange(index, 'title', 'ge', e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">{t('clue')}</h4>
                                            <div className="space-y-2">
                                                <RichTextInput label="EN" value={step.clue.en} onChange={value => handleStepMLChange(index, 'clue', 'en', value)} />
                                                <RichTextInput label="RU" value={step.clue.ru} onChange={value => handleStepMLChange(index, 'clue', 'ru', value)} />
                                                <RichTextInput label="GE" value={step.clue.ge} onChange={value => handleStepMLChange(index, 'clue', 'ge', value)} />
                                            </div>
                                        </div>
                                         <LocationSearchInput label="Location" currentCoords={step.coords} onLocationChange={(coords) => handleStepChange(index, 'coords', coords)} />
                                        
                                        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                                            <h4 className="font-bold text-lg">Question</h4>
                                            <Select label={t('question_type')} value={step.question.type} onChange={e => handleQuestionChange(index, 'type', e.target.value)}>
                                                <option value={QuestionType.OpenText}>{t('open_text')}</option>
                                                <option value={QuestionType.MultipleChoice}>{t('multiple_choice')}</option>
                                            </Select>

                                            <div>
                                                <h4 className="font-semibold mb-2">{t('question')}</h4>
                                                <div className="space-y-2">
                                                    <RichTextInput label="EN" value={step.question.question.en} onChange={value => handleQuestionMLChange(index, 'question', 'en', value)} />
                                                    <RichTextInput label="RU" value={step.question.question.ru} onChange={value => handleQuestionMLChange(index, 'question', 'ru', value)} />
                                                    <RichTextInput label="GE" value={step.question.question.ge} onChange={value => handleQuestionMLChange(index, 'question', 'ge', value)} />
                                                </div>
                                            </div>

                                            {step.question.type === QuestionType.MultipleChoice && (
                                                <Input label={`${t('options_comma_separated')} (EN)`} value={(step.question.options || []).map(o => o.en).join(', ')} onChange={e => handleQuestionOptionsChange(index, 'en', e.target.value)} />
                                            )}
                                            
                                            {step.question.type === QuestionType.OpenText ? (
                                                <div>
                                                    <h4 className="font-semibold mb-2">{t('correct_answers_comma_separated')}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <Input label="EN" value={step.question.answer.en} onChange={e => handleQuestionMLChange(index, 'answer', 'en', e.target.value)} />
                                                        <Input label="RU" value={step.question.answer.ru} onChange={e => handleQuestionMLChange(index, 'answer', 'ru', e.target.value)} />
                                                        <Input label="GE" value={step.question.answer.ge} onChange={e => handleQuestionMLChange(index, 'answer', 'ge', e.target.value)} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <Input label={`${t('correct_answer')}`} value={step.question.answer.en} onChange={e => handleQuestionMLChange(index, 'answer', 'en', e.target.value)} placeholder="Correct option index (e.g., 0)" />
                                            )}

                                            <div>
                                                <h4 className="font-semibold mb-2">{t('hint_optional')}</h4>
                                                <div className="space-y-2">
                                                    <Textarea label="EN" value={step.question.hint?.en} onChange={e => handleQuestionMLChange(index, 'hint', 'en', e.target.value)} />
                                                    <Textarea label="RU" value={step.question.hint?.ru} onChange={e => handleQuestionMLChange(index, 'hint', 'ru', e.target.value)} />
                                                    <Textarea label="GE" value={step.question.hint?.ge} onChange={e => handleQuestionMLChange(index, 'hint', 'ge', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                         <ImageUpload label={t('post_answer_image_optional')} currentImage={step.postAnswerImage || null} onImageUpload={base64 => handleStepChange(index, 'postAnswerImage', base64)} />
                                        <div>
                                            <h4 className="font-semibold mb-2">{t('post_answer_info')}</h4>
                                            <div className="space-y-2">
                                                <RichTextInput label="EN" value={step.postAnswerInfo?.en || ''} onChange={value => handleStepMLChange(index, 'postAnswerInfo', 'en', value)} />
                                                <RichTextInput label="RU" value={step.postAnswerInfo?.ru || ''} onChange={value => handleStepMLChange(index, 'postAnswerInfo', 'ru', value)} />
                                                <RichTextInput label="GE" value={step.postAnswerInfo?.ge || ''} onChange={value => handleStepMLChange(index, 'postAnswerInfo', 'ge', value)} />
                                            </div>
                                        </div>
                                   </div>
                                )}
                           </Card>
                        ))}
                    </div>
                    <Button type="button" onClick={handleAddStep} className="mt-4">{t('add_step')}</Button>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(isGuide ? '/dashboard/quests' : '/admin/quests')}>Cancel</Button>
                    {isGuide ? (
                        <>
                            <Button type="button" onClick={(e) => handleSubmit(e, 'save')} disabled={isSaving}>{isSaving ? t('loading') : t('save_quest')}</Button>
                            <Button type="button" onClick={(e) => handleSubmit(e, 'submit')} disabled={isSaving}>{t('submit_for_approval')}</Button>
                        </>
                    ) : (
                        <>
                            {isPendingSubmission && <Button type="button" onClick={handleApprove} variant="secondary">{t('approve_quest')}</Button>}
                            <Button type="button" onClick={(e) => handleSubmit(e, 'save')} disabled={isSaving}>{isSaving ? t('loading') : t('save_quest')}</Button>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

const AdminGuideListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const navigate = useNavigate();
    const [items, setItems] = useState<LocalGuideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchItems = async () => {
        setLoading(true);
        const data = await api.getGuideItems();
        setItems(data);
        setLoading(false);
    };
    
    useEffect(() => {
        fetchItems();
    }, []);

    const handleDelete = async (itemId: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            await api.deleteGuideItem(itemId);
            fetchItems();
        }
    };
    
    const filteredItems = useMemo(() => items.filter(item =>
        item.title[language].toLowerCase().includes(searchTerm.toLowerCase())
    ), [items, language, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark">{t('manage_guide')}</h1>
                <Button onClick={() => navigate('/admin/guide/new')}>{t('create_new_item')}</Button>
            </div>
             <div className="mb-4">
                <Input
                    type="text"
                    placeholder={t('search_places')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {loading ? <LoadingSpinner /> : (
                <Card className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('guide_item_title')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('category')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('sub_category')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.title[language]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{item.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{item.subCategory ? t(item.subCategory) : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        <Button onClick={() => navigate(`/admin/guide/edit/${item.id}`)} variant="secondary">Edit</Button>
                                        <Button onClick={() => handleDelete(item.id)} variant="outline">Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};
const AdminGuideFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslations();
    const [item, setItem] = useState<Omit<LocalGuideItem, 'id' | 'averageRating'>>({
        title: { en: '', ru: '', ge: '' },
        description: { en: '', ru: '', ge: '' },
        address: { en: '', ru: '', ge: '' },
        category: 'sites',
        subCategory: undefined,
        contact: '',
        coords: { lat: 41.7151, lng: 44.8271 },
        image: ''
    });
    const [loading, setLoading] = useState(!!id);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            api.getGuideItem(id).then(data => {
                if (data) setItem(data);
                setLoading(false);
            });
        }
    }, [id]);

    const handleItemChange = (field: keyof Omit<LocalGuideItem, 'id' | 'averageRating' | 'title' | 'description' | 'address'>, value: any) => {
        setItem(prev => ({ ...prev, [field]: value }));
    };

    const handleMLChange = (field: 'title' | 'description' | 'address', lang: Language, value: string) => {
        setItem(prev => ({ ...prev, [field]: { ...prev[field], [lang]: value } }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const itemToSave = { ...item };
        if (itemToSave.category !== 'services') {
            delete itemToSave.subCategory;
        }
        
        if (id) {
            await api.updateGuideItem(id, itemToSave as LocalGuideItem);
        } else {
            await api.createGuideItem(itemToSave);
        }
        setIsSaving(false);
        navigate('/admin/guide');
    };
    
    if (loading) return <LoadingSpinner />;
    
    const serviceSubCategories: ServiceSubCategory[] = ['banks_atms', 'car_rentals', 'medical_clinics', 'pharmacy'];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{id ? t('edit_guide_item') : t('create_new_item')}</h1>
            <form onSubmit={handleSubmit}>
                <Card className="space-y-6">
                     <ImageUpload
                        label={t('image_url')}
                        currentImage={item.image}
                        onImageUpload={(base64) => handleItemChange('image', base64)}
                    />
                    <div>
                        <h3 className="font-semibold mb-2">{t('guide_item_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={item.title.en} onChange={e => handleMLChange('title', 'en', e.target.value)} required />
                            <Input label="RU" value={item.title.ru} onChange={e => handleMLChange('title', 'ru', e.target.value)} />
                            <Input label="GE" value={item.title.ge} onChange={e => handleMLChange('title', 'ge', e.target.value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">{t('guide_item_description')}</h3>
                        <div className="space-y-2">
                            <RichTextInput label="EN" value={item.description.en} onChange={value => handleMLChange('description', 'en', value)} />
                            <RichTextInput label="RU" value={item.description.ru} onChange={value => handleMLChange('description', 'ru', value)} />
                            <RichTextInput label="GE" value={item.description.ge} onChange={value => handleMLChange('description', 'ge', value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">{t('address')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={item.address.en} onChange={e => handleMLChange('address', 'en', e.target.value)} required />
                            <Input label="RU" value={item.address.ru} onChange={e => handleMLChange('address', 'ru', e.target.value)} />
                            <Input label="GE" value={item.address.ge} onChange={e => handleMLChange('address', 'ge', e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label={t('category')} value={item.category} onChange={e => handleItemChange('category', e.target.value)}>
                            <option value="sites">{t('sites')}</option>
                            <option value="restaurants">{t('restaurants')}</option>
                            <option value="services">{t('services')}</option>
                        </Select>
                        {item.category === 'services' && (
                            <Select label={t('sub_category')} value={item.subCategory || ''} onChange={e => handleItemChange('subCategory', e.target.value)}>
                                <option value="">Select...</option>
                                {serviceSubCategories.map(subCat => (
                                    <option key={subCat} value={subCat}>{t(subCat)}</option>
                                ))}
                            </Select>
                        )}
                    </div>
                     <Input label={t('contact')} value={item.contact} onChange={e => handleItemChange('contact', e.target.value)} />
                     <LocationSearchInput
                        label={t('current_location')}
                        currentCoords={item.coords}
                        onLocationChange={(coords) => handleItemChange('coords', coords)}
                    />
                </Card>
                <div className="mt-6 flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/guide')}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? t('loading') : t('save_item')}</Button>
                </div>
            </form>
        </div>
    );
};


// NEW ADMIN & GUIDE PAGES
const AdminSubmissionsPage: React.FC = () => {
    const { t, language } = useTranslations();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.getPendingQuests().then(data => {
            setQuests(data);
            setLoading(false);
        });
    }, []);

    if(loading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('submissions')}</h1>
            {quests.length === 0 ? <p>{t('no_submissions')}</p> : (
            <Card className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quest_title')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('submitted_by')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quests.map(quest => (
                            <tr key={quest.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{quest.title[language]}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{quest.authorId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button onClick={() => navigate(`/admin/quests/edit/${quest.id}`)} variant="secondary">Review</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
            )}
        </div>
    );
};

const AdminGuidesListPage: React.FC = () => {
    const { t } = useTranslations();
    const [guides, setGuides] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authService.getGuides().then(data => {
            setGuides(data);
            setLoading(false);
        });
    }, []);
    
    if(loading) return <LoadingSpinner />;
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('manage_guides')}</h1>
            <Card>
                <ul className="divide-y divide-gray-200">
                    {guides.map(guide => (
                        <li key={guide.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{guide.fullName}</p>
                                <p className="text-sm text-gray-500">{guide.email}</p>
                            </div>
                            <p className="text-sm text-gray-600">{guide.city}, {guide.country}</p>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
};

const AdminSettingsPage: React.FC = () => {
    const { t } = useTranslations();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password && password === confirm) {
            alert(t('password_changed'));
            setPassword('');
            setConfirm('');
        } else {
            alert(t('passwords_do_not_match'));
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('settings')}</h1>
            <Card>
                <h2 className="text-xl font-semibold mb-4">{t('change_admin_password')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
                    <Input type="password" label={t('new_password')} value={password} onChange={e => setPassword(e.target.value)} />
                    <Input type="password" label={t('confirm_password')} value={confirm} onChange={e => setConfirm(e.target.value)} />
                    <Button type="submit">{t('save_password')}</Button>
                </form>
            </Card>
        </div>
    );
};

const GuideQuestsPage: React.FC = () => {
    const { t, language } = useTranslations();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            api.getQuestsByAuthor(user.id).then(data => {
                setQuests(data);
                setLoading(false);
            });
        }
    }, [user]);

    if(loading) return <LoadingSpinner />;

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark">{t('my_quests')}</h1>
                <Button onClick={() => navigate('/dashboard/quests/new')}>{t('create_new_quest')}</Button>
            </div>
            {quests.length === 0 ? <p>You haven't created any quests yet.</p> : (
                <Card className="overflow-x-auto">
                     <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('quest_title')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quests.map(quest => (
                                <tr key={quest.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{quest.title[language]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            quest.status === QuestStatus.Published ? 'bg-green-100 text-green-800' : 
                                            quest.status === QuestStatus.Pending ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {t(quest.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Button onClick={() => navigate(`/dashboard/quests/edit/${quest.id}`)} variant="secondary">Edit</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};

const AdminPagesListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const [pages, setPages] = useState<InfoPage[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    useEffect(() => {
        api.getInfoPages().then(data => {
            setPages(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('edit_pages')}</h1>
            <Card className="overflow-x-auto">
                 <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('page_title')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr key="home-page-key">
                            <td className="px-6 py-4 whitespace-nowrap font-medium">Home Page</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Button onClick={() => navigate(`/admin/pages/edit/home`)} variant="secondary">Edit</Button>
                            </td>
                        </tr>
                        {pages.map(page => (
                            <tr key={page.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{page.title[language]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button onClick={() => navigate(`/admin/pages/edit/${page.id}`)} variant="secondary">Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
};

const AdminPageEditForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslations();
    const [page, setPage] = useState<InfoPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (id) {
            api.getInfoPage(id).then(data => {
                setPage(data || null);
                setLoading(false);
            });
        }
    }, [id]);

    const handleMLChange = (field: 'title' | 'content', lang: Language, value: string) => {
        if (page) {
            setPage({
                ...page,
                [field]: { ...page[field], [lang]: value }
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!page) return;
        setIsSaving(true);
        await api.updateInfoPage(page.id, page);
        setIsSaving(false);
        navigate('/admin/pages');
    };

    if (loading) return <LoadingSpinner />;
    if (!page) return <p>Page not found.</p>;
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">{t('edit_page')}: {page.title.en}</h1>
            <form onSubmit={handleSubmit}>
                <Card className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">{t('page_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={page.title.en} onChange={e => handleMLChange('title', 'en', e.target.value)} required />
                            <Input label="RU" value={page.title.ru} onChange={e => handleMLChange('title', 'ru', e.target.value)} />
                            <Input label="GE" value={page.title.ge} onChange={e => handleMLChange('title', 'ge', e.target.value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">{t('page_content')}</h3>
                        <div className="space-y-4">
                             <RichTextInput label="EN" value={page.content.en} onChange={value => handleMLChange('content', 'en', value)} />
                             <RichTextInput label="RU" value={page.content.ru} onChange={value => handleMLChange('content', 'ru', value)} />
                             <RichTextInput label="GE" value={page.content.ge} onChange={value => handleMLChange('content', 'ge', value)} />
                        </div>
                    </div>
                </Card>
                <div className="mt-6 flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/pages')}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? t('loading') : t('save_page')}</Button>
                </div>
            </form>
        </div>
    );
};

const AdminHomePageFormPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslations();
    const [content, setContent] = useState<HomePageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        api.getHomePageContent().then(data => {
            setContent(data);
            setLoading(false);
        });
    }, []);

    const handleMLChange = (field: keyof Omit<HomePageContent, 'id' | 'heroImage'>, lang: Language, value: string) => {
        if (content) {
            setContent({
                ...content,
                [field]: { ...(content[field] as any), [lang]: value }
            });
        }
    };
    
    const handleFieldChange = (field: keyof HomePageContent, value: string) => {
        if (content) {
            setContent({ ...content, [field]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return;
        setIsSaving(true);
        await api.updateHomePageContent(content);
        setIsSaving(false);
        navigate('/admin/pages');
    };

    if (loading) return <LoadingSpinner />;
    if (!content) return <p>Home page content not found.</p>;
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-dark">Edit Home Page</h1>
            <form onSubmit={handleSubmit}>
                <Card className="space-y-6">
                    <ImageUpload
                        label="Hero Background Image"
                        currentImage={content.heroImage}
                        onImageUpload={(base64) => handleFieldChange('heroImage', base64)}
                    />
                     <div>
                        <h3 className="font-semibold mb-2">Main Title</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={content.title.en} onChange={e => handleMLChange('title', 'en', e.target.value)} />
                            <Input label="RU" value={content.title.ru} onChange={e => handleMLChange('title', 'ru', e.target.value)} />
                            <Input label="GE" value={content.title.ge} onChange={e => handleMLChange('title', 'ge', e.target.value)} />
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Subtitle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="EN" value={content.subtitle.en} onChange={e => handleMLChange('subtitle', 'en', e.target.value)} />
                            <Input label="RU" value={content.subtitle.ru} onChange={e => handleMLChange('subtitle', 'ru', e.target.value)} />
                            <Input label="GE" value={content.subtitle.ge} onChange={e => handleMLChange('subtitle', 'ge', e.target.value)} />
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Card 1: Explore Local Guide</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-medium text-sm mb-1">Title</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="EN" value={content.card1Title.en} onChange={e => handleMLChange('card1Title', 'en', e.target.value)} />
                                    <Input label="RU" value={content.card1Title.ru} onChange={e => handleMLChange('card1Title', 'ru', e.target.value)} />
                                    <Input label="GE" value={content.card1Title.ge} onChange={e => handleMLChange('card1Title', 'ge', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm mb-1">Description</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="EN" value={content.card1Description.en} onChange={e => handleMLChange('card1Description', 'en', e.target.value)} />
                                    <Input label="RU" value={content.card1Description.ru} onChange={e => handleMLChange('card1Description', 'ru', e.target.value)} />
                                    <Input label="GE" value={content.card1Description.ge} onChange={e => handleMLChange('card1Description', 'ge', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Card 2: Find City Quests</h3>
                        <div className="space-y-4">
                             <div>
                                <h4 className="font-medium text-sm mb-1">Title</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="EN" value={content.card2Title.en} onChange={e => handleMLChange('card2Title', 'en', e.target.value)} />
                                    <Input label="RU" value={content.card2Title.ru} onChange={e => handleMLChange('card2Title', 'ru', e.target.value)} />
                                    <Input label="GE" value={content.card2Title.ge} onChange={e => handleMLChange('card2Title', 'ge', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-sm mb-1">Description</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Input label="EN" value={content.card2Description.en} onChange={e => handleMLChange('card2Description', 'en', e.target.value)} />
                                    <Input label="RU" value={content.card2Description.ru} onChange={e => handleMLChange('card2Description', 'ru', e.target.value)} />
                                    <Input label="GE" value={content.card2Description.ge} onChange={e => handleMLChange('card2Description', 'ge', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="mt-6 flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/admin/pages')}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? t('loading') : "Save Home Page"}</Button>
                </div>
            </form>
        </div>
    );
};