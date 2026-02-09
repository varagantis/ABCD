import { Professional, Project, Review, BroadcastRequest, WallPost } from './types';

const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    reviewerName: 'Alice Smith',
    reviewerAvatar: 'https://picsum.photos/seed/alice/100/100',
    rating: 5,
    comment: 'Marcus was incredible. He fixed our wiring issues in half the time expected. Very professional!',
    date: '2 days ago',
    aspects: { quality: 5, communication: 5, timeliness: 5 }
  },
  {
    id: 'r2',
    reviewerName: 'Bob Johnson',
    reviewerAvatar: 'https://picsum.photos/seed/bob/100/100',
    rating: 4,
    comment: 'Great work on the panel upgrade. A bit late for the first appointment but the quality is top-notch.',
    date: '1 week ago',
    aspects: { quality: 5, communication: 4, timeliness: 3 }
  }
];

export const MOCK_PROS: Professional[] = [
  {
    id: 'expert-1',
    name: 'Marcus Thorne',
    specialty: 'Master Electrician',
    category: 'Electrical',
    rating: 4.9,
    reviewCount: 42,
    experience: '15 Years',
    location: 'Downtown, Seattle, Washington, United States',
    city: 'Seattle',
    region: 'Washington',
    zipCode: '98101',
    avatar: 'https://picsum.photos/seed/marcus/200/200',
    bio: 'Specializing in residential rewiring, smart home integration, and emergency electrical repairs. I focus on safety and efficient modern solutions.',
    skills: ['Rewiring', 'EV Chargers', 'Smart Panels', 'Safety Inspections'],
    portfolio: [
      { id: 'p1', imageUrl: 'https://picsum.photos/seed/p1/600/400', title: 'Modern Panel Upgrade', description: 'Complete overhaul of a 1950s electrical panel.' },
      { id: 'p2', imageUrl: 'https://picsum.photos/seed/p2/600/400', title: 'Outdoor Lighting', description: 'Smart LED integration for a backyard patio.' }
    ],
    hourlyRate: '$85/hr',
    availability: 'Available Now',
    reviews: MOCK_REVIEWS
  },
  {
    id: 'expert-2',
    name: 'Sarah Chen',
    specialty: 'Landscape Architect',
    category: 'Design',
    rating: 4.8,
    reviewCount: 28,
    experience: '8 Years',
    location: 'Bellevue, Washington, United States',
    city: 'Bellevue',
    region: 'Washington',
    zipCode: '98004',
    avatar: 'https://picsum.photos/seed/sarah/200/200',
    bio: 'Bringing nature back to urban spaces. I design sustainable, drought-resistant gardens that look stunning year-round.',
    skills: ['Drought-Resistant Plants', '3D Modeling', 'Permaculture', 'Hardscaping'],
    portfolio: [
      { id: 'p3', imageUrl: 'https://picsum.photos/seed/p3/600/400', title: 'Zen Garden', description: 'Minimalist stone and moss garden design.' }
    ],
    hourlyRate: '$120/hr',
    availability: 'Available Next Week',
    reviews: []
  },
  {
    id: 'expert-3',
    name: 'Rajesh Kumar',
    specialty: 'Civil Engineer',
    category: 'General',
    rating: 4.7,
    reviewCount: 156,
    experience: '12 Years',
    location: 'Mumbai, Maharashtra, India',
    city: 'Mumbai',
    region: 'Maharashtra',
    zipCode: '400001',
    avatar: 'https://picsum.photos/seed/rajesh/200/200',
    bio: 'Expert in structural reinforcement and high-rise residential plumbing systems. We handle large scale builds with neural precision.',
    skills: ['Concrete Pumping', 'Structural Load', 'Plumbing Codes'],
    portfolio: [],
    hourlyRate: '₹4000/hr',
    availability: 'Available Now',
    reviews: []
  },
  {
    id: 'expert-4',
    name: 'Claire Dubois',
    specialty: 'Master Plumber',
    category: 'Plumbing',
    rating: 4.9,
    reviewCount: 89,
    experience: '10 Years',
    location: 'Paris, Île-de-France, France',
    city: 'Paris',
    region: 'Île-de-France',
    zipCode: '75001',
    avatar: 'https://picsum.photos/seed/claire/200/200',
    bio: 'Specialized in heritage building restoration and modern hydraulic systems.',
    skills: ['Heritage Pipes', 'Leak Detection', 'Radiant Heating'],
    portfolio: [],
    hourlyRate: '€95/hr',
    availability: 'Available Now',
    reviews: []
  },
  {
    id: 'expert-5',
    name: 'James Wilson',
    specialty: 'Custom Carpenter',
    category: 'Carpentry',
    rating: 5.0,
    reviewCount: 12,
    experience: '20 Years',
    location: 'London, England, United Kingdom',
    city: 'London',
    region: 'England',
    zipCode: 'SW1A 1AA',
    avatar: 'https://picsum.photos/seed/james/200/200',
    bio: 'Bespoke cabinetry and structural timber framing for luxury residences.',
    skills: ['Timber Framing', 'Cabinetry', 'Joinery'],
    portfolio: [],
    hourlyRate: '£75/hr',
    availability: 'Busy',
    reviews: []
  }
];

export const MOCK_WALL_POSTS: WallPost[] = [
  {
    id: 'p1',
    authorName: 'Marcus Thorne',
    authorAvatar: 'https://picsum.photos/seed/marcus/200/200',
    content: 'Just finished the wiring for a 4,000sqft smart home. Remember: Always label your junction boxes, it saves hours during troubleshooting! ⚡️',
    image: 'https://picsum.photos/seed/elec/800/600',
    likes: 24,
    timestamp: '2h ago',
    tags: ['#electrical', '#pro-tip', '#smarthome'],
    comments: []
  },
  {
    id: 'p2',
    authorName: 'Sarah Chen',
    authorAvatar: 'https://picsum.photos/seed/sarah/200/200',
    content: 'New hack for retaining walls: Using recycled glass aggregates for drainage. Better for the environment and looks stunning with backlighting. 🌿',
    image: 'https://picsum.photos/seed/garden/800/600',
    likes: 56,
    timestamp: '5h ago',
    tags: ['#landscaping', '#sustainability'],
    comments: []
  },
  {
    id: 'p3',
    authorName: 'Leo V.',
    authorAvatar: 'https://picsum.photos/seed/leo/100/100',
    content: 'Built this sliding spice rack for a client today. Small spaces require big ideas! 🧂',
    image: 'https://picsum.photos/seed/kitchen/800/600',
    likes: 112,
    timestamp: '1d ago',
    tags: ['#carpentry', '#kitchen-hack'],
    comments: []
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    title: 'Modern Patio Deck',
    status: 'completed',
    lastUpdated: 'Completed',
    summary: 'Building a 12x12 cedar deck with integrated LED lighting.',
    assignedProId: 'expert-1',
    assignedProName: 'Marcus Thorne',
    aiMessages: [],
    expertMessages: [],
    media: [],
    files: [],
    summaries: [
      { id: 's1', title: 'Final Build Report', content: 'Deck construction verified. Electrical integration for LEDs completed safely.', date: 'Oct 2023' }
    ]
  },
  {
    id: 'proj_2',
    title: 'Kitchen Backsplash',
    status: 'completed',
    lastUpdated: 'Completed',
    summary: 'Installed herringbone subway tiles with dark grout.',
    assignedProId: 'expert-2',
    assignedProName: 'Sarah Chen',
    aiMessages: [],
    expertMessages: [],
    media: [],
    files: [],
    summaries: [
      { id: 's2', title: 'Aesthetic Verification', content: 'Grout lines checked and sealed. Pattern alignment exceeds standard tolerances.', date: 'Nov 2023' }
    ]
  },
  {
    id: 'proj_3',
    title: 'Smart Panel Integration',
    status: 'completed',
    lastUpdated: 'Completed',
    summary: 'Upgrading main breaker panel to a Leviton Smart Load Center for better energy monitoring.',
    assignedProId: 'expert-1',
    assignedProName: 'Marcus Thorne',
    aiMessages: [],
    expertMessages: [
      { id: 'm1', role: 'user', text: 'Hey Marcus, I just sent over the current panel photos. Can you check if we have space for the energy monitors?' },
      { id: 'm2', role: 'expert', text: 'Just saw them. Yes, we have enough rail space. I suggest ordering the CT clamps today so we can install next Tuesday.' }
    ],
    media: [],
    files: [],
    summaries: [
      { id: 's3', title: 'Installation Complete', content: 'Smart panel verified and energy monitoring active.', date: 'Dec 2023' }
    ]
  }
];