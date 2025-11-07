import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LocalGuideItem, Review } from '../types';
import { api, geminiService, calculateDistance } from '../services';
import { useTranslations } from '../hooks';
import { Header, Card, Button, Map, LoadingSpinner, Input, StarRating, ReviewList, ReviewForm, Modal, MapView, TTSButton } from '../components';
import { Icons } from '../constants';

type Category = 'all' | 'sites' | 'restaurants' | 'services';

const stripHtml = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

export const GuideListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const navigate = useNavigate();
    const [items, setItems] = useState<LocalGuideItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Category>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isSortingByDistance, setIsSortingByDistance] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            const data = await api.getGuideItems();
            setItems(data);
            setLoading(false);
        };
        fetchItems();
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
    
    const filteredItems = useMemo(() => {
        let sortedItems = items
            .filter(item => filter === 'all' || item.category === filter)
            .filter(item => item.title[language].toLowerCase().includes(searchTerm.toLowerCase()));

        if (isSortingByDistance && userLocation) {
            sortedItems = [...sortedItems].sort((a, b) => {
                const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coords.lat, a.coords.lng);
                const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coords.lat, b.coords.lng);
                return distA - distB;
            });
        }

        return sortedItems;
    }, [items, filter, searchTerm, language, isSortingByDistance, userLocation]);

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={t('local_guide_title')} showMenu />
            <main className="p-4">
                <div className="mb-4">
                    <Input 
                        type="text"
                        placeholder={t('search_places')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {(['all', 'sites', 'restaurants', 'services'] as Category[]).map(cat => (
                            <Button 
                                key={cat}
                                variant={filter === cat ? 'primary' : 'outline'}
                                onClick={() => setFilter(cat)}
                                className="flex-shrink-0"
                            >
                                {t(cat)}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-2 items-center">
                         <Button
                            onClick={handleSortByDistanceToggle}
                            disabled={isGettingLocation}
                            variant="secondary"
                            className="flex-shrink-0"
                        >
                            {isGettingLocation ? t('getting_location') : isSortingByDistance ? t('sorted_closest') : t('show_closest')}
                        </Button>
                        <div className="flex-shrink-0 flex border rounded-lg bg-white shadow-sm">
                            <button 
                                onClick={() => setViewMode('list')} 
                                className={`p-2 rounded-l-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'text-dark'}`}
                                aria-label="List View"
                            >
                                <Icons.ListBullet />
                            </button>
                            <button 
                                onClick={() => setViewMode('map')} 
                                className={`p-2 rounded-r-lg ${viewMode === 'map' ? 'bg-primary text-white' : 'text-dark'}`}
                                aria-label="Map View"
                            >
                                <Icons.MapIcon />
                            </button>
                        </div>
                    </div>
                </div>
                {locationError && <p className="text-red-500 text-sm my-2 text-center">{locationError}</p>}


                {loading ? <LoadingSpinner /> : (
                    viewMode === 'list' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div key={item.id} className="cursor-pointer transform hover:scale-105 transition-transform" onClick={() => navigate(`/guide/${item.id}`)}>
                                    <Card className="h-full flex flex-col">
                                        <img src={item.image} alt={item.title[language]} className="w-full h-40 object-cover rounded-lg mb-4" />
                                        <h3 className="text-xl font-bold text-dark">{item.title[language]}</h3>
                                        {item.averageRating && (
                                            <div className="flex items-center gap-2 my-1">
                                                <StarRating rating={item.averageRating} size="sm" />
                                                <span className="text-sm text-gray-600">{item.averageRating.toFixed(1)}</span>
                                            </div>
                                        )}
                                        <p className="text-gray-600 mt-1 flex-grow">{stripHtml(item.description[language]).substring(0, 100)}...</p>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <MapView items={filteredItems} onMarkerClick={(id) => navigate(`/guide/${id}`)} />
                        </Card>
                    )
                )}
            </main>
        </div>
    );
};


export const GuideDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t, language } = useTranslations();
    const [item, setItem] = useState<LocalGuideItem | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [fact, setFact] = useState('');
    const [factLoading, setFactLoading] = useState(false);
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            if (id) {
                setLoading(true);
                const itemData = await api.getGuideItem(id);
                setItem(itemData || null);
                const reviewData = await api.getReviewsForGuideItem(id);
                setReviews(reviewData);
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);
    
    const handleGetFact = async () => {
        if (!item) return;
        setFactLoading(true);
        const newFact = await geminiService.getFunFact(item.title['en'], language);
        setFact(newFact);
        setFactLoading(false);
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!id) return;
        const newReview = await api.submitReview(id, rating, comment, 'Guest User');
        alert(t('review_submitted') + " It will be visible after admin approval.");
        setReviewModalOpen(false);
    };


    if (loading) return <div className="p-4"><LoadingSpinner/></div>;
    if (!item) return <div className="p-4">Item not found.</div>;

    return (
        <div className="min-h-screen bg-secondary">
            <Header title={item.title[language]} showBack />
            <main>
                <img src={item.image} alt={item.title[language]} className="w-full h-64 object-cover" />
                <div className="p-4">
                    <Card>
                        <h2 className="text-2xl font-bold text-dark">{item.title[language]}</h2>
                        {item.averageRating && (
                             <div className="flex items-center gap-2 my-2">
                                <StarRating rating={item.averageRating} />
                                <span className="text-lg font-bold text-gray-700">{item.averageRating.toFixed(1)}</span>
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                            <div className="content-display my-4 flex-grow" dangerouslySetInnerHTML={{ __html: item.description[language] }} />
                            <TTSButton textToSpeak={stripHtml(item.description[language])} className="mt-4" />
                        </div>
                        <p className="text-sm text-gray-600"><strong>{t('address')}:</strong> {item.address[language]}</p>
                        <p className="text-sm text-gray-600"><strong>{t('contact')}:</strong> {item.contact}</p>
                        <Map lat={item.coords.lat} lng={item.coords.lng} />
                        
                        <div className="mt-6">
                            <Button onClick={handleGetFact} disabled={factLoading} className="w-full flex items-center justify-center gap-2">
                                <Icons.Sparkles /> {t('ai_fun_fact')}
                            </Button>
                            {factLoading && <p className="text-center mt-2">{t('loading')}...</p>}
                            {fact && !factLoading && (
                                <div className="mt-4 p-4 bg-accent/20 rounded-lg flex items-start gap-2">
                                    <p className="text-dark flex-grow">{fact}</p>
                                    <TTSButton textToSpeak={fact} />
                                </div>
                            )}
                        </div>

                        <div className="mt-8 border-t pt-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold">{t('reviews')}</h3>
                                <Button variant="secondary" onClick={() => setReviewModalOpen(true)}>{t('leave_a_review')}</Button>
                            </div>
                            <ReviewList reviews={reviews} />
                        </div>
                    </Card>
                </div>
            </main>
            <Modal isOpen={isReviewModalOpen} onClose={() => setReviewModalOpen(false)} title={t('leave_a_review')}>
                <ReviewForm onSubmit={handleReviewSubmit} />
            </Modal>
        </div>
    );
};
