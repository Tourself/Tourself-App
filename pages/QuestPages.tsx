import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Quest, QuestDifficulty, QuestionType, QuestStep } from '../types';
import { api, calculateDistance } from '../services';
import { useTranslations } from '../hooks';
import { Header, Card, Button, Map, LoadingSpinner, Input, Select, Modal, TTSButton } from '../components';
import { Icons } from '../constants';

const stripHtml = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

export const QuestListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [difficulty, setDifficulty] = useState<QuestDifficulty | 'All'>('All');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isSortingByDistance, setIsSortingByDistance] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        const fetchQuests = async () => {
            setLoading(true);
            const data = await api.getQuests();
            setQuests(data);
            setLoading(false);
        };
        fetchQuests();
    }, []);

    const handleSortByDistanceToggle = () => {
        if (isSortingByDistance) {
            setIsSortingByDistance(false);
            return;
        }

        if (userLocation) {
            setIsSortingByDistance(true);
        } else {
            setIsGettingLocation(true);
            setLocationError(null);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setIsSortingByDistance(true);
                    setIsGettingLocation(false);
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setLocationError(t('location_error'));
                    setIsGettingLocation(false);
                }
            );
        }
    };

    const filteredQuests = useMemo(() => {
        let sortedQuests = quests.filter(q => difficulty === 'All' || q.difficulty === difficulty);

        if (isSortingByDistance && userLocation) {
            sortedQuests = [...sortedQuests].sort((a, b) => {
                if (!a.steps?.[0]?.coords) return 1;
                if (!b.steps?.[0]?.coords) return -1;
                
                const distA = calculateDistance(userLocation.lat, userLocation.lng, a.steps[0].coords.lat, a.steps[0].coords.lng);
                const distB = calculateDistance(userLocation.lat, userLocation.lng, b.steps[0].coords.lat, b.steps[0].coords.lng);
                return distA - distB;
            });
        }
        
        return sortedQuests;
    }, [quests, difficulty, isSortingByDistance, userLocation]);

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={t('city_quests_title')} showMenu />
            <main className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <Select
                            label={t('difficulty')}
                            id="difficulty-filter"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value as QuestDifficulty | 'All')}
                        >
                            <option value="All">{t('all')}</option>
                            <option value={QuestDifficulty.Easy}>{t('easy')}</option>
                            <option value={QuestDifficulty.Medium}>{t('medium')}</option>
                            <option value={QuestDifficulty.Hard}>{t('hard')}</option>
                        </Select>
                    </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                        <Button
                            onClick={handleSortByDistanceToggle}
                            disabled={isGettingLocation}
                            variant="secondary"
                            className="w-full"
                        >
                            {isGettingLocation ? t('getting_location') : isSortingByDistance ? t('sorted_closest') : t('show_closest')}
                        </Button>
                    </div>
                </div>
                {locationError && <p className="text-red-500 text-sm mb-4 text-center">{locationError}</p>}
                
                {loading ? <LoadingSpinner /> : (
                    <div className="space-y-4">
                        {filteredQuests.map(quest => (
                            <Link to={`/quests/${quest.id}`} key={quest.id}>
                                <Card className="flex flex-col md:flex-row gap-4">
                                    <img src={quest.mainImage} alt={quest.title[language]} className="w-full md:w-1/3 h-40 object-cover rounded-lg" />
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-dark">{quest.title[language]}</h3>
                                        <p className="text-gray-600 mt-1">{stripHtml(quest.description[language]).substring(0, 100)}...</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Icons.BarChart /> {t(quest.difficulty.toLowerCase())}</span>
                                            <span className="flex items-center gap-1"><Icons.Clock /> {quest.duration} {t('minutes')}</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export const QuestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, language } = useTranslations();
    const navigate = useNavigate();
    const [quest, setQuest] = useState<Quest | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        const fetchQuest = async () => {
            if (id) {
                setLoading(true);
                const data = await api.getQuest(id);
                setQuest(data || null);
                setLoading(false);
                const token = localStorage.getItem(`quest-token-${id}`);
                setHasToken(!!token);
            }
        };
        fetchQuest();
    }, [id]);

    const handleButtonClick = () => {
        if (hasToken) {
            navigate(`/quest/play/${id}/0`);
        } else {
            navigate(`/checkout/${id}`);
        }
    };

    if (loading) return <div className="p-4"><LoadingSpinner/></div>;
    if (!quest) return <div className="p-4">Quest not found.</div>;

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={quest.title[language]} showBack />
            <main>
                <img src={quest.mainImage} alt={quest.title[language]} className="w-full h-64 object-cover" />
                <div className="p-4">
                    <Card>
                        <h2 className="text-2xl font-bold text-dark">{quest.title[language]}</h2>
                        <div className="flex items-center gap-4 my-2 text-md text-gray-600">
                            <span className="flex items-center gap-1"><Icons.BarChart /> {t(quest.difficulty.toLowerCase())}</span>
                            <span className="flex items-center gap-1"><Icons.Clock /> {quest.duration} {t('minutes')}</span>
                        </div>
                        <div className="content-display my-4" dangerouslySetInnerHTML={{ __html: quest.description[language] }} />
                        
                        {quest.steps.length > 0 && (
                            <>
                            <h3 className="font-bold text-lg mt-6 mb-2">{t('step')} 1 {t('of')} {quest.steps.length}: {quest.steps[0].title[language]}</h3>
                            <Map lat={quest.steps[0].coords.lat} lng={quest.steps[0].coords.lng} />
                            </>
                        )}
                    </Card>
                </div>
                <div className="p-4 sticky bottom-0 bg-white shadow-lg">
                    <Button onClick={handleButtonClick} className="w-full">
                        {hasToken ? t('start_quest') : t('purchase_quest')}
                    </Button>
                </div>
            </main>
        </div>
    );
};

export const QuestPlayPage: React.FC = () => {
    const { id, stepIndex } = useParams<{ id: string; stepIndex: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslations();
    const [quest, setQuest] = useState<Quest | null>(null);
    const [currentStep, setCurrentStep] = useState<QuestStep | null>(null);
    const [loading, setLoading] = useState(true);

    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [showPostAnswer, setShowPostAnswer] = useState(false);

    useEffect(() => {
        const fetchQuest = async () => {
            if (id && stepIndex !== undefined) {
                setLoading(true);
                const questData = await api.getQuest(id);
                if (questData && questData.steps[parseInt(stepIndex, 10)]) {
                    setQuest(questData);
                    setCurrentStep(questData.steps[parseInt(stepIndex, 10)]);
                }
                setLoading(false);
            }
        };
        fetchQuest();
    }, [id, stepIndex]);

    const handleNextStep = () => {
        if (quest && currentStep) {
            const nextStepIndex = currentStep.stepIndex + 1;
            if (nextStepIndex < quest.steps.length) {
                navigate(`/quest/play/${id}/${nextStepIndex}`);
                // Reset state for next step
                setUserAnswer('');
                setFeedback(null);
                setShowPostAnswer(false);
            } else {
                navigate(`/quest/complete/${id}`);
            }
        }
    };
    
    // Simplified answer check for demonstration
    const handleSubmitAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentStep) return;
        
        const correctAnswers = currentStep.question.answer[language].toLowerCase().split(',').map(s => s.trim());
        const userAnswerClean = userAnswer.toLowerCase().trim();

        const isCorrect = correctAnswers.includes(userAnswerClean) ||
                        (currentStep.question.type === QuestionType.MultipleChoice && userAnswer === currentStep.question.answer[language]);

        if (isCorrect) {
            setFeedback(t('feedback_correct'));
            setShowPostAnswer(true);

            if (id && stepIndex !== undefined) {
                const currentStepIdx = parseInt(stepIndex, 10);
                const progressRaw = localStorage.getItem(`quest-progress-${id}`);
                if (progressRaw) {
                    try {
                        const progress = JSON.parse(progressRaw);
                        if (!Array.isArray(progress.completedSteps)) {
                            progress.completedSteps = [];
                        }
                        
                        if (!progress.completedSteps.includes(currentStepIdx)) {
                            progress.correctAnswers += 1;
                            progress.completedSteps.push(currentStepIdx);
                            localStorage.setItem(`quest-progress-${id}`, JSON.stringify(progress));
                        }
                    } catch (e) {
                        console.error("Failed to parse or update quest progress", e);
                    }
                }
            }
        } else {
            setFeedback(t('wrong_answer'));
        }
    }

    if (loading) return <div className="p-4"><LoadingSpinner /></div>;
    if (!quest || !currentStep) return <div className="p-4">Quest step not found.</div>;
    
    const stepNumber = currentStep.stepIndex + 1;

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={`${quest.title[language]} (${t('step')} ${stepNumber}/${quest.steps.length})`} showBack />
            <main className="p-4 pb-24">
                <Card>
                    <h2 className="text-2xl font-bold text-dark mb-2">{currentStep.title[language]}</h2>
                    <img src={currentStep.image} alt={currentStep.title[language]} className="w-full h-48 object-cover rounded-lg my-4" />
                    
                    <div className="flex items-start gap-2">
                        <div className="content-display text-gray-700 flex-grow" dangerouslySetInnerHTML={{ __html: currentStep.clue[language] }} />
                        <TTSButton textToSpeak={stripHtml(currentStep.clue[language])} />
                    </div>

                    <Map lat={currentStep.coords.lat} lng={currentStep.coords.lng} />

                    {!showPostAnswer && (
                        <div className="mt-6 p-4 bg-accent/20 rounded-lg">
                            <form onSubmit={handleSubmitAnswer}>
                                <div className="flex items-start gap-2">
                                    <label htmlFor="answer" className="font-bold text-dark mb-2 flex-grow content-display" dangerouslySetInnerHTML={{ __html: currentStep.question.question[language]}} />
                                    <TTSButton textToSpeak={stripHtml(currentStep.question.question[language])} />
                                </div>
                                
                                {currentStep.question.type === QuestionType.OpenText ? (
                                    <Input
                                        id="answer"
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder={t('your_answer')}
                                    />
                                ) : (
                                    <div className="space-y-2 mt-2">
                                        {currentStep.question.options?.map((option, index) => (
                                            <label key={index} className="flex items-center p-3 border rounded-lg hover:bg-accent/50 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="mc_answer"
                                                    value={index}
                                                    checked={userAnswer === String(index)}
                                                    onChange={(e) => setUserAnswer(e.target.value)}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                                />
                                                <span className="ml-3 text-dark">{option[language]}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <Button type="submit" className="mt-4">{t('submit')}</Button>
                            </form>
                            {feedback && <p className={`mt-2 font-semibold ${feedback === t('feedback_correct') ? 'text-green-600' : 'text-primary'}`}>{feedback}</p>}
                        </div>
                    )}

                    {showPostAnswer && (
                        <div className="mt-6 p-4 bg-green-50 rounded-lg animate-fade-in">
                            <h3 className="text-lg font-bold text-green-800">{t('feedback_correct')}</h3>
                            {currentStep.postAnswerImage && <img src={currentStep.postAnswerImage} alt="More info" className="w-full h-40 object-cover rounded-lg my-4" />}
                            <div className="flex items-start gap-2">
                                <div className="content-display text-gray-800" dangerouslySetInnerHTML={{ __html: currentStep.postAnswerInfo?.[language] || '' }} />
                                <TTSButton textToSpeak={stripHtml(currentStep.postAnswerInfo?.[language] || '')} />
                            </div>
                        </div>
                    )}
                </Card>
            </main>
             {showPostAnswer && (
                 <div className="p-4 fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
                    <Button onClick={handleNextStep} className="w-full">
                        {currentStep.stepIndex + 1 < quest.steps.length ? 'Next Step' : 'Finish Quest'}
                    </Button>
                </div>
             )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};