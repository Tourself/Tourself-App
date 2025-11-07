import React, { useState, useEffect, useRef } from 'react';
// FIX: Import 'useNavigate' from 'react-router-dom' to resolve usage error.
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslations } from './hooks';
import { useAuth } from './contexts';
import { Icons } from './constants';
import { api } from './services';
import { Review, LocalGuideItem } from './types';
import { useTTS } from './hooks';

export const Menu: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useTranslations();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/home');
    };

    const navLinkClass = "block p-4 text-lg text-light hover:bg-primary transition-colors";
    
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            <div className={`fixed top-0 left-0 h-full w-64 bg-dark shadow-xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex justify-between items-center border-b border-gray-700">
                    <h2 className="text-xl font-bold text-light">{t('menu')}</h2>
                    <button onClick={onClose} className="text-light p-2 rounded-full hover:bg-white/20">
                        &times;
                        <span className="sr-only">{t('close')}</span>
                    </button>
                </div>
                <nav className="py-4">
                    <NavLink to="/home" className={navLinkClass} onClick={onClose}>{t('home')}</NavLink>
                    <NavLink to="/how-it-works" className={navLinkClass} onClick={onClose}>{t('how_quests_work')}</NavLink>
                    <NavLink to="/faq" className={navLinkClass} onClick={onClose}>{t('faq')}</NavLink>
                    <NavLink to="/contact-us" className={navLinkClass} onClick={onClose}>{t('contact_us')}</NavLink>
                    <NavLink to="/for-guides" className={navLinkClass} onClick={onClose}>{t('for_local_guides')}</NavLink>
                    <div className="my-4 border-t border-gray-700" />
                    {user ? (
                        <>
                            <NavLink to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard/quests'} className={navLinkClass} onClick={onClose}>
                                {t('my_dashboard')}
                            </NavLink>
                            <button onClick={handleLogout} className={`${navLinkClass} w-full text-left`}>{t('logout')}</button>
                        </>
                    ) : (
                        <NavLink to="/login" className={navLinkClass} onClick={onClose}>{t('login')}</NavLink>
                    )}
                </nav>
            </div>
        </>
    );
};

export const Header: React.FC<{ title: string; showBack?: boolean; showMenu?: boolean }> = ({ title, showBack = false, showMenu = false }) => {
  const { t } = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-dark text-light p-4 shadow-md sticky top-0 z-40 flex items-center">
        {showMenu && (
          <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-white/20 mr-2" aria-label={t('menu')}>
            <Icons.Menu />
          </button>
        )}
        {showBack && !showMenu && (
          <>
            <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-white/20">
              <Icons.ChevronLeft />
              <span className="sr-only">{t('back')}</span>
            </button>
            <Link to="/home" className="p-2 rounded-full hover:bg-white/20 ml-2" aria-label={t('home')}>
              <Icons.Home />
            </Link>
          </>
        )}
        <h1 className={`text-xl font-bold ${showBack ? 'ml-4' : ''}`}>{title}</h1>
      </header>
      {showMenu && <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
    </>
  );
};

// ... Rest of the components file remains the same
// FIX: Added 'size' prop to allow for different button sizes and fix the compilation error.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'rounded-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
  };
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-red-700 focus:ring-primary',
    secondary: 'bg-accent text-dark hover:bg-blue-300 focus:ring-accent',
    outline: 'bg-transparent border-2 border-dark text-dark hover:bg-dark hover:text-light focus:ring-dark',
  };
  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden p-6 ${className}`}>
      {children}
    </div>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, id, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      id={id}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      {...props}
    />
  </div>
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, id, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <textarea
      id={id}
      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      {...props}
    />
  </div>
);


export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, id, children, ...props }) => (
    <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select
            id={id}
            className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            {...props}
        >
            {children}
        </select>
    </div>
);


export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-dark">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export const Map: React.FC<{ lat: number, lng: number }> = ({ lat, lng }) => {
  const { t, language } = useTranslations();
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=${language}&z=15&output=embed`;

  return (
    <div className="my-4">
      <div className="relative aspect-video w-full rounded-lg overflow-hidden shadow-md">
        <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={true}
            loading="lazy"
            title={`Map of location at latitude ${lat} and longitude ${lng}`}
            referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
       <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-primary hover:underline">
        {t('get_directions')}
      </a>
    </div>
  );
};

export const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
);

export const StarRating: React.FC<{ rating: number; onRatingChange?: (rating: number) => void; size?: 'sm' | 'md' | 'lg' }> = ({ rating, onRatingChange, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const isInteractive = !!onRatingChange;
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

  return (
    <div className={`flex items-center ${isInteractive ? 'cursor-pointer' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <div
          key={star}
          onMouseEnter={() => isInteractive && setHoverRating(star)}
          onMouseLeave={() => isInteractive && setHoverRating(0)}
          onClick={() => isInteractive && onRatingChange(star)}
          role="button"
          aria-label={`Rate ${star} stars`}
        >
          <Icons.Star className={`${sizeClasses[size]} ${
            (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
          } transition-colors`} />
        </div>
      ))}
    </div>
  );
};

export const NotificationOptIn: React.FC = () => {
    const { t } = useTranslations();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const permissionStatus = sessionStorage.getItem('notification-permission');
        if (!permissionStatus) {
            setIsVisible(true);
        }
    }, []);

    const handleAllow = async () => {
        await api.requestNotificationPermission();
        setIsVisible(false);
    };

    const handleDeny = () => {
        sessionStorage.setItem('notification-permission', 'denied');
        setIsVisible(false);
    };
    
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-dark text-light p-4 shadow-lg z-50 animate-slide-up">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="font-bold text-lg">{t('notifications')}</h3>
                    <p className="text-sm text-gray-300">{t('notifications_prompt')}</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleAllow} variant="primary">{t('allow_notifications')}</Button>
                    <Button onClick={handleDeny} className="bg-secondary text-dark hover:bg-accent">{t('no_thanks')}</Button>
                </div>
            </div>
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
            `}</style>
        </div>
    );
};

export const ReviewList: React.FC<{ reviews: Review[] }> = ({ reviews }) => {
    const { t } = useTranslations();

    if (reviews.length === 0) {
        return <p className="text-gray-600 italic mt-4">{t('no_reviews_yet')}</p>;
    }

    return (
        <div className="space-y-4 mt-4">
            {reviews.map(review => (
                <div key={review.id} className="border-t pt-4">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-dark">{review.userName}</p>
                        <StarRating rating={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-gray-500">{review.date}</p>
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                </div>
            ))}
        </div>
    );
};

export const ReviewForm: React.FC<{ onSubmit: (rating: number, comment: string) => void }> = ({ onSubmit }) => {
    const { t } = useTranslations();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating > 0) {
            onSubmit(rating, comment);
            setRating(0);
            setComment('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <h4 className="text-lg font-bold">{t('leave_a_review')}</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('your_rating')}</label>
                <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            <Textarea
                id="comment"
                label={t('your_comment')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="..."
                required
            />
            <Button type="submit" disabled={rating === 0}>{t('submit_review')}</Button>
        </form>
    );
};

export const TTSButton: React.FC<{ textToSpeak: string; className?: string }> = ({ textToSpeak, className = '' }) => {
    const { play, stop, isPlaying, isLoading } = useTTS();

    const handleClick = () => {
        if (isPlaying) {
            stop();
        } else {
            play(textToSpeak);
        }
    };
    
    if (!textToSpeak) return null;

    if (isLoading) {
        return (
            <button className={`p-2 rounded-full text-gray-400 animate-pulse ${className}`} disabled>
                <Icons.Speaker />
            </button>
        );
    }

    return (
        <button onClick={handleClick} className={`p-2 rounded-full transition-colors hover:bg-accent/50 ${isPlaying ? 'text-primary' : 'text-dark'} ${className}`} aria-label={isPlaying ? 'Stop speech' : 'Play speech'}>
            {isPlaying ? <Icons.Stop /> : <Icons.Speaker />}
        </button>
    );
};

interface Point { x: number; y: number; }
interface Cluster {
  items: LocalGuideItem[];
  centerPoint: Point;
  id: string;
}

export const MapView: React.FC<{ items: LocalGuideItem[]; onMarkerClick: (id: string) => void }> = ({ items, onMarkerClick }) => {
    const [clusters, setClusters] = useState<Cluster[]>([]);
    const mapRef = React.useRef<HTMLDivElement>(null);
    const { language } = useTranslations();

    useEffect(() => {
        const calculateClusters = () => {
            if (!mapRef.current || items.length === 0) {
                setClusters([]);
                return;
            };

            const mapWidth = mapRef.current.offsetWidth;
            const mapHeight = mapRef.current.offsetHeight;
            if (mapWidth === 0 || mapHeight === 0) return;

            // Simplified bounds for Tbilisi
            const bounds = { north: 41.8, south: 41.6, west: 44.7, east: 44.95 };
            
            const project = (lat: number, lng: number): Point => {
                const y = mapHeight - ((lat - bounds.south) / (bounds.north - bounds.south)) * mapHeight;
                const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth;
                return { x, y };
            };

            const projectedItems = items.map(item => ({ item, point: project(item.coords.lat, item.coords.lng) }));

            const CLUSTER_RADIUS_PX = 60;
            const isClustered = new Array(items.length).fill(false);
            const newClusters: Cluster[] = [];

            for (let i = 0; i < items.length; i++) {
                if (isClustered[i]) continue;

                const current = projectedItems[i];
                const clusterItems = [current.item];
                isClustered[i] = true;

                for (let j = i + 1; j < items.length; j++) {
                    if (isClustered[j]) continue;

                    const other = projectedItems[j];
                    const distance = Math.sqrt(
                        Math.pow(current.point.x - other.point.x, 2) +
                        Math.pow(current.point.y - other.point.y, 2)
                    );

                    if (distance < CLUSTER_RADIUS_PX) {
                        clusterItems.push(other.item);
                        isClustered[j] = true;
                    }
                }
                newClusters.push({
                    items: clusterItems,
                    centerPoint: current.point,
                    id: current.item.id, // Use first item's ID as key
                });
            }
            setClusters(newClusters);
        };
        
        const handleResize = () => calculateClusters();
        window.addEventListener('resize', handleResize);
        const timer = setTimeout(calculateClusters, 50);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [items]);

    return (
        <div ref={mapRef} className="relative w-full aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden shadow-inner">
            <img src="https://picsum.photos/seed/tbilisimap/1200/900" alt="Tbilisi Map" className="w-full h-full object-cover opacity-50" />
            
            {clusters.map(cluster => {
                const isSingle = cluster.items.length === 1;
                const singleItem = isSingle ? cluster.items[0] : null;

                return (
                    <div
                        key={cluster.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${isSingle ? 'cursor-pointer hover:scale-110' : ''}`}
                        style={{ top: `${cluster.centerPoint.y}px`, left: `${cluster.centerPoint.x}px` }}
                        onClick={singleItem ? () => onMarkerClick(singleItem.id) : undefined}
                        title={singleItem ? singleItem.title[language] : `${cluster.items.length} places`}
                    >
                        {singleItem ? (
                            <div className="text-primary text-3xl">
                                <Icons.MapPin />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-primary/80 text-white rounded-full font-bold text-lg border-2 border-white shadow-lg">
                                {cluster.items.length}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const ImageUpload: React.FC<{
  label: string;
  currentImage: string | null;
  onImageUpload: (base64: string) => void;
}> = ({ label, currentImage, onImageUpload }) => {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex items-center space-x-4">
        {currentImage ? (
          <img src={currentImage} alt="Preview" className="w-24 h-24 object-cover rounded-md bg-gray-100" />
        ) : (
          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-md text-gray-400">
            No Image
          </div>
        )}
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        <Button type="button" variant="outline" onClick={handleClick}>
          {currentImage ? t('change_image') : t('upload_image')}
        </Button>
      </div>
    </div>
  );
};

export const LocationSearchInput: React.FC<{
  label: string;
  currentCoords: { lat: number; lng: number };
  onLocationChange: (coords: { lat: number; lng: number }) => void;
}> = ({ label, currentCoords, onLocationChange }) => {
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce effect to simulate geocoding
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        // Mock geocoding: generate random coords near Tbilisi center
        const newCoords = {
          lat: 41.7151 + (Math.random() - 0.5) * 0.1,
          lng: 44.8271 + (Math.random() - 0.5) * 0.1,
        };
        onLocationChange(newCoords);
      }
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onLocationChange]);

  return (
    <div>
      <Input
        label={label}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('location_search_placeholder')}
      />
      <p className="text-xs text-gray-500 mt-1">{t('location_info')}</p>
      <p className="text-sm font-medium text-gray-800 mt-2">
        {t('current_location')}: Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)}
      </p>
    </div>
  );
};

const RichTextButton: React.FC<{
    onMouseDown: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    title: string;
}> = ({ onMouseDown, children, title }) => (
    <button
        type="button"
        title={title}
        onMouseDown={onMouseDown} // Use onMouseDown to prevent losing selection
        className="p-2 border rounded-md bg-gray-100 hover:bg-gray-200"
    >
        {children}
    </button>
);

export const RichTextInput: React.FC<{
    label?: string;
    value: string;
    onChange: (newValue: string) => void;
}> = ({ label, value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync external value changes to the editor
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    
    const handleCommand = (e: React.MouseEvent, command: string, value?: string) => {
        e.preventDefault();
        execCmd(command, value);
    }

    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div className="border border-gray-300 rounded-md shadow-sm">
                <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
                    <RichTextButton title="Bold" onMouseDown={(e) => handleCommand(e, 'bold')}><b>B</b></RichTextButton>
                    <RichTextButton title="Italic" onMouseDown={(e) => handleCommand(e, 'italic')}><i>I</i></RichTextButton>
                    <RichTextButton title="Underline" onMouseDown={(e) => handleCommand(e, 'underline')}><u>U</u></RichTextButton>
                    <RichTextButton title="Unordered List" onMouseDown={(e) => handleCommand(e, 'insertUnorderedList')}>&bull; List</RichTextButton>
                    <RichTextButton title="Ordered List" onMouseDown={(e) => handleCommand(e, 'insertOrderedList')}>1. List</RichTextButton>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="block w-full min-h-[120px] p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                    dangerouslySetInnerHTML={{ __html: value }} // Initialize with value
                />
            </div>
        </div>
    );
};