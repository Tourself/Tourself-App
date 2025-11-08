import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts';
import { useTranslations } from '../hooks';
import { Button, Card, Header, Input, NotificationOptIn, LoadingSpinner } from '../components';
import { geofencingService, api, calculateDistance } from '../services';
import { LocalGuideItem, HomePageContent, Quest } from '../types';

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

export const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslations();
  const navigate = useNavigate();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [messenger, setMessenger] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (id) {
      api.getQuest(id).then(data => {
        setQuest(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(res => setTimeout(res, 2000));

    const token = `TOURSELF-${id}-${Date.now()}`.slice(0, 24).toUpperCase();
    localStorage.setItem(`quest-token-${id!}`, token);
    
    // Save user name and initialize progress
    localStorage.setItem(`quest-user-${id!}`, fullName);
    if (quest) {
        localStorage.setItem(`quest-progress-${id!}`, JSON.stringify({
            correctAnswers: 0,
            totalSteps: quest.steps.length,
            completedSteps: []
        }));
    }
    
    setAccessToken(token);
    setPurchaseComplete(true);
    setIsProcessing(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!quest) {
    return <div className="p-4">Quest not found.</div>;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Header title={t('secure_checkout')} showBack />
      <main className="p-4 flex justify-center">
        <Card className="w-full max-w-md mt-8">
          {purchaseComplete ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-2">{t('quest_purchased')}</h2>
              <p className="mb-4">{t('access_token_info')}</p>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-lg my-4 border-dashed border-2 border-gray-400">
                {accessToken}
              </div>
              <Button onClick={() => navigate(`/quest/play/${id}/0`)} className="w-full">{t('start_quest')}</Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-dark mb-4">{quest.title[language]}</h2>
              <div className="mb-6 pb-4 border-b">
                <p className="text-3xl font-bold text-primary text-center">${quest.price.toFixed(2)}</p>
              </div>
              <form onSubmit={handlePayment} className="space-y-4">
                <Input
                  id="fullName"
                  label={t('full_name')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  id="email"
                  type="email"
                  label={t('email_address')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  id="messenger"
                  label={t('messenger_contact')}
                  value={messenger}
                  onChange={(e) => setMessenger(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? t('loading') : `${t('pay_now').replace('$9.99', `$${quest.price.toFixed(2)}`)}`}
                </Button>
              </form>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export const QuestCompletionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslations();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('A Valiant Adventurer');
  const [progress, setProgress] = useState<{ correctAnswers: number; totalSteps: number } | null>(null);

  useEffect(() => {
    if (id) {
      api.getQuest(id).then(data => {
        setQuest(data || null);
        
        const name = localStorage.getItem(`quest-user-${id}`);
        if (name) {
          setUserName(name);
        }

        const progressRaw = localStorage.getItem(`quest-progress-${id}`);
        if (progressRaw) {
          setProgress(JSON.parse(progressRaw));
        }

        setLoading(false);
      });
    }
  }, [id]);

  const handleDownload = () => {
    // Mock download
    alert("Certificate download started!");
  };

  const handleShare = async () => {
    if (navigator.share && quest && progress) {
      try {
        await navigator.share({
          title: `${t('congratulations')}!`,
          text: `I just completed the "${quest.title[language]}" quest and scored ${progress.correctAnswers}/${progress.totalSteps}! Check out TOURSELF.`,
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Error sharing result:', error);
      }
    } else {
      alert('Sharing is not supported on this device.');
    }
  };
  
  const completionDate = new Date().toLocaleDateString(language, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!quest) {
    return <div className="p-4">Quest not found.</div>;
  }
  
  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(241, 250, 238, 0.95), rgba(241, 250, 238, 0.95)), url('https://images.unsplash.com/photo-1579033461380-adb47c3eb938?q=80&w=1920&auto=format&fit=crop')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header title={t('quest_complete')} showBack />
      <main className="p-4 text-center">
        <Card>
          <h1 className="text-3xl font-bold text-primary mb-2">{t('congratulations')}</h1>
          <p className="text-lg text-gray-700">{t('completion_message')}</p>

          <div className="my-8 p-6 border-4 border-accent rounded-lg shadow-inner max-w-lg mx-auto" style={backgroundStyle}>
            <h2 className="text-4xl font-bold tracking-widest text-dark mb-4">TOURSELF</h2>
            <h3 className="text-3xl font-bold text-dark mb-4 drop-shadow-sm" style={{ fontFamily: "'Brush Script MT', cursive" }}>{t('certificate_of_completion')}</h3>
            <p className="text-md text-gray-700 mb-2">{t('awarded_to')}</p>
            <p className="text-4xl font-semibold text-primary mb-4 drop-shadow-sm" style={{ fontFamily: "'Brush Script MT', cursive" }}>{userName}</p>
            <p className="text-md text-gray-700">
              {t('for_completing')}
              <br/>
              <span className="font-bold text-dark text-lg">"{quest.title[language]}"</span>
              <br/>
              {t('quest')} {completionDate}
            </p>
            {progress && (
                <p className="mt-4 text-md text-gray-700 font-semibold">
                    {t('correctly_answered', { correct: String(progress.correctAnswers), total: String(progress.totalSteps) })}
                </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
            <Button onClick={handleDownload} className="flex-1">{t('download_certificate')}</Button>
            <Button onClick={handleShare} variant="secondary" className="flex-1">{t('share_result')}</Button>
            <Link to="/quests" className="flex-1">
              <Button variant="outline" className="w-full">{t('back_to_quests')}</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
};