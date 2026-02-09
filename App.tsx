import React, { useState, useEffect, useRef } from 'react';
import { AppView, Professional, Project, ChatMessage, DriveFile, BroadcastRequest, Collection, Invoice, WallPost, SavedCard, BankAccount, ProjectMedia, WallComment, Review } from './types';
import { MOCK_PROS, INITIAL_PROJECTS, MOCK_WALL_POSTS } from './constants';
import { Whiteboard } from './components/Whiteboard';
import { GoogleDrivePicker } from './components/GoogleDrivePicker';
import { CameraCapture } from './components/CameraCapture';
import { ExpertDashboard } from './components/ExpertDashboard';
import { BuildersWall } from './components/BuildersWall';
import { LocalExpertsList } from './components/LocalExpertsList';
import { ProfileView } from './components/ProfileView';
import { ProfileEditView } from './components/ProfileEditView';
import { ClientSettingsView } from './components/ClientSettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoicePaymentModal } from './components/InvoicePaymentModal';
import { MultiOfferModal } from './components/MultiOfferModal';
import { ReviewModal } from './components/ReviewModal';
import { ReloadCreditsModal } from './components/ReloadCreditsModal';
import { AuthView } from './components/AuthView';
import { geminiService } from './services/geminiService';
import { LiveCallSession } from './services/liveService';

interface AppNotification {
  id: string;
  message: string;
  type: 'offer' | 'info' | 'success';
  broadcastId?: string; // For offer notifications, store the broadcast ID
  onClick?: () => void; // Optional click handler
}

const CREDIT_TO_USD_RATE = 0.5;

const PROMPT_SUGGESTIONS = [
  "How do I fix a leaky faucet?",
  "Build a wooden deck plan",
  "Kitchen cabinet installation guide",
  "Modern bathroom tiling ideas",
  "Wiring a three-way switch",
  "How to patch drywall holes",
  "Sourcing eco-friendly lumber",
  "Mounting a 65-inch TV on drywall",
  "Building a raised garden bed",
  "Choosing the right concrete mix",
  "Install a smart thermostat",
  "Replace a ceiling fan",
  "Leveling a subfloor",
  "Sanding and staining hardwood floors",
  "Installing a backsplash in the kitchen",
  "Best way to frame a basement wall",
  "Repairing a cracked driveway",
  "Upgrading to an EV charger at home",
  "Designing a custom walk-in closet",
  "Waterproofing a retaining wall",
  "Find top-rated YouTube build guides",
  "Safety protocols for household wiring",
  "Immediate water shut-off and pipe repair steps",
  "Analyze assembly manual and parts photo",
  "Source building materials at better local prices",
  "Structural guidance for wall mounting"
];

const QUICK_STARTERS = [
  "Fix a leaky pipe",
  "Build a deck",
  "Mount a TV",
  "Wiring help",
  "Tile a bathroom",
  "Sourcing materials",
  "Cabinet install"
];

export const WALLPAPER_PRESETS = [
  { id: 'none', name: 'Clean Slate', class: 'bg-slate-50' },
  { id: 'mint', name: 'Mint Morning', class: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white' },
  { id: 'peach', name: 'Peach Sunset', class: 'bg-gradient-to-br from-orange-50 via-rose-50 to-white' },
  { id: 'lavender', name: 'Lavender Mist', class: 'bg-gradient-to-br from-violet-50 via-indigo-50 to-white' },
  { id: 'sky', name: 'Daydream Blue', class: 'bg-gradient-to-br from-sky-50 via-blue-50 to-white' },
  { id: 'mesh', name: 'Neural Pastel', class: 'bg-[radial-gradient(circle_at_50%_50%,rgba(254,244,255,1)_0%,rgba(240,249,255,1)_100%)]' },
  // Printed/Pattern Presets
  { id: 'grid', name: 'Architect Grid', class: 'bg-white bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]' },
  { id: 'dots', name: 'Draft Dots', class: 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]' },
  { id: 'herringbone', name: 'Tiled Slate', class: 'bg-slate-50 opacity-80 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,#f1f5f9_20px,#f1f5f9_40px)]' }
];

const App: React.FC = () => {
  // SESSION-SPECIFIC STATE (sessionStorage)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('buildsync_v15_auth') === 'true';
  });
  const [userRole, setUserRole] = useState<'client' | 'expert'>(() => {
    return (sessionStorage.getItem('buildsync_v15_role') as any) || 'client';
  });
  const [userName, setUserName] = useState<string>(() => {
    return sessionStorage.getItem('buildsync_v15_username') || 'Sarah Jenkins';
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return sessionStorage.getItem('buildsync_v15_avatar') || 'https://picsum.photos/seed/sarah/100/100';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_email');
    return saved !== null ? saved : 'sarah.jenkins@buildsync.com';
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_phone');
    return saved !== null ? saved : '';
  });
  const [userLocation, setUserLocation] = useState<{ country: string, city: string, region: string, zipCode: string }>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_location');
    return saved ? JSON.parse(saved) : { country: 'United States', city: 'Seattle', region: 'Washington', zipCode: '98101' };
  });
  const [userCredits, setUserCredits] = useState<number>(() => {
    return Number(sessionStorage.getItem('buildsync_v15_credits')) || 0;
  });
  const [myExpertProfile, setMyExpertProfile] = useState<Professional>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_expert_profile');
    return saved ? JSON.parse(saved) : MOCK_PROS[0];
  });
  const [savedCards, setSavedCards] = useState<SavedCard[]>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_cards');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', brand: 'visa', last4: '4242', expiry: '12/25', isDefault: true, nickname: 'Main Workspace Card' },
      { id: 'c2', brand: 'mastercard', last4: '8812', expiry: '08/24', isDefault: false, nickname: 'Supplies Card' }
    ];
  });
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(() => {
    const saved = sessionStorage.getItem('buildsync_v15_bank');
    return saved ? JSON.parse(saved) : null;
  });

  // SHARED-APP STATE (localStorage)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [broadcasts, setBroadcasts] = useState<BroadcastRequest[]>([]);
  const [registeredExperts, setRegisteredExperts] = useState<Professional[]>(() => {
    const saved = localStorage.getItem('buildsync_v15_experts');
    return saved ? JSON.parse(saved) : [];
  });
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('buildsync_v15_collections');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'General Builds', postIds: [] }];
  });
  const [wallPosts, setWallPosts] = useState<WallPost[]>(() => {
    const saved = localStorage.getItem('buildsync_v15_wallposts');
    return saved ? JSON.parse(saved) : MOCK_WALL_POSTS;
  });

  // UI / NON-PERSISTED STATE
  const [currentView, setCurrentView] = useState<AppView>(AppView.WORKSPACE);
  const [wallpaperId, setWallpaperId] = useState<string>(() => {
    return localStorage.getItem('buildsync_v15_wallpaper') || 'mesh';
  });
  const [customWallpaper, setCustomWallpaper] = useState<string | null>(() => {
    return localStorage.getItem('buildsync_v15_custom_wallpaper');
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<Professional | null>(null);
  const [cameFromWall, setCameFromWall] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState([true, false, true, true]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeProjectTab, setActiveProjectTab] = useState<'ai' | 'expert' | 'vault' | 'summaries'>('ai');
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [livePersona, setLivePersona] = useState<'ai' | 'expert'>('ai');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReloadModalOpen, setIsReloadModalOpen] = useState(false);
  const [offerBroadcastId, setOfferBroadcastId] = useState<string | null>(null);
  const [pendingSnapshot, setPendingSnapshot] = useState<string | undefined>(undefined);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveSessionRef = useRef<LiveCallSession | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Refs for storage listener to avoid stale closures
  const userRoleRef = useRef(userRole);
  useEffect(() => { userRoleRef.current = userRole; }, [userRole]);
  const broadcastsRef = useRef(broadcasts);
  useEffect(() => { broadcastsRef.current = broadcasts; }, [broadcasts]);
  const prevProjectsRef = useRef(projects);
  useEffect(() => { prevProjectsRef.current = projects; }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  // SESSION PERSISTENCE (sessionStorage)
  useEffect(() => { sessionStorage.setItem('buildsync_v15_auth', isAuthenticated.toString()); }, [isAuthenticated]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_role', userRole); }, [userRole]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_username', userName); }, [userName]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_avatar', userAvatar); }, [userAvatar]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_email', userEmail); }, [userEmail]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_phone', userPhone); }, [userPhone]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_location', JSON.stringify(userLocation)); }, [userLocation]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_credits', userCredits.toString()); }, [userCredits]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_expert_profile', JSON.stringify(myExpertProfile)); }, [myExpertProfile]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_cards', JSON.stringify(savedCards)); }, [savedCards]);
  useEffect(() => { sessionStorage.setItem('buildsync_v15_bank', JSON.stringify(bankAccount)); }, [bankAccount]);

  // SHARED PERSISTENCE (localStorage)
  useEffect(() => { localStorage.setItem('buildsync_v15_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('buildsync_v15_broadcasts', JSON.stringify(broadcasts)); }, [broadcasts]);
  useEffect(() => { localStorage.setItem('buildsync_v15_experts', JSON.stringify(registeredExperts)); }, [registeredExperts]);
  useEffect(() => { localStorage.setItem('buildsync_v15_collections', JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem('buildsync_v15_wallposts', JSON.stringify(wallPosts)); }, [wallPosts]);
  useEffect(() => { localStorage.setItem('buildsync_v15_wallpaper', wallpaperId); }, [wallpaperId]);
  useEffect(() => {
    if (customWallpaper) localStorage.setItem('buildsync_v15_custom_wallpaper', customWallpaper);
    else localStorage.removeItem('buildsync_v15_custom_wallpaper');
  }, [customWallpaper]);

  // Cross-tab state synchronization listener
  useEffect(() => {
    const syncState = (event: StorageEvent) => {
      if (!event.key || !event.newValue) return;

      try {
        const data = JSON.parse(event.newValue);
        switch (event.key) {
          case 'buildsync_v15_projects':
            setProjects(data);
            // Verify if a new project was assigned to me as an expert
            if (userRoleRef.current === 'expert' && data.length > prevProjectsRef.current.length) {
              const newProjects = data.filter((p: Project) => !prevProjectsRef.current.find((old: Project) => old.id === p.id));
              const myNewProject = newProjects.find((p: Project) => p.assignedProId === myExpertProfile.id);

              if (myNewProject) {
                addNotification(`New Project Accepted: ${myNewProject.title}`, "success");
                // Optional: Play a sound or vibrate
              }
            }
            break;
          case 'buildsync_v15_broadcasts':
            setBroadcasts(prev => {
              // Functional update to detect changes and prevent loops
              if (JSON.stringify(prev) === event.newValue) return prev;

              // Only notify the expert if new items were added (indicating a new broadcast from a builder)
              if (userRoleRef.current === 'expert' && data.length > prev.length) {
                addNotification("New help signal detected on the network!", "info");
              }

              // If client, check if offer counts changed
              if (userRoleRef.current === 'client') {
                // Find which broadcast(s) got new offers
                const broadcastsWithNewOffers = data.filter(newBroadcast => {
                  const oldBroadcast = prev.find(b => b.id === newBroadcast.id);
                  const oldOfferCount = oldBroadcast?.offers?.length || 0;
                  const newOfferCount = newBroadcast.offers?.length || 0;
                  return newOfferCount > oldOfferCount && newOfferCount > 0;
                });

                if (broadcastsWithNewOffers.length > 0) {
                  // Use the first broadcast with new offers (or could show multiple notifications)
                  const broadcastId = broadcastsWithNewOffers[0].id;
                  addNotification("An expert has responded to your broadcast!", "success", broadcastId);
                }
              }

              return data;
            });
            break;
          case 'buildsync_v15_wallposts':
            setWallPosts(data);
            break;
          case 'buildsync_v15_collections':
            setCollections(data);
            break;
          case 'buildsync_v15_experts':
            setRegisteredExperts(data);
            break;
          default:
            break;
        }
      } catch (e) {
        console.error("Failed to parse storage update:", e);
      }
    };

    window.addEventListener('storage', syncState);

    return () => {
      window.removeEventListener('storage', syncState);
    };
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      // First check if we have an API key from environment variable
      const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Checking for API key...');
        console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '***exists***' : 'not found');
        console.log('GEMINI_API_KEY:', import.meta.env.GEMINI_API_KEY ? '***exists***' : 'not found');
        console.log('All env vars:', Object.keys(import.meta.env).filter(k => k.includes('GEMINI') || k.includes('API')));
      }

      if (envApiKey && envApiKey.trim() !== '') {
        console.log('API key found in environment variable');
        setHasApiKey(true);
        return;
      }

      // Fallback to AI Studio API check (for Google AI Studio environment)
      try {
        // @ts-ignore
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          console.log('AI Studio API key check:', hasKey);
          setHasApiKey(hasKey);
        } else {
          console.log('AI Studio API not available');
          setHasApiKey(false);
        }
      } catch (e) {
        console.error('Error checking API key:', e);
        setHasApiKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const handleLogin = (
    name: string,
    role: 'client' | 'expert',
    isRegistering?: boolean,
    regData?: {
      identifier: string;
      location?: { country: string; region: string; city: string; zipCode: string };
      card?: { number: string; expiry: string; cvv: string; nameOnCard: string; zipCode: string };
      proData?: {
        specialty: string;
        category: any;
        experience: string;
        hourlyRate: string;
        bio: string;
        skills: string[];
      };
      subscription?: string;
    }
  ) => {
    setUserName(name);
    setUserRole(role);
    setIsAuthenticated(true);
    setCurrentView(role === 'client' ? AppView.WORKSPACE : AppView.EXPERT_POOL);

    if (role === 'expert') {
      if (isRegistering && regData?.proData) {
        const newExpertProfile: Professional = {
          id: `expert-${Date.now()}`,
          name: name,
          specialty: regData.proData.specialty,
          category: regData.proData.category,
          rating: 0,
          reviewCount: 0,
          experience: regData.proData.experience,
          location: regData.location ? `${regData.location.city}, ${regData.location.country}` : 'Unknown',
          city: regData.location?.city || 'Seattle',
          region: regData.location?.region || 'Washington',
          zipCode: regData.location?.zipCode || '98101',
          avatar: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/200/200`,
          bio: regData.proData.bio,
          skills: regData.proData.skills,
          portfolio: [],
          hourlyRate: regData.proData.hourlyRate,
          availability: 'Available Now',
          expertPlan: (regData as any).expertPlan || 'pro',
          reviews: []
        };
        setMyExpertProfile(newExpertProfile);
        setRegisteredExperts(prev => [...prev, newExpertProfile]);
      } else {
        setMyExpertProfile(prev => ({ ...prev, name: name }));
      }
    }

    if (regData) {
      const iden = regData.identifier;
      if (iden.includes('@')) {
        setUserEmail(iden);
        setUserPhone('');
      } else {
        setUserPhone(iden);
        setUserEmail('');
      }

      if (regData.location) {
        setUserLocation(regData.location);
      }
    }

    if (isRegistering && regData && regData.card) {
      const newCard: SavedCard = {
        id: `c-reg-${Date.now()}`,
        brand: 'visa',
        last4: regData.card.number.replace(/\s+/g, '').slice(-4),
        expiry: regData.card.expiry,
        isDefault: true,
        nickname: role === 'expert' ? 'Professional Payout Card' : 'Default Build Card'
      };
      setSavedCards([newCard]);
      if (role === 'client') {
        setUserCredits(50);
        addNotification("Welcome bonus! 50 BuildSync credits added.", "success");
      }
      addNotification("Registration finalized. Secure payment link established.", "success");
    } else {
      addNotification(`Welcome back, ${name}. Link established.`, "success");
    }
  };

  const handleLogout = () => {
    // Clear session-specific data
    sessionStorage.removeItem('buildsync_v15_auth');
    sessionStorage.removeItem('buildsync_v15_role');
    sessionStorage.removeItem('buildsync_v15_username');
    sessionStorage.removeItem('buildsync_v15_avatar');
    // etc. for all sessionStorage keys
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('buildsync_v15_')) {
        sessionStorage.removeItem(key);
      }
    });

    setIsAuthenticated(false);
    setActiveProjectId(null);
    setCurrentView(AppView.WORKSPACE);
    addNotification("Session terminated.", "info");
    window.location.reload();
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeProject, isTyping, activeProjectTab]);

  const addNotification = (message: string, type: AppNotification['type'], broadcastId?: string) => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const note: AppNotification = {
      id: uniqueId,
      message,
      type,
      broadcastId,
      onClick: broadcastId ? () => {
        // Find the broadcast and open the modal using the latest broadcasts state
        const broadcast = broadcastsRef.current.find(b => b.id === broadcastId);
        if (broadcast && broadcast.offers && broadcast.offers.length > 0) {
          // With new Offer type, we have the profiles directly in the offers
          setOfferBroadcastId(broadcastId);
        } else {
          addNotification("This broadcast has no offers yet.", "info");
        }
      } : undefined
    };
    setNotifications(prev => [...prev, note]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== uniqueId));
    }, 5000);
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSendMessage = async (text: string = inputText, imageBase64?: string) => {
    if (!hasApiKey) {
      handleSelectKey();
      return;
    }

    const finalImage = imageBase64 || pendingSnapshot;
    if (!text.trim() && !finalImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: userRole === 'client' ? 'user' : 'expert',
      text,
      canvasSnapshot: finalImage
    };

    let targetId = activeProjectId;
    if (!targetId) {
      targetId = `proj-${Date.now()}`;
      const newProject: Project = {
        id: targetId, title: text.slice(0, 25) + '...', status: 'planning', lastUpdated: 'Just now', summary: text,
        aiMessages: [userMsg], expertMessages: [], media: [], files: [], summaries: []
      };
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(targetId);
      setCurrentView(AppView.WORKSPACE);
    } else {
      setProjects(prev => prev.map(p => p.id === targetId ? {
        ...p,
        aiMessages: activeProjectTab === 'ai' ? [...p.aiMessages, userMsg] : p.aiMessages,
        expertMessages: activeProjectTab === 'expert' ? [...p.expertMessages, userMsg] : p.expertMessages,
      } : p));
    }

    if (activeProjectTab === 'ai' || !activeProjectId) {
      setIsTyping(true);
      try {
        const response = await geminiService.getDIYAdvice(text, activeProject?.summary, finalImage);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: response.text,
          generatedImages: response.images,
          groundingSources: response.groundingSources
        };
        setProjects(prev => prev.map(p => p.id === targetId ? { ...p, aiMessages: [...p.aiMessages, aiMsg] } : p));
      } catch (e) {
        if (e instanceof Error && e.message.includes("Requested entity was not found")) {
          setHasApiKey(false);
          addNotification("Neural bridge session lost. Please re-connect.", "info");
        } else {
          addNotification("AI Bridge communication error.", "info");
        }
      } finally { setIsTyping(false); }
    }

    setInputText('');
    setPendingSnapshot(undefined);
  };

  const handleReconnectExpert = () => {
    if (activeProject && activeProject.status === 'completed' && activeProject.assignedProId) {
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        status: 'in-progress',
        assignedProId: p.assignedProId,
        assignedProName: p.assignedProName,
        expertMessages: [...p.expertMessages, {
          id: `sys-${Date.now()}`,
          role: 'system_summary',
          text: `Signal re-established with ${p.assignedProName}. Project reactivated for ongoing collaboration.`
        }]
      } : p));
      addNotification(`Reconnected with ${activeProject.assignedProName}`, "success");
      setActiveProjectTab('expert');
    }
  };

  const handleFindNewExpert = () => {
    if (!activeProject || activeProject.status !== 'completed') return;

    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      status: 'planning',
      assignedProId: undefined,
      assignedProName: undefined,
      expertMessages: [...p.expertMessages, {
        id: `sys-${Date.now()}`,
        role: 'system_summary',
        text: `Project reactivated. You can now broadcast for a new expert to take over.`
      }]
    } : p));
    addNotification(`Ready to find a new expert for '${activeProject.title}'`, "info");
    setActiveProjectTab('expert');
  };

  const handleCreateBroadcast = () => {
    const summary = inputText || activeProject?.summary || "General Build Inquiry";
    const newBroadcast: BroadcastRequest = {
      id: `br-${Date.now()}`,
      clientId: 'sarah-123',
      clientName: userName,
      problemSummary: summary,
      category: 'General',
      timestamp: 'Just now',
      status: 'open',
      offers: [],
      urgency: 'medium'
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
    addNotification("Help signal broadcasted to Expert Network. Network listening...", "success");
    setInputText('');
  };

  const handleExpertOffer = (req: BroadcastRequest) => {
    // Create full offer object with current expert profile
    const newOffer: any = { // Using any temporarily to avoid circular dep issues during refactor, strictly it is Offer
      expertId: myExpertProfile.id,
      expertName: myExpertProfile.name,
      expertAvatar: myExpertProfile.avatar,
      profile: myExpertProfile,
      timestamp: 'Just now'
    };

    setBroadcasts(prev => prev.map(r => r.id === req.id ? {
      ...r,
      status: 'offer_received',
      offers: [...(r.offers || []), newOffer]
    } : r));
    addNotification(`Offer sent to ${req.clientName}`, "success");
  };

  const handleDismissBroadcast = (reqId: string) => {
    setDismissedBroadcastIds(prev => [...prev, reqId]);
    addNotification("Signal suppressed.", "info");
  };

  const handleApproveExpert = (req: BroadcastRequest | null, expert: Professional) => {
    const targetProjId = activeProjectId || `proj-${Date.now()}`;
    const projectExists = projects.some(p => p.id === targetProjId);

    if (projectExists) {
      setProjects(prev => prev.map(p => p.id === targetProjId ? {
        ...p,
        status: 'in-progress',
        assignedProId: expert.id,
        assignedProName: expert.name,
        expertMessages: [...p.expertMessages, {
          id: `sys-${Date.now()}`,
          role: 'system_summary',
          text: `Expert ${expert.name} has joined the link. Initial project context transmitted.`
        }]
      } : p));
    } else {
      const summary = req?.problemSummary || "Direct Expert Collaboration";
      const newProj: Project = {
        id: targetProjId,
        title: summary.slice(0, 20) + "...",
        status: 'in-progress',
        lastUpdated: 'Just now',
        summary: summary,
        aiMessages: [],
        expertMessages: [{
          id: `sys-${Date.now()}`,
          role: 'system_summary',
          text: `Expert ${expert.name} has joined the link. Match finalized.`
        }],
        media: [],
        files: [],
        summaries: [],
        assignedProId: expert.id,
        assignedProName: expert.name
      };
      setProjects(prev => [newProj, ...prev]);
      setActiveProjectId(targetProjId);
    }

    if (req) {
      setBroadcasts(prev => prev.filter(b => b.id !== req.id));
    }
    setOfferBroadcastId(null);
    setCurrentView(AppView.WORKSPACE);
    setActiveProjectTab('expert');
    addNotification(`Linked with ${expert.name}. Expert Signal established.`, "success");
  };

  const handleSendInvoice = (inv: Omit<Invoice, 'id' | 'status' | 'createdAt'>) => {
    const newInvoice: Invoice = { ...inv, id: `inv-${Date.now()}`, status: 'pending', createdAt: new Date().toLocaleDateString() };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, invoice: newInvoice } : p));
    addNotification("Invoice transmitted to client.", "success");
    setIsInvoiceModalOpen(false);
  };

  const handlePayInvoice = () => {
    if (!activeProject?.invoice) return;
    const invoiceAmount = activeProject.invoice.amount;
    const creditDollarValue = userCredits * 0.5;
    let creditsUsed = 0;
    let finalChargeToCard = 0;

    if (creditDollarValue >= invoiceAmount) {
      creditsUsed = Math.ceil(invoiceAmount / 0.5);
      finalChargeToCard = 0;
    } else {
      creditsUsed = userCredits;
      finalChargeToCard = invoiceAmount - creditDollarValue;
    }

    setUserCredits(prev => prev - creditsUsed);
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      invoice: p.invoice ? { ...p.invoice, status: 'paid' } : undefined,
      expertMessages: [...p.expertMessages, {
        id: `sys-pay-${Date.now()}`,
        role: 'system_summary',
        text: `Invoice Paid. Breakdown: $${(creditsUsed * 0.5).toFixed(2)} applied from BuildSync credits (${creditsUsed} credits), and $${finalChargeToCard.toFixed(2)} charged to your default card.`
      }]
    } : p));

    addNotification(
      finalChargeToCard > 0
        ? `Paid with ${creditsUsed} credits + $${finalChargeToCard.toFixed(2)} on card.`
        : `Full payment covered by ${creditsUsed} BuildSync credits.`,
      "success"
    );
    setIsPaymentModalOpen(false);
  };

  const handleReloadCredits = (credits: number, cost: number) => {
    setUserCredits(prev => prev + credits);
    setIsReloadModalOpen(false);
    addNotification(`Payment Approved. ${credits} credits added to your Neural Hub.`, "success");
  };

  const handleEndExpertConversation = async () => {
    if (!activeProjectId || !activeProject) return;

    // Add closing message immediately
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      expertMessages: [...p.expertMessages, {
        id: `sys-end-${Date.now()}`,
        role: 'system_summary',
        text: `Conversation session ended by ${userName}. The expert remains assigned to your project. Generating AI summary of this session...`
      }]
    } : p));
    addNotification("Conversation session finalized. Analyzing...", "info");

    try {
      // Prepare context for AI
      const historyText = activeProject.expertMessages.map(m =>
        `[${m.role.toUpperCase()}]: ${m.text}`
      ).join('\n');

      const summaryText = await geminiService.summarizeProjectConversation(historyText);

      // Save summary and update status
      setProjects(prev => prev.map(p => p.id === activeProjectId ? {
        ...p,
        summaries: [...(p.summaries || []), {
          id: Date.now().toString(),
          title: `Session Summary - ${new Date().toLocaleDateString()}`,
          content: summaryText,
          date: new Date().toLocaleString()
        }]
      } : p));

      addNotification("Session summary has been added to Milestones.", "success");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      addNotification("Failed to generate AI summary.", "info");
    }
  };

  const handleResolveProject = () => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, status: 'completed' } : p));
    if (userRole === 'client' && activeProject?.assignedProId) {
      setIsReviewModalOpen(true);
    } else {
      setActiveProjectTab('summaries');
      addNotification("Project marked as done and archived.", "success");
    }
  };

  const handleReviewSubmit = (reviewData: any) => {
    const newReview: Review = {
      id: `rev-plt-${Date.now()}`,
      reviewerName: userName,
      reviewerAvatar: userAvatar,
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: 'Just now',
      aspects: reviewData.aspects
    };

    const proToUpdate = MOCK_PROS.find(p => p.id === activeProject?.assignedProId);
    if (proToUpdate) {
      if (userRole === 'expert' && myExpertProfile.id === proToUpdate.id) {
        setMyExpertProfile(prev => ({
          ...prev,
          pendingReviews: [...(prev.pendingReviews || []), newReview]
        }));
      }
    }

    setIsReviewModalOpen(false);
    setActiveProjectTab('summaries');
    addNotification("Feedback transmitted. Thank you for building with us!", "success");
  };

  const handleApproveReview = (reviewId: string) => {
    setMyExpertProfile(prev => {
      const review = prev.pendingReviews?.find(r => r.id === reviewId);
      if (!review) return prev;
      const newReviewCount = prev.reviewCount + 1;
      const newRating = parseFloat(((prev.rating * prev.reviewCount + review.rating) / newReviewCount).toFixed(1));
      return {
        ...prev,
        reviews: [review, ...prev.reviews],
        pendingReviews: prev.pendingReviews?.filter(r => r.id !== reviewId),
        reviewCount: newReviewCount,
        rating: newRating
      };
    });
    addNotification("Review approved and added to your public profile.", "success");
  };

  const handleDiscardReview = (reviewId: string) => {
    setMyExpertProfile(prev => ({
      ...prev,
      pendingReviews: prev.pendingReviews?.filter(r => r.id !== reviewId)
    }));
    addNotification("Review discarded.", "info");
  };

  const handleSavePost = (postId: string, collectionId: string) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        if (c.postIds.includes(postId)) return c;
        return { ...c, postIds: [...c.postIds, postId] };
      }
      return c;
    }));
    addNotification("Achievement saved to Hub.", "success");
  };

  const handleCreateCollection = (name: string, autoSavePostId?: string) => {
    const newId = `coll-${Date.now()}`;
    const newColl: Collection = { id: newId, name, postIds: autoSavePostId ? [autoSavePostId] : [] };
    setCollections(prev => [...prev, newColl]);
    addNotification(`Archive '${name}' created.`, "success");
    return newId;
  };

  const handleAddWallPost = (content: string, image?: string, video?: string) => {
    const newPost: WallPost = {
      id: `wall-${Date.now()}`,
      authorName: userName,
      authorAvatar: userAvatar,
      content,
      image,
      video,
      likes: 0,
      timestamp: 'Just now',
      tags: ['#new-build', '#neural-update'],
      comments: []
    };
    setWallPosts(prev => [newPost, ...prev]);
    addNotification("Neural post shared to Builders Wall.", "success");
  };

  const handleLikePost = (postId: string) => {
    setWallPosts(prev => prev.map(p => {
      if (p.id === postId) {
        if (userRole === 'client') {
          const isLiked = !!p.likedByClient;
          return { ...p, likedByClient: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 };
        } else {
          const isLiked = !!p.likedByExpert;
          return { ...p, likedByExpert: !isLiked, likes: isLiked ? p.likes - 1 : p.likes + 1 };
        }
      }
      return p;
    }));
  };

  const handleAddWallComment = (postId: string, commentText: string) => {
    const newComment: WallComment = {
      id: `comm-${Date.now()}`,
      authorName: userName,
      authorAvatar: userAvatar,
      content: commentText,
      timestamp: 'Just now'
    };
    setWallPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const handleViewWallProfile = (authorName: string) => {
    const expert = MOCK_PROS.find(p => p.name === authorName);
    if (expert) {
      setSelectedExpert(expert);
      setCameFromWall(true);
      setActiveProjectId(null);
      setCurrentView(AppView.LOCAL_EXPERTS);
      addNotification(`Viewing ${expert.name}'s profile.`, "info");
    } else if (authorName === userName || (userRole === 'expert' && authorName === myExpertProfile.name)) {
      setCurrentView(userRole === 'client' ? AppView.SETTINGS : AppView.EXPERT_PROFILE);
      setActiveProjectId(null);
    } else {
      addNotification(`Public profile for ${authorName} coming soon.`, "info");
    }
  };

  const startLiveSession = async (audioOnly: boolean = false, isScreen: boolean = false, persona: 'ai' | 'expert' = 'ai') => {
    if (isLiveActive) return;
    let finalStream: MediaStream | undefined;
    if (isScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        finalStream = new MediaStream([...screenStream.getVideoTracks(), ...voiceStream.getAudioTracks()]);
        addNotification("Neural Screen Link established.", "success");
      } catch (e) { addNotification("Screen capture authorization denied.", "info"); return; }
    }
    setIsLiveActive(true);
    setLivePersona(persona);
    setIsAudioOnly(audioOnly);
    setLiveTranscription('');
    const session = new LiveCallSession();
    liveSessionRef.current = session;
    setTimeout(async () => {
      await session.start(
        { onMessage: (msg) => setLiveTranscription(prev => prev + ' ' + msg), onClose: () => setIsLiveActive(false) },
        liveVideoRef.current || undefined,
        activeProject?.summary,
        finalStream,
        audioOnly,
        persona
      );
    }, 150);
  };

  const stopLiveSession = () => {
    liveSessionRef.current?.stop();
    setIsLiveActive(false);
    liveSessionRef.current = null;
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const type = file.type.startsWith('video') ? 'video' : 'photo';
      const newMedia: ProjectMedia = {
        id: Date.now().toString(),
        url,
        type: type as any,
        name: file.name,
        timestamp: 'Just now'
      };
      if (activeProjectId) {
        setProjects(prev => prev.map(p => p.id === activeProjectId ? {
          ...p,
          media: [...p.media, newMedia]
        } : p));
        addNotification(`${type === 'video' ? 'Video' : 'Photo'} saved to Site Data.`, "success");
      } else {
        const newId = `proj-${Date.now()}`;
        const newProj: Project = {
          id: newId, title: `Upload: ${file.name.slice(0, 15)}...`, status: 'planning', lastUpdated: 'Just now', summary: `Project initiated via ${type} upload. Material analysis pending.`,
          aiMessages: [{ id: `msg-${Date.now()}`, role: 'user', text: `Analyzing uploaded ${type}: ${file.name}`, canvasSnapshot: type === 'photo' ? url : undefined }],
          expertMessages: [], media: [newMedia], files: [], summaries: []
        };
        setProjects(prev => [newProj, ...prev]);
        setActiveProjectId(newId);
        setCurrentView(AppView.WORKSPACE);
        addNotification(`New build initiated from ${type} upload.`, "success");
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  const activePreset = WALLPAPER_PRESETS.find(p => p.id === wallpaperId);
  const wallpaperClass = activePreset?.class || 'bg-slate-50';
  const customBgStyle = (wallpaperId === 'custom' && customWallpaper)
    ? { backgroundImage: `url(${customWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  const filteredSuggestions = PROMPT_SUGGESTIONS.filter(s =>
    inputText.length > 0 && s.toLowerCase().includes(inputText.toLowerCase())
  );

  const MobileNavItem = ({ view, label, icon, currentView }: { view: AppView, label: string, icon: React.ReactElement, currentView: AppView }) => (
    <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(view); }} className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${currentView === view ? 'text-emerald-800' : 'text-slate-500'}`}>
      {icon}
      <span className="text-[9px] font-black tracking-tighter uppercase">{label}</span>
    </button>
  );

  const isSettingsView = currentView === AppView.SETTINGS;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="md:flex md:h-screen">
        <input type="file" ref={mediaInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaFileChange} />

        {!hasApiKey && (
          <div className="fixed inset-0 z-[2000] bg-white/40 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-xl text-center shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-800 rounded-[2rem] flex flex-col items-center justify-center text-white leading-none mx-auto mb-8 shadow-xl">
                <span className="text-3xl font-black">ABCD</span>
                <span className="text-[7px] font-bold uppercase tracking-[0.2em] mt-1">Ready to DIY</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-950 mb-4 tracking-tight">Neural Bridge Required</h2>
              <p className="text-slate-600 font-medium mb-4 leading-relaxed text-sm md:text-base">Connect a Gemini API key from a paid GCP project to deploy ABCD specialized visual analysis models.</p>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <p className="text-xs font-bold text-amber-900 mb-2">Setup Instructions:</p>
                <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                  <li>Create a <code className="bg-amber-100 px-1 rounded">.env.local</code> file in the project root</li>
                  <li>Add: <code className="bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY=your_api_key_here</code></li>
                  <li>Restart the dev server (<code className="bg-amber-100 px-1 rounded">npm run dev</code>)</li>
                </ol>
                <p className="text-xs text-amber-700 mt-3 font-medium">Check the browser console (F12) for debugging info.</p>
              </div>
              <button onClick={handleSelectKey} className="w-full bg-emerald-800 text-white py-4 md:py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs md:text-sm shadow-xl hover:bg-emerald-900 transition-all hover:scale-105 active:scale-95 mb-3">Connect Neural Bridge (AI Studio)</button>
              <button
                onClick={() => {
                  // Temporary bypass for testing
                  const testKey = prompt('Enter API key to test (or leave empty to re-check environment):');
                  if (testKey && testKey.trim()) {
                    // Store in sessionStorage as fallback
                    sessionStorage.setItem('abcd_test_api_key', testKey);
                    setHasApiKey(true);
                    addNotification("API key set. You can now use the app.", "success");
                  } else {
                    // Re-check environment
                    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
                    if (envApiKey) {
                      setHasApiKey(true);
                      addNotification("API key found in environment!", "success");
                    } else {
                      alert('No API key found. Please:\n1. Create .env.local file\n2. Add: VITE_GEMINI_API_KEY=your_key\n3. Restart the dev server');
                    }
                  }
                }}
                className="w-full bg-slate-200 text-slate-800 py-3 rounded-[2rem] font-bold text-xs md:text-sm hover:bg-slate-300 transition-all"
              >
                Test with API Key / Re-check Environment
              </button>
            </div>
          </div>
        )}

        <nav className="hidden md:flex md:flex-col w-64 bg-white/70 backdrop-blur-md border-r border-slate-200 py-8 px-4 gap-10 shadow-sm relative z-20">
          <div onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.WORKSPACE); }} className="flex items-center gap-3 px-2 cursor-pointer group">
            <div className="bg-emerald-800 w-12 h-10 rounded-xl flex flex-col items-center justify-center text-white leading-none shadow-lg group-hover:rotate-6 transition-all">
              <span className="text-base font-black">ABCD</span>
              <span className="text-[5px] font-bold uppercase tracking-tighter">AI DIY</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-xl text-slate-950 leading-none tracking-tighter italic">ABCD</h1>
              <span className="text-[7px] font-bold text-emerald-800 uppercase tracking-widest mt-0.5">Any Body Can DIY</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {userRole === 'client' ? (
              <>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.WORKSPACE); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentView === AppView.WORKSPACE && !activeProjectId ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  <span className="font-bold text-sm">New Build</span>
                </button>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.PROJECT_VAULT); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentView === AppView.PROJECT_VAULT ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span className="font-bold text-sm">Project Vault</span>
                </button>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.CLIENT_BROADCASTS); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all relative ${currentView === AppView.CLIENT_BROADCASTS ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-bold text-sm">Review Offers</span>
                  {broadcasts.filter(b => b.status === 'offer_received').length > 0 && (
                    <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.LOCAL_EXPERTS); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentView === AppView.LOCAL_EXPERTS ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="font-bold text-sm">Expert Lab</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.EXPERT_POOL); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all relative ${currentView === AppView.EXPERT_POOL ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="font-bold text-sm">Expert Pool</span>
                  {broadcasts.filter(b => b.status === 'open').length > 0 && (
                    <span className="absolute top-3 right-3 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.EXPERT_PROJECTS); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all relative ${currentView === AppView.EXPERT_PROJECTS ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <span className="font-bold text-sm">Active Jobs</span>
                  {projects.filter(p => p.assignedProId === myExpertProfile.id && p.status !== 'completed').length > 0 && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {projects.filter(p => p.assignedProId === myExpertProfile.id && p.status !== 'completed').length}
                    </span>
                  )}
                </button>
                <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.EXPERT_PROFILE); setIsEditingMyProfile(false); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentView === AppView.EXPERT_PROFILE ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="font-bold text-sm">My Profile</span>
                </button>
              </>
            )}
            <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.BUILDERS_WALL); }} className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentView === AppView.BUILDERS_WALL ? 'bg-emerald-800 text-white shadow-lg' : 'text-slate-600 hover:bg-white/50'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-bold text-sm">Builders Wall</span>
            </button>
          </div>

          <div className="mt-auto space-y-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-rose-800 hover:bg-rose-50 transition-all group">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="font-bold text-sm">Sign Out</span>
            </button>
          </div>
        </nav>

        <main
          className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-1000 ${wallpaperClass}`}
          style={customBgStyle}
        >
          <header className="bg-white/60 backdrop-blur-md border-b border-white/50 py-3 px-4 md:py-5 md:px-10 flex justify-between items-center z-10">
            <div className="flex items-center gap-3 md:gap-4">
              {activeProjectId && (
                <button
                  onClick={() => { setActiveProjectId(null); setCurrentView(userRole === 'client' ? AppView.PROJECT_VAULT : AppView.EXPERT_PROJECTS); }}
                  className="p-1.5 md:p-2 bg-white/80 hover:bg-white rounded-xl transition-all text-slate-800 shadow-sm mr-1 md:mr-2 border border-slate-200"
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div className="flex flex-col">
                <h2 className="text-base md:text-2xl font-black text-slate-950 tracking-tight uppercase leading-none">
                  {activeProjectId ? activeProject?.title : (currentView === AppView.WORKSPACE ? "Welcome back" : currentView.replace('_', ' '))}
                </h2>
                {activeProjectId && userRole === 'expert' && (
                  <p className="text-[8px] md:text-[9px] font-black text-emerald-800 uppercase tracking-widest mt-0.5 md:mt-1">
                    Expert Dispatch
                  </p>
                )}
              </div>
              {userRole === 'client' && isSettingsView && (
                <div onClick={() => setIsReloadModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-rose-100/80 px-4 py-1.5 rounded-full border border-rose-200 shadow-sm ml-4 cursor-pointer hover:bg-rose-200 transition-colors group">
                  <span className="text-lg">🪙</span>
                  <span className="text-xs font-black text-rose-900 uppercase tracking-widest">{userCredits} Credits</span>
                </div>
              )}
            </div>
            <button onClick={() => { setActiveProjectId(null); setSelectedExpert(null); setCameFromWall(false); setCurrentView(AppView.SETTINGS); }} className="flex items-center gap-2 md:gap-3 hover:bg-white/80 p-1 md:p-2 rounded-2xl transition-all border border-transparent">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-950">{userName}</p>
                {isSettingsView ? (
                  <p className="text-[9px] font-bold text-slate-500 uppercase">{userCredits} Credits</p>
                ) : (
                  userRole === 'expert' && <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Verified</p>
                )}
              </div>
              <img src={userRole === 'client' ? userAvatar : myExpertProfile.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border-2 border-white shadow-sm object-cover" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-2 md:p-10 pb-28 md:pb-10">
            {activeProjectId && activeProject ? (
              <div className="max-w-6xl mx-auto h-full flex flex-col bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[4rem] border border-white overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white/40 border-b border-white px-4 md:px-10 py-0.5 md:py-1 flex gap-4 md:gap-10 overflow-x-auto custom-scrollbar">
                  {(['ai', 'expert', 'vault', 'summaries'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveProjectTab(tab)} className={`text-[9px] md:text-[10px] whitespace-nowrap font-black uppercase tracking-widest py-3 md:py-5 border-b-2 transition-all relative ${activeProjectTab === tab ? 'border-emerald-800 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab === 'ai' ? 'Neural Link' : tab === 'expert' ? 'Expert Signal' : tab === 'vault' ? 'Site Data' : 'Milestones'}</button>
                  ))}
                </div>
                <div className="flex-1 flex flex-col relative overflow-hidden">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10">
                    {activeProjectTab === 'ai' || activeProjectTab === 'expert' ? (
                      <div className="space-y-6 md:space-y-12">
                        {(activeProjectTab === 'ai' ? activeProject.aiMessages : activeProject.expertMessages).map(msg => {
                          const isMe = msg.role === (userRole === 'client' ? 'user' : 'expert');
                          if (msg.role === 'system_summary') return (
                            <div key={msg.id} className="max-w-2xl mx-auto bg-emerald-50/50 border border-emerald-100 p-4 md:p-6 rounded-2xl md:rounded-3xl text-center shadow-sm">
                              <p className="text-[11px] md:text-xs text-emerald-950 font-bold leading-relaxed">{msg.text}</p>
                            </div>
                          );
                          return (
                            <div key={msg.id} className={`flex items-start gap-3 md:gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <img src={isMe ? (userRole === 'client' ? userAvatar : myExpertProfile.avatar) : (activeProjectTab === 'ai' ? 'https://picsum.photos/seed/ai/100/100' : activeProject.assignedProId ? MOCK_PROS.find(p => p.id === activeProject.assignedProId)?.avatar : 'https://picsum.photos/seed/expert/100/100')} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl border-2 border-white shadow-md flex-shrink-0 mt-1 object-cover" />
                              <div className={`max-w-[85%] p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-sm ${isMe ? 'bg-emerald-800 text-white rounded-tr-none' : 'bg-white text-slate-950 rounded-tl-none border border-slate-100'}`}>
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                {msg.canvasSnapshot && <img src={msg.canvasSnapshot} className="mt-4 md:mt-6 rounded-xl md:rounded-3xl max-h-48 md:max-h-72 border border-white/20 shadow-lg" />}

                                {msg.generatedImages && msg.generatedImages.length > 0 && (
                                  <div className="mt-4 grid grid-cols-1 gap-4">
                                    {msg.generatedImages.map((img, idx) => (
                                      <img key={idx} src={img} className="rounded-xl md:rounded-3xl border border-white/20 shadow-lg w-full" alt={`AI Generated ${idx}`} />
                                    ))}
                                  </div>
                                )}

                                {msg.groundingSources && msg.groundingSources.length > 0 && (
                                  <div className="mt-6 pt-4 border-t border-slate-100/10">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Verification Sources:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.groundingSources.map((source, idx) => (
                                        <a
                                          key={idx}
                                          href={source.uri}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-[9px] md:text-[10px] ${isMe ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-50 hover:bg-emerald-50 text-emerald-800'} px-3 py-1.5 rounded-xl border border-transparent transition-all truncate max-w-[160px] md:max-w-[200px] font-bold`}
                                        >
                                          {source.title}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : activeProjectTab === 'summaries' ? (
                      <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="text-center mb-8">
                          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Project Milestones</h3>
                          <p className="text-slate-500 font-medium">AI-generated records of your progress and expert sessions.</p>
                        </div>

                        {(!activeProject.summaries || activeProject.summaries.length === 0) ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-12 text-center text-slate-500 font-medium">
                            No milestones recorded yet. End an expert session to generate a summary.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {activeProject.summaries.map(summary => (
                              <div key={summary.id} className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                  </div>
                                  <div>
                                    <h4 className="font-black text-slate-900 text-lg leading-none">{summary.title}</h4>
                                    <span className="text-xs font-bold text-slate-400">{summary.date}</span>
                                  </div>
                                </div>
                                <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-6 rounded-2xl">
                                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{summary.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {(activeProjectTab === 'ai' || activeProjectTab === 'expert') && (
                    <div className="p-3 md:p-8 border-t border-white/50 bg-white/30 backdrop-blur-md space-y-3">
                      <div className="flex gap-2 md:gap-4 bg-white p-1.5 md:p-4 rounded-full md:rounded-[4rem] shadow-xl border border-slate-100">
                        <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 md:px-8 py-2 md:py-4 text-sm md:text-base focus:outline-none font-medium text-slate-950 bg-transparent placeholder:text-slate-400" placeholder={activeProjectTab === 'ai' ? 'Ask BuildSync AI...' : activeProject?.assignedProName ? `Message ${activeProject.assignedProName}...` : 'Describe need...'} />
                        <button onClick={() => handleSendMessage()} className="bg-emerald-800 text-white px-5 md:px-12 py-2.5 md:py-4 rounded-full md:rounded-[4rem] font-black uppercase tracking-widest text-[9px] md:text-[11px] shadow-lg">
                          Send
                        </button>
                      </div>

                      <div className="flex justify-center flex-wrap gap-2 md:gap-3">
                        {activeProjectTab === 'ai' ? (
                          <button onClick={() => startLiveSession(false, false, 'ai')} className={`p-2.5 md:p-3 rounded-full transition-all shadow-md group ${isLiveActive ? 'bg-rose-600 text-white' : 'bg-white/70 backdrop-blur-sm border border-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'}`} title="AI Visual Supervision">
                            <div className="relative">
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              {!isLiveActive && <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>}
                            </div>
                          </button>
                        ) : (
                          <>
                            <button onClick={() => startLiveSession(true, false, 'expert')} className={`p-2.5 md:p-3 rounded-full transition-all shadow-md group ${isLiveActive && isAudioOnly ? 'bg-rose-600 text-white' : 'bg-white/70 backdrop-blur-sm border border-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'}`} title="Audio Call with Expert">
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </button>
                            <button onClick={() => startLiveSession(false, false, 'expert')} className={`p-2.5 md:p-3 rounded-full transition-all shadow-md group ${isLiveActive && !isAudioOnly ? 'bg-rose-600 text-white' : 'bg-white/70 backdrop-blur-sm border border-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'}`} title="Video Call with Expert">
                              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => setIsWhiteboardOpen(true)} className="bg-white/70 backdrop-blur-sm border border-white p-2.5 md:p-3 rounded-full text-slate-700 hover:text-emerald-800 transition-all shadow-md" title="Workbench">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setIsCameraOpen(true)} className="bg-white/70 backdrop-blur-sm border border-white p-2.5 md:p-3 rounded-full text-slate-700 hover:text-emerald-800 transition-all shadow-md" title="Snapshot">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>
                        <button onClick={() => mediaInputRef.current?.click()} className="bg-white/70 backdrop-blur-sm border border-white p-2.5 md:p-3 rounded-full text-slate-700 hover:text-emerald-800 transition-all shadow-md" title="Upload">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={handleCreateBroadcast} className="bg-white/70 backdrop-blur-sm border border-white p-2.5 md:p-3 rounded-full text-slate-700 hover:text-violet-800 transition-all shadow-md" title="Broadcast">
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </button>
                        {userRole === 'expert' && (
                          <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-white/70 backdrop-blur-sm border border-white p-2.5 md:p-3 rounded-full text-slate-700 hover:text-emerald-800 transition-all shadow-md" title="Create Invoice">
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </button>
                        )}
                      </div>

                      {activeProject.status !== 'completed' && (
                        <div className="pt-3 mt-3 border-t border-white/50 flex flex-col gap-3">
                          <div className="flex flex-col items-center gap-3">
                            {userRole === 'client' && activeProject.invoice && activeProject.invoice.status === 'pending' && (
                              <button onClick={() => setIsPaymentModalOpen(true)} className="w-full max-w-xs bg-emerald-800 text-white px-6 py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg animate-pulse">
                                Pay Invoice (${activeProject.invoice.amount})
                              </button>
                            )}
                            <button
                              onClick={handleResolveProject}
                              className="w-full max-w-md bg-emerald-800 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl group"
                            >
                              {userRole === 'expert' ? 'Mark as Resolved' : 'Mark Project as Complete'}
                              <span className="hidden sm:block text-[8px] opacity-60 font-bold mt-1 group-hover:opacity-100 transition-opacity">Finalizes all records and archives build</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : isSettingsView ? (
              <ClientSettingsView
                onBack={() => setCurrentView(userRole === 'client' ? AppView.WORKSPACE : AppView.EXPERT_POOL)}
                onLogout={handleLogout}
                userRole={userRole}
                isLocked={isLocked}
                setIsLocked={setIsLocked}
                notificationPrefs={notificationPrefs}
                setNotificationPrefs={setNotificationPrefs}
                collections={collections}
                allPosts={wallPosts}
                onCreateCollection={handleCreateCollection}
                savedCards={savedCards}
                setSavedCards={setSavedCards}
                bankAccount={bankAccount}
                setBankAccount={setBankAccount}
                userName={userName}
                setUserName={setUserName}
                userAvatar={userAvatar}
                setUserAvatar={setUserAvatar}
                userEmail={userEmail}
                setUserEmail={setUserEmail}
                userPhone={userPhone}
                setUserPhone={setUserPhone}
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                userCredits={userCredits}
                onReloadRequest={() => setIsReloadModalOpen(true)}
                wallpaperId={wallpaperId}
                onWallpaperChange={setWallpaperId}
                onCustomWallpaperChange={setCustomWallpaper}
                customWallpaper={customWallpaper}
                myExpertProfile={myExpertProfile}
                setMyExpertProfile={setMyExpertProfile}
              />
            ) : currentView === AppView.WORKSPACE ? (
              <div className="max-w-6xl mx-auto min-h-full flex flex-col items-center justify-start text-center space-y-10 md:space-y-16 animate-in fade-in duration-1000 pb-32 pt-6 md:pt-16">
                <div className="space-y-4 md:space-y-8 max-w-5xl px-4 text-center">
                  <h2 className="text-3xl md:text-6xl font-black text-slate-950 tracking-tighter leading-tight uppercase">Dream. Build. Connect.</h2>
                  <p className="text-slate-800 text-sm md:text-xl font-medium leading-relaxed max-w-4xl mx-auto italic opacity-80">Ask for instant DIY advice, or call a pro for live help through your camera.</p>
                </div>
                <div className="w-full max-w-3xl relative px-2">
                  {filteredSuggestions.length > 0 && (
                    <div className="absolute bottom-full mb-4 left-4 right-4 bg-white/95 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-2xl p-4 z-20 animate-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center gap-2 mb-3 px-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autocomplete</span>
                      </div>
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {filteredSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setInputText(suggestion); mainInputRef.current?.focus(); }}
                            className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-emerald-50 transition-all group flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-900">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="w-full bg-white/90 backdrop-blur-xl p-1.5 md:p-5 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-white flex items-center gap-1 md:gap-4 ring-4 md:ring-[12px] ring-emerald-100/30">
                    <input ref={mainInputRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 md:px-8 py-3 md:py-5 text-sm md:text-xl focus:outline-none font-medium placeholder:text-slate-400 bg-transparent text-slate-950" placeholder="What are we building?" />
                    <div className="flex items-center gap-1 md:gap-3">
                      <button onClick={() => mediaInputRef.current?.click()} className="p-2.5 md:p-4 rounded-full bg-slate-100 text-slate-600 hover:text-emerald-800 transition-all flex items-center justify-center">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>
                      <button onClick={() => handleSendMessage()} className="bg-emerald-800 text-white px-6 md:px-12 py-3.5 md:py-5 rounded-full md:rounded-[4rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl">Go</button>
                    </div>
                  </div>
                  {inputText === '' && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2 animate-in fade-in duration-700">
                      <p className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Need a starting point?</p>
                      {QUICK_STARTERS.map((starter, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setInputText(starter); mainInputRef.current?.focus(); }}
                          className="bg-white/40 hover:bg-white/80 border border-white/50 backdrop-blur-sm text-emerald-900 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : currentView === AppView.LOCAL_EXPERTS ? (
              selectedExpert ? (
                <ProfileView
                  pro={selectedExpert}
                  onBack={() => {
                    if (cameFromWall) {
                      setCurrentView(AppView.BUILDERS_WALL);
                      setCameFromWall(false);
                    }
                    setSelectedExpert(null);
                  }}
                  backLabel={cameFromWall ? "Back to Wall" : "Back to Experts"}
                  isClientViewing={true}
                  onConnect={() => { handleApproveExpert(null, selectedExpert); setSelectedExpert(null); setCameFromWall(false); }}
                />
              ) : (
                <LocalExpertsList
                  onCall={(pro) => handleApproveExpert(null, pro)}
                  onViewProfile={(pro) => setSelectedExpert(pro)}
                  userLocation={userLocation}
                  experts={[...MOCK_PROS, ...registeredExperts]}
                />
              )
            ) : currentView === AppView.BUILDERS_WALL ? (
              <BuildersWall userRole={userRole} wallPosts={wallPosts} onAddPost={handleAddWallPost} collections={collections} onSavePost={handleSavePost} onCreateCollection={handleCreateCollection} onLikePost={handleLikePost} onAddComment={handleAddWallComment} onViewProfile={handleViewWallProfile} />
            ) : currentView === AppView.PROJECT_VAULT ? (
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-12">
                {projects.map(p => (<div key={p.id} onClick={() => { setActiveProjectId(p.id); setCurrentView(AppView.WORKSPACE); }} className="bg-white/80 backdrop-blur-sm p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border border-white shadow-sm hover:shadow-2xl transition-all cursor-pointer group"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 md:mb-8 inline-block shadow-sm ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>{p.status}</span><h3 className="text-xl md:text-3xl font-black text-slate-950 mb-3 md:mb-6 tracking-tighter group-hover:text-emerald-800 uppercase">{p.title}</h3><p className="text-xs md:text-base text-slate-800 line-clamp-2 leading-relaxed font-medium opacity-60">{p.summary}</p></div>))}
              </div>
            ) : currentView === AppView.CLIENT_BROADCASTS ? (
              <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-950 mb-4 tracking-tight uppercase">Review Offers</h2>
                  <p className="text-slate-600 font-medium">View and review expert offers for your broadcasts</p>
                </div>

                {broadcasts.filter(b => b.clientId === 'sarah-123' || b.clientName === userName).length === 0 ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-[3rem] border border-white shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">No Broadcasts Yet</h3>
                    <p className="text-slate-600 mb-6">Create a broadcast to receive offers from experts.</p>
                    <button onClick={() => setCurrentView(AppView.WORKSPACE)} className="bg-emerald-800 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-sm">
                      Create Broadcast
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {broadcasts.filter(b => b.clientId === 'sarah-123' || b.clientName === userName).map(broadcast => {
                      const hasOffers = broadcast.offers && broadcast.offers.length > 0;
                      const offerCount = broadcast.offers?.length || 0;
                      // For clients, only use MOCK_PROS to match offers (experts are in MOCK_PROS)
                      let prosWithOffers = hasOffers ? MOCK_PROS.filter(p => broadcast.offers?.includes(p.id)) : [];

                      // Fallback: If no matches but offers exist, use first expert(s) from MOCK_PROS
                      if (hasOffers && prosWithOffers.length === 0) {
                        prosWithOffers = MOCK_PROS.slice(0, offerCount);
                      }

                      return (
                        <div key={broadcast.id} className="bg-white/80 backdrop-blur-sm rounded-[3rem] border border-white shadow-sm hover:shadow-2xl transition-all overflow-hidden">
                          <div className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${broadcast.status === 'offer_received' ? 'bg-amber-100 text-amber-900 animate-pulse' :
                                    broadcast.status === 'active' ? 'bg-emerald-100 text-emerald-900' :
                                      broadcast.status === 'resolved' ? 'bg-slate-100 text-slate-600' :
                                        'bg-blue-100 text-blue-900'
                                    }`}>
                                    {broadcast.status === 'offer_received' ? `${offerCount} Offers` : broadcast.status}
                                  </span>
                                  <span className="text-xs text-slate-500 font-bold">{broadcast.timestamp}</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-950 mb-3 tracking-tight">{broadcast.problemSummary}</h3>
                                <p className="text-sm text-slate-600 font-medium">Category: {broadcast.category} • Urgency: {broadcast.urgency}</p>
                              </div>
                            </div>

                            {hasOffers && (
                              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h4 className="text-lg font-black text-amber-900 mb-1">{offerCount} Expert{offerCount > 1 ? 's' : ''} Responded</h4>
                                    <p className="text-xs text-amber-700">Click below to review offers and select an expert</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    console.log('Review button clicked for broadcast:', broadcast.id);
                                    console.log('Broadcast offers:', broadcast.offers);
                                    console.log('Available MOCK_PROS IDs:', MOCK_PROS.map(p => p.id));
                                    console.log('myExpertProfile.id:', myExpertProfile.id);
                                    console.log('prosWithOffers:', prosWithOffers);

                                    if (prosWithOffers.length > 0) {
                                      console.log('Setting offerBroadcastId to:', broadcast.id);
                                      setOfferBroadcastId(broadcast.id);
                                    } else {
                                      console.warn('No matching experts found. Offers:', broadcast.offers);
                                      addNotification(`No matching experts found. Offer IDs: ${broadcast.offers?.join(', ') || 'none'}`, "info");
                                    }
                                  }}
                                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all flex items-center justify-center gap-3"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                  Review {offerCount} Offer{offerCount > 1 ? 's' : ''}
                                </button>
                              </div>
                            )}

                            {!hasOffers && (
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                                <p className="text-slate-600 font-medium">Waiting for experts to respond...</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : currentView === AppView.EXPERT_POOL ? (
              <ExpertDashboard requests={broadcasts.filter(b => !dismissedBroadcastIds.includes(b.id))} onOfferHelp={handleExpertOffer} onDismiss={handleDismissBroadcast} />
            ) : currentView === AppView.EXPERT_PROJECTS ? (
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-12">
                {projects.filter(p => p.assignedProId === myExpertProfile.id).map(p => (<div key={p.id} onClick={() => { setActiveProjectId(p.id); setCurrentView(AppView.WORKSPACE); }} className="bg-white/80 backdrop-blur-sm p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] border border-white shadow-sm hover:shadow-2xl transition-all cursor-pointer group"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 md:mb-8 inline-block shadow-sm ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>{p.status}</span><h3 className="text-xl md:text-3xl font-black text-slate-950 mb-3 md:mb-6 tracking-tighter group-hover:text-emerald-800 uppercase">{p.title}</h3><p className="text-xs md:text-base text-slate-800 line-clamp-2 leading-relaxed font-medium opacity-60">{p.summary}</p></div>))}
              </div>
            ) : currentView === AppView.EXPERT_PROFILE ? (
              isEditingMyProfile ? (
                <ProfileEditView pro={myExpertProfile} onSave={(updated) => { setMyExpertProfile(updated); setIsEditingMyProfile(false); addNotification("Profile updated.", "success"); }} onCancel={() => setIsEditingMyProfile(false)} />
              ) : (
                <ProfileView pro={myExpertProfile} onEdit={() => setIsEditingMyProfile(true)} isClientViewing={false} onApproveReview={handleApproveReview} onDiscardReview={handleDiscardReview} />
              )
            ) : null}
          </div>
        </main>
      </div >

      {isLiveActive && (
        <div className="fixed inset-0 z-[3000] bg-slate-950 flex flex-col items-center justify-center p-3 md:p-10 animate-in fade-in duration-500">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[1.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <video ref={liveVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-1000 ${isAudioOnly ? 'opacity-0' : 'opacity-60'}`} />
            <div className="absolute inset-0 pointer-events-none p-4 md:p-12 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className={`backdrop-blur-md px-4 py-1.5 md:px-5 md:py-2 rounded-full border flex items-center gap-2 md:gap-3 ${livePersona === 'ai' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-violet-500/20 border-violet-500/30'}`}>
                    <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse ${livePersona === 'ai' ? 'bg-emerald-500' : 'bg-violet-500'}`}></div>
                    <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest">
                      {livePersona === 'ai' ? 'Vision Link Active' : isAudioOnly ? 'Audio Link Established' : 'Video Signal Established'}
                    </span>
                  </div>
                </div>
                <button onClick={stopLiveSession} className="pointer-events-auto bg-rose-600 text-white px-5 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-widest shadow-xl">
                  Terminate
                </button>
              </div>
              <div className="w-full max-w-3xl mx-auto bg-black/40 backdrop-blur-xl p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
                <p className={`${livePersona === 'ai' ? 'text-emerald-400' : 'text-violet-400'} text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] mb-2 opacity-60`}>Transcript:</p>
                <p className="text-white text-sm md:text-xl font-medium leading-relaxed italic line-clamp-3">
                  {liveTranscription || "Awaiting neural analysis..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex justify-around p-1.5 z-50 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
        {userRole === 'client' ? (
          <>
            <MobileNavItem view={AppView.WORKSPACE} label="Home" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.PROJECT_VAULT} label="Vault" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.CLIENT_BROADCASTS} label="Offers" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.LOCAL_EXPERTS} label="Experts" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.BUILDERS_WALL} label="Wall" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.SETTINGS} label="Me" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} currentView={currentView} />
          </>
        ) : (
          <>
            <MobileNavItem view={AppView.EXPERT_POOL} label="Pool" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.EXPERT_PROJECTS} label="Jobs" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.BUILDERS_WALL} label="Wall" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} currentView={currentView} />
            <MobileNavItem view={AppView.EXPERT_PROFILE} label="Profile" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} currentView={currentView} />
          </>
        )}
      </nav>

      {isReloadModalOpen && <ReloadCreditsModal onClose={() => setIsReloadModalOpen(false)} savedCards={savedCards} onSuccess={handleReloadCredits} />}
      {isInvoiceModalOpen && activeProject && <InvoiceModal onClose={() => setIsInvoiceModalOpen(false)} onSubmit={handleSendInvoice} expertName={activeProject.assignedProName || 'Your Expert'} />}
      {isPaymentModalOpen && activeProject?.invoice && <InvoicePaymentModal invoice={activeProject.invoice} savedCards={savedCards} onClose={() => setIsPaymentModalOpen(false)} onConfirmPayment={handlePayInvoice} />}
      {
        (() => {
          if (!offerBroadcastId) return null;
          const broadcast = broadcasts.find(b => b.id === offerBroadcastId);
          console.log('Modal rendering - offerBroadcastId:', offerBroadcastId);
          console.log('Modal rendering - broadcast found:', broadcast);

          if (!broadcast) {
            console.warn('Broadcast not found for ID:', offerBroadcastId);
            return null;
          }

          if (!broadcast.offers || broadcast.offers.length === 0) {
            console.warn('Broadcast has no offers:', broadcast);
            return null;
          }

          // Extract profiles directly from offers
          // @ts-ignore
          const prosWithOffers = broadcast.offers.map(o => o.profile);

          console.log('Rendering MultiOfferModal with', prosWithOffers.length, 'experts');
          return <MultiOfferModal broadcast={broadcast} pros={prosWithOffers} onClose={() => setOfferBroadcastId(null)} onApprove={handleApproveExpert} />;
        })()
      }
      {isReviewModalOpen && activeProject && <ReviewModal project={activeProject} pro={[...MOCK_PROS, myExpertProfile].find(p => p.id === activeProject.assignedProId) || MOCK_PROS[0]} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleReviewSubmit} />}
      {isWhiteboardOpen && <Whiteboard initialImage={pendingSnapshot} onClose={() => { setIsWhiteboardOpen(false); setPendingSnapshot(undefined); }} onSendToAI={(snap, prompt) => { handleSendMessage(prompt, snap); setIsWhiteboardOpen(false); setPendingSnapshot(undefined); }} />}
      {isCameraOpen && <CameraCapture onCapturePhoto={(snap) => { if (activeProjectId) { setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, media: [...p.media, { id: Date.now().toString(), url: snap, type: 'photo', name: 'Site Photo', timestamp: 'Just now' }] } : p)); addNotification("Photo saved.", "success"); } else { handleSendMessage("Analyze snapshot:", snap); } setIsCameraOpen(false); }} onEditPhoto={(snap) => { setPendingSnapshot(snap); setIsWhiteboardOpen(true); setIsCameraOpen(false); }} onClose={() => setIsCameraOpen(false)} />}

      <div className="fixed top-2 md:top-10 right-2 md:right-10 z-[1000] flex flex-col gap-2 md:gap-4 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={n.onClick}
            className={`pointer-events-auto bg-white/95 backdrop-blur-2xl border border-slate-200 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 max-w-xs md:max-w-sm relative group ${n.onClick ? 'cursor-pointer hover:shadow-3xl hover:scale-105 transition-all' : ''}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>🚀</div>
            <p className="text-[11px] md:text-sm font-bold text-slate-950 pr-8">{n.message}</p>
            {n.onClick && (
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest absolute bottom-2 left-4">Click to review</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveNotification(n.id);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 z-10"
              title="Dismiss"
            >
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div >
  );
};
export default App;