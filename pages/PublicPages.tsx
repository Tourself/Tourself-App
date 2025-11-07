

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts';
import { useTranslations } from '../hooks';
import { Button, Card, Header, Input, NotificationOptIn, LoadingSpinner } from '../components';
import { geofencingService, api, calculateDistance } from '../services';
import { LocalGuideItem, HomePageContent } from '../types';

export const LanguageSelectorPage: React.FC = () => {
  const { setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleSelect = (lang: 'en' | 'ru' | 'ge') => {
    setLanguage(lang);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-dark mb-6">{t('select_language')}</h1>
        <div className="space-y-4">
          <Button onClick={() => handleSelect('en')} className="w-full">{t('english')}</Button>
          <Button onClick={() => handleSelect('ru')} className="w-full">{t('russian')}</Button>
          <Button onClick={() => handleSelect('ge')} className="w-full">{t('georgian')}</Button>
        </div>
      </Card>
    </div>
  );
};

export const HomePage: React.FC = () => {
    const { t, language } = useTranslations();
    const [nearestSite, setNearestSite] = useState<LocalGuideItem | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [content, setContent] = useState<HomePageContent | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(true);

    useEffect(() => {
        api.getHomePageContent().then(data => {
            setContent(data);
            setIsLoadingContent(false);
        });
    }, []);

    useEffect(() => {
        let isMounted = true;
        
        const findNearestSite = (position: GeolocationPosition) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            api.getGuideItems().then(items => {
                if (!isMounted) return;

                const sites = items.filter(item => item.category === 'sites');
                if (sites.length === 0) {
                    setIsLoadingLocation(false);
                    return;
                }
                
                let closest = sites[0];
                let minDistance = calculateDistance(userLocation.lat, userLocation.lng, sites[0].coords.lat, sites[0].coords.lng);

                for (let i = 1; i < sites.length; i++) {
                    const distance = calculateDistance(userLocation.lat, userLocation.lng, sites[i].coords.lat, sites[i].coords.lng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closest = sites[i];
                    }
                }
                setNearestSite(closest);
                setIsLoadingLocation(false);
            });
        };

        const startGeofencing = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    findNearestSite(position);
                    
                    const permissionStatus = sessionStorage.getItem('notification-permission');
                    if (permissionStatus !== 'granted') return;

                    api.getGuideItems().then(items => {
                        if (isMounted) {
                            geofencingService.startWatching(items, (nearbyItem: LocalGuideItem) => {
                                const title = t('nearby_notification_title');
                                const message = t('nearby_notification_body', { itemName: nearbyItem.title[language] });
                                api.sendNotification(title, message);
                            });
                        }
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    setIsLoadingLocation(false); // Stop loading if user denies location
                },
                { timeout: 10000 }
            );
        };

        startGeofencing();

        return () => {
            isMounted = false;
            geofencingService.stopWatching();
        };
    }, [t, language]);

    if (isLoadingContent) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }
    
    if (!content) {
        return <div className="p-4">Error loading page content.</div>
    }

    const heroStyle = {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${content.heroImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
    };

    return (
        <div className="min-h-screen" style={heroStyle}>
            <Header title={t('home')} showMenu />
            <div className="text-center p-8 text-light">
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">{content.title[language]}</h1>
                <p className="mt-2 text-lg text-white drop-shadow-md">{content.subtitle[language]}</p>
            </div>
            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Link to="/guide" className="block transform hover:scale-105 transition-transform">
                    <Card className="h-full bg-white/90 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-primary mb-2">{content.card1Title[language]}</h2>
                        <p className="text-gray-600">{content.card1Description[language]}</p>
                    </Card>
                </Link>
                <Link to="/quests" className="block transform hover:scale-105 transition-transform">
                    <Card className="h-full bg-white/90 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-primary mb-2">{content.card2Title[language]}</h2>
                        <p className="text-gray-600">{content.card2Description[language]}</p>
                    </Card>
                </Link>
            </div>
            <div className="p-4 md:px-8 max-w-4xl mx-auto">
                {isLoadingLocation ? (
                    <Card className="bg-white/90 backdrop-blur-sm"><LoadingSpinner /></Card>
                ) : nearestSite && (
                    <Card className="bg-white/90 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-dark mb-1">{t('discover_nearest_attraction')}</h2>
                        <p className="text-gray-600 mb-4">{t('nearest_to_you')}</p>
                        <Link to={`/guide/${nearestSite.id}`} className="block transform hover:scale-105 transition-transform">
                            <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg bg-secondary">
                                <img src={nearestSite.image} alt={nearestSite.title[language]} className="w-full md:w-1/3 h-40 object-cover rounded-lg" />
                                <div>
                                    <h3 className="text-xl font-bold text-dark">{nearestSite.title[language]}</h3>
                                    <p className="text-gray-700 mt-2">{nearestSite.description[language].substring(0, 120)}...</p>
                                    <p className="text-primary font-semibold mt-4">{t('view_details')}</p>
                                </div>
                            </div>
                        </Link>
                    </Card>
                )}
            </div>
            <NotificationOptIn />
        </div>
    );
};

export const CheckoutPage: React.FC = () => { /* ... existing code ... */ };
export const QuestCompletionPage: React.FC = () => { /* ... existing code ... */ };