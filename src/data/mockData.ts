import { Service, Booking, WorkOrder, Customer, Staff, Invoice, PortfolioItem, Review, AppNotification, Vehicle } from '../types';

export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Car Upholstery',
    category: 'automotive',
    shortDesc: 'Complete interior makeover including seat trimming, door panels, dashboard & pillars.',
    longDesc: 'Our signature full interior service revitalizes your entire vehicle cabin. We strip worn materials down to the structural frame, inspect ergonomics, and re-craft your seats, door cards, center consoles, and pillar trims with millimeter precision.',
    startingPrice: 18000,
    estimatedDuration: '2 - 3 Days',
    image: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Car',
    isFeatured: true,
    popular: true,
    includedFeatures: ['Full cabin seat re-trimming', 'Door panel inserts', 'Center console armrest', 'High-density foam bolstering', 'Anti-fungal UV treatment', '1-year workmanship warranty'],
    materialsAvailable: ['Genuine Italian Leather', 'Nappa Automotive Leather', 'Heavy-Duty Automotive Vinyl', 'Breathable Alcantara', 'Waterproof Canvas']
  },
  {
    id: 'srv-2',
    name: 'Custom Car Seats',
    category: 'automotive',
    shortDesc: 'Bespoke seat sculpting, diamond-quilted patterns, lumbar support & bucket conversion.',
    longDesc: 'Tailored specifically to your driving ergonomics and style preferences. We redesign seat bolsters for high lateral support, add dual-density orthopedic foam, and stitch custom geometric diamond or hexagonal patterns.',
    startingPrice: 14500,
    estimatedDuration: '1 - 2 Days',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Armchair',
    isFeatured: true,
    popular: true,
    includedFeatures: ['Custom geometric stitching', 'Lumbar support reinforcement', 'Piping & contrast color accents', 'Side airbag seam compliance', 'Seat heater integration ready'],
    materialsAvailable: ['Nappa Leather', 'Sport Perforated Leather', 'Heavy Vinyl', 'Microfiber Suede']
  },
  {
    id: 'srv-3',
    name: 'Cushion Customization',
    category: 'cushions',
    shortDesc: 'High-resilience foam cutting, custom density cushions for vehicles, matatus & homes.',
    longDesc: 'From vehicle bench seats and matatu commuter cushions to residential patio daybeds and luxury couches. We use premium high-density bonded foam with moisture barrier linings and removable washable covers.',
    startingPrice: 6500,
    estimatedDuration: '24 - 48 Hours',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Layers',
    isFeatured: false,
    popular: true,
    includedFeatures: ['Custom shape foam cutting', 'High density 45-60kg/m³ foam', 'Heavy-duty YKK zippers', 'Water-repellent inner liner', 'Piped or piped-less edge finishing'],
    materialsAvailable: ['Outdoor Acrylic Fabric', 'Heavy Oxford Canvas', 'Chenille & Velvet', 'Faux Leather']
  },
  {
    id: 'srv-4',
    name: 'Leather Work & Stitching',
    category: 'leather',
    shortDesc: 'Artisanal hand-cut genuine leather crafting, embroidery & custom color matching.',
    longDesc: 'Experience luxury automotive leather crafted with traditional saddle-stitching and modern CNC precision. Our leather hides are sourced for maximum heat and sun resistance in the Kenyan climate.',
    startingPrice: 22000,
    estimatedDuration: '3 - 4 Days',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Scissors',
    isFeatured: true,
    popular: false,
    includedFeatures: ['100% Genuine Top-Grain Leather', 'UV & Heat resistance coating', 'Laser-cut perforated cooling zones', 'Custom embossed logos & branding', 'Conditioning care kit included'],
    materialsAvailable: ['Top Grain Cowhide', 'Nappa Silk Touch', 'Semi-Aniline Leather', 'Textured Saffiano']
  },
  {
    id: 'srv-5',
    name: 'Steering Wheel Stitching',
    category: 'automotive',
    shortDesc: 'OEM-grade hand-stitched leather & alcantara wraps with custom center marker rings.',
    longDesc: 'Upgrade your driving touchpoint. We wrap your steering wheel in butter-smooth perforated leather or plush alcantara with contrasting cross-stitching and motorsport 12 o’clock center ring.',
    startingPrice: 4500,
    estimatedDuration: '3 - 4 Hours',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Compass',
    isFeatured: false,
    popular: true,
    includedFeatures: ['OEM-tight wrap fitting', 'Tri-color or contrast baseball stitch', 'Thumb-rest contour padding', '12-o\'clock alignment stripe', 'Matching gear shift boot available'],
    materialsAvailable: ['Perforated Leather', 'Smooth Napa', 'Alcantara Suede', 'Carbon Fiber Texture Leather']
  },
  {
    id: 'srv-6',
    name: 'Carpet & Floor Mats',
    category: 'automotive',
    shortDesc: 'Heavy-duty acoustic floor carpeting, waterproof underlay & molded 5D floor mats.',
    longDesc: 'Eliminate road noise and protect your floorboards from dirt and moisture. We custom mold sound-deadening underlay and install heavy-duty automotive loop or plush cut-pile carpeting.',
    startingPrice: 8500,
    estimatedDuration: '1 Day',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Grid',
    isFeatured: false,
    popular: false,
    includedFeatures: ['Sound dampening butyl layer', 'Heat insulation underlay', 'Reinforced heel-pad for driver', 'Edge binding with gold or black trim', 'Precision pedal cutouts'],
    materialsAvailable: ['Heavy Automotive Loop Pile', 'Plush Velour Carpet', 'Heavy Ribbed Rubber', '5D Quilted Leatherette']
  },
  {
    id: 'srv-7',
    name: 'Car Shades & Canopies',
    category: 'canvas',
    shortDesc: 'Durable vehicle carports, cantilever car shades & UV-blocking parking covers.',
    longDesc: 'Protect vehicle paint and interiors from harsh equatorial sun and heavy tropical rain. Built with powder-coated galvanized steel frames and 98% UV-block waterproof shade net fabric.',
    startingPrice: 35000,
    estimatedDuration: '2 - 4 Days',
    image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Shield',
    isFeatured: false,
    popular: true,
    includedFeatures: ['Galvanized steel structural frame', '98% UV block shade cloth', 'Wind-resistant anchoring', '1-car / 2-car / multi-bay setups', 'Site survey & installation included'],
    materialsAvailable: ['HDPE Commercial Shade Net', 'Heavy PVC Tarpaulin', 'Waterproof Ripstop Fabric']
  },
  {
    id: 'srv-8',
    name: 'Tents & Canvas Work',
    category: 'canvas',
    shortDesc: 'Safari glamping tents, pickup canvas canopies, custom tarpaulins & overland gear.',
    longDesc: 'Heavy-duty canvas fabrication built to withstand the toughest African terrain. We manufacture custom vehicle pop-up awnings, safari camp tents, truck canopies, and specialized storage bags.',
    startingPrice: 28000,
    estimatedDuration: '3 - 5 Days',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Tent',
    isFeatured: false,
    popular: false,
    includedFeatures: ['Wax-treated military grade canvas', 'Double-stitched stress points', 'Heavy-duty brass eyelets', 'Mosquito-proof mesh panels', 'Custom steel tube frames'],
    materialsAvailable: ['550gsm Ripstop Canvas', 'Heavy Duty PVC 680gsm', 'Breathable Poly-Cotton']
  },
  {
    id: 'srv-9',
    name: 'Office & Executive Seats',
    category: 'commercial',
    shortDesc: 'Commercial ergonomic chair re-upholstery, boardroom sets & reception booths.',
    longDesc: 'Refresh your workspace without buying expensive new furniture. We rebuild internal cushioning, replace peeling faux leather with commercial-grade upholstery, and service gas lifts and casters.',
    startingPrice: 5500,
    estimatedDuration: '1 - 2 Days',
    image: 'https://images.unsplash.com/photo-1580481077195-7098744be650?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Briefcase',
    isFeatured: false,
    popular: false,
    includedFeatures: ['Commercial abrasion tested fabrics', 'Gas lift mechanism check', 'Re-foaming of lumbar zone', 'Bulk corporate discounts available', 'Pickup and delivery service'],
    materialsAvailable: ['Commercial Bonded Leather', 'Heavy Duty Wool Fabric', 'Breathable Mesh', 'Stain-Resistant Vinyl']
  },
  {
    id: 'srv-10',
    name: 'Roofing & Headliner Lining',
    category: 'automotive',
    shortDesc: 'Sagging roof lining repair, alcantara roof conversions & fiber-optic starlight ceilings.',
    longDesc: 'Fix sagging headliners permanently. We strip old deteriorated foam, prep the roof board with heat-resistant contact adhesive, and install plush foam-backed suede, knit fabric, or custom starlight ambient LEDs.',
    startingPrice: 9500,
    estimatedDuration: '1 Day',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    iconName: 'Sparkles',
    isFeatured: true,
    popular: true,
    includedFeatures: ['High-temp automotive adhesive (no sagging)', 'Foam-backed headliner cloth', 'Sun visor & pillar matching', 'Starlight optic fiber option', 'Sunroof cassette sealing'],
    materialsAvailable: ['Foam-Backed Headliner Fabric', 'Black Alcantara Suede', 'Diamond Quilted Headliner', 'Perforated Vinyl']
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'veh-1',
    customerId: 'cust-1',
    type: 'Car',
    make: 'Toyota',
    model: 'Probox',
    year: 2018,
    registrationNo: 'KDA 123A',
    color: 'Silver Metallic',
    image: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80',
    previousServicesCount: 2,
    notes: 'Commercial daily run. Needs high durability heavy-duty vinyl upholstery.'
  },
  {
    id: 'veh-2',
    customerId: 'cust-1',
    type: 'SUV',
    make: 'Toyota',
    model: 'Harrier',
    year: 2021,
    registrationNo: 'KCY 456B',
    color: 'Pearl White',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    previousServicesCount: 1,
    notes: 'Personal luxury vehicle. Premium Nappa leather with gold contrast stitching.'
  },
  {
    id: 'veh-3',
    customerId: 'cust-2',
    type: 'SUV',
    make: 'Toyota',
    model: 'Land Cruiser Prado',
    year: 2020,
    registrationNo: 'KDG 889C',
    color: 'Midnight Black',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    previousServicesCount: 3,
    notes: 'Safari and off-road spec. Heavy water-resistant leather with double stitch.'
  },
  {
    id: 'veh-4',
    customerId: 'cust-3',
    type: 'Truck',
    make: 'Isuzu',
    model: 'D-Max Double Cab',
    year: 2019,
    registrationNo: 'KBZ 554M',
    color: 'Desert Sand',
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=800&q=80',
    previousServicesCount: 1,
    notes: 'Custom canvas canopy + heavy seat covers.'
  }
];

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-1',
    name: 'James Kimani',
    role: 'Owner',
    phone: '+254 712 345 678',
    specialization: 'Master Upholsterer & Business Lead',
    activeJobs: 2,
    completedJobs: 340,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    rating: 4.98
  },
  {
    id: 'staff-2',
    name: 'John Mwangi',
    role: 'Craftsman',
    phone: '+254 722 987 654',
    specialization: 'Full Vehicle Interior & Custom Seats',
    activeJobs: 3,
    completedJobs: 185,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    rating: 4.95
  },
  {
    id: 'staff-3',
    name: 'Peter Ochieng',
    role: 'Craftsman',
    phone: '+254 733 456 123',
    specialization: 'Precision Leather & Steering Stitching',
    activeJobs: 4,
    completedJobs: 210,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    rating: 4.92
  },
  {
    id: 'staff-4',
    name: 'Boniface Kiprop',
    role: 'Craftsman',
    phone: '+254 711 654 321',
    specialization: 'Car Shades, Tents & Heavy Canvas',
    activeJobs: 2,
    completedJobs: 142,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    rating: 4.88
  },
  {
    id: 'staff-5',
    name: 'David Mutua',
    role: 'Manager',
    phone: '+254 790 112 233',
    specialization: 'Workshop Supervisor & Quality Control',
    activeJobs: 5,
    completedJobs: 410,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    rating: 4.99
  },
  {
    id: 'staff-6',
    name: 'Faith Wanjiku',
    role: 'Receptionist',
    phone: '+254 720 445 566',
    specialization: 'Client Service & M-Pesa Billing',
    activeJobs: 0,
    completedJobs: 520,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    rating: 4.96
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'RR-1048',
    customerId: 'cust-1',
    customerName: 'Brian Mwangi',
    customerPhone: '+254 712 901 234',
    customerEmail: 'brian.mwangi@gmail.com',
    serviceId: 'srv-1',
    serviceName: 'Car Interior Upholstery',
    vehicleDetails: {
      type: 'Car',
      make: 'Toyota',
      model: 'Fielder',
      year: 2019,
      registrationNo: 'KCY 456B',
      photoUrl: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=600&q=80'
    },
    requirementsDesc: 'Complete 5-seat transformation with tan brown Nappa leather, diamond quilted backrests, black side bolsters, and matching gear knob.',
    selectedMaterial: 'Nappa Automotive Leather (Tan & Black)',
    stitchingStyle: 'Diamond Quilted with Gold Thread',
    appointmentDate: '2026-09-12',
    appointmentTime: '10:00 AM',
    locationType: 'workshop',
    estimatedPrice: 18000,
    depositAmount: 5000,
    balanceAmount: 13000,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'M-Pesa',
    mpesaReceiptNo: 'QJ89LK3299',
    status: 'confirmed',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'John Mwangi',
    workOrderId: 'RR-WO-2045',
    createdAt: '2026-09-01T08:30:00Z',
    timeline: [
      {
        status: 'pending',
        timestamp: '2026-09-01 08:30 AM',
        title: 'Booking Created',
        note: 'Customer requested online appointment via Rolling Razors portal.',
        updatedBy: 'Brian Mwangi'
      },
      {
        status: 'confirmed',
        timestamp: '2026-09-01 09:15 AM',
        title: 'Booking Confirmed & Deposit Received',
        note: 'KES 5,000 M-Pesa deposit verified. Assigned to Master Craftsman John.',
        updatedBy: 'Faith Wanjiku (Reception)'
      }
    ],
    internalNotes: 'Client confirmed preferred leather batch #TN-804. Promised pickup within 2 working days.'
  },
  {
    id: 'RR-1049',
    customerId: 'cust-2',
    customerName: 'Anthony Kiprotich',
    customerPhone: '+254 722 345 678',
    customerEmail: 'a.kiprotich@transport.co.ke',
    serviceId: 'srv-2',
    serviceName: 'Custom Car Seats',
    vehicleDetails: {
      type: 'SUV',
      make: 'Toyota',
      model: 'Land Cruiser Prado',
      year: 2020,
      registrationNo: 'KDG 889C',
      photoUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80'
    },
    requirementsDesc: 'Heavy lumbar support addition for front driver and passenger seats. Dark saddle brown leather with ventilated perforations.',
    selectedMaterial: 'Genuine Italian Leather (Saddle Brown)',
    stitchingStyle: 'Double French Stitch',
    appointmentDate: '2026-09-02',
    appointmentTime: '08:00 AM',
    locationType: 'workshop',
    estimatedPrice: 24000,
    depositAmount: 10000,
    balanceAmount: 14000,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'M-Pesa',
    mpesaReceiptNo: 'RG41ZX780N',
    status: 'in_progress',
    assignedStaffId: 'staff-3',
    assignedStaffName: 'Peter Ochieng',
    workOrderId: 'RR-WO-2046',
    createdAt: '2026-08-30T10:00:00Z',
    timeline: [
      {
        status: 'pending',
        timestamp: '2026-08-30 10:00 AM',
        title: 'Booking Created',
        note: 'Prado 150 series seat bolster reinforcement inquiry.',
        updatedBy: 'Anthony Kiprotich'
      },
      {
        status: 'confirmed',
        timestamp: '2026-08-30 11:30 AM',
        title: 'Confirmed',
        note: 'Deposit settled via M-Pesa.',
        updatedBy: 'David Mutua'
      },
      {
        status: 'checked_in',
        timestamp: '2026-09-01 08:15 AM',
        title: 'Vehicle Received at Workshop',
        note: 'Vehicle inspected, inventory logged, seats detached.',
        updatedBy: 'John Mwangi'
      },
      {
        status: 'in_progress',
        timestamp: '2026-09-01 10:00 AM',
        title: 'Work In Progress',
        note: 'Leather cutting and high density foam shaping underway.',
        updatedBy: 'Peter Ochieng'
      }
    ]
  },
  {
    id: 'RR-1050',
    customerId: 'cust-3',
    customerName: 'Captain Mercy Njeri',
    customerPhone: '+254 733 998 877',
    customerEmail: 'mercy.njeri@safari.com',
    serviceId: 'srv-5',
    serviceName: 'Steering Stitching',
    vehicleDetails: {
      type: 'Car',
      make: 'Subaru',
      model: 'Outback',
      year: 2017,
      registrationNo: 'KCY 774D'
    },
    requirementsDesc: 'Black alcantara with yellow 12 o\'clock center ring and yellow baseball stitching.',
    appointmentDate: '2026-09-03',
    appointmentTime: '02:00 PM',
    locationType: 'workshop',
    estimatedPrice: 4500,
    depositAmount: 1500,
    balanceAmount: 3000,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'M-Pesa',
    mpesaReceiptNo: 'QA77MK120P',
    status: 'confirmed',
    assignedStaffId: 'staff-3',
    assignedStaffName: 'Peter Ochieng',
    workOrderId: 'RR-WO-2047',
    createdAt: '2026-09-01T07:15:00Z',
    timeline: [
      {
        status: 'confirmed',
        timestamp: '2026-09-01 07:30 AM',
        title: 'Confirmed for Thursday afternoon',
        note: 'Express 3-hour job scheduled.',
        updatedBy: 'Faith Wanjiku'
      }
    ]
  },
  {
    id: 'RR-1051',
    customerId: 'cust-4',
    customerName: 'Hassan Omar',
    customerPhone: '+254 721 556 677',
    customerEmail: 'hassan.o@coastmatatu.ke',
    serviceId: 'srv-3',
    serviceName: 'Cushion Customization',
    vehicleDetails: {
      type: 'Matatu',
      make: 'Nissan',
      model: 'NV350 Caravan Shuttle',
      year: 2022,
      registrationNo: 'KDL 332X'
    },
    requirementsDesc: '14-seater complete heavy cushion rebuilding with washable heavy vinyl covers and double stitching for inter-county commuter shuttle.',
    appointmentDate: '2026-08-28',
    appointmentTime: '09:00 AM',
    locationType: 'workshop',
    estimatedPrice: 38000,
    depositAmount: 15000,
    balanceAmount: 0,
    paymentStatus: 'paid',
    paymentMethod: 'M-Pesa',
    mpesaReceiptNo: 'MP88KK419Z',
    status: 'completed',
    assignedStaffId: 'staff-2',
    assignedStaffName: 'John Mwangi',
    workOrderId: 'RR-WO-2040',
    createdAt: '2026-08-26T14:00:00Z',
    timeline: [
      {
        status: 'completed',
        timestamp: '2026-08-30 04:00 PM',
        title: 'Project Completed & Handed Over',
        note: 'Customer inspected and was extremely pleased with the durability. Full balance settled.',
        updatedBy: 'James Kimani'
      }
    ]
  },
  {
    id: 'RR-1052',
    customerId: 'cust-1',
    customerName: 'Brian Mwangi',
    customerPhone: '+254 712 901 234',
    customerEmail: 'brian.mwangi@gmail.com',
    serviceId: 'srv-10',
    serviceName: 'Roofing & Headliner Lining',
    vehicleDetails: {
      type: 'Car',
      make: 'Toyota',
      model: 'Probox',
      year: 2018,
      registrationNo: 'KDA 123A'
    },
    requirementsDesc: 'Sagging roof cloth repair with black foam-backed velour material and sound dampening pad.',
    appointmentDate: '2026-07-15',
    appointmentTime: '08:00 AM',
    locationType: 'workshop',
    estimatedPrice: 9500,
    depositAmount: 3000,
    balanceAmount: 0,
    paymentStatus: 'paid',
    paymentMethod: 'M-Pesa',
    mpesaReceiptNo: 'KL33MM901A',
    status: 'completed',
    assignedStaffId: 'staff-4',
    assignedStaffName: 'Boniface Kiprop',
    workOrderId: 'RR-WO-2012',
    createdAt: '2026-07-14T09:00:00Z',
    timeline: [
      {
        status: 'completed',
        timestamp: '2026-07-15 05:30 PM',
        title: 'Roofing Completed',
        note: 'Replaced sagging fabric with black velour.',
        updatedBy: 'David Mutua'
      }
    ]
  },
  {
    id: 'RR-1053',
    customerId: 'cust-5',
    customerName: 'Dr. Evans Omondi',
    customerPhone: '+254 715 889 900',
    customerEmail: 'evans.omondi@knh.or.ke',
    serviceId: 'srv-7',
    serviceName: 'Car Shades & Canopies',
    vehicleDetails: {
      type: 'SUV',
      make: 'Mercedes-Benz',
      model: 'GLE 400d',
      year: 2023,
      registrationNo: 'KDG 001A'
    },
    requirementsDesc: 'Double cantilever parking shade at private residence in Karen. Forest green 98% UV shade net fabric.',
    appointmentDate: '2026-09-14',
    appointmentTime: '09:00 AM',
    locationType: 'customer_location',
    customerLocationAddress: 'Mbagathi Ridge, Karen, Nairobi',
    estimatedPrice: 75000,
    depositAmount: 30000,
    balanceAmount: 45000,
    paymentStatus: 'deposit_paid',
    paymentMethod: 'Bank',
    status: 'confirmed',
    assignedStaffId: 'staff-4',
    assignedStaffName: 'Boniface Kiprop',
    workOrderId: 'RR-WO-2048',
    createdAt: '2026-09-01T06:00:00Z',
    timeline: [
      {
        status: 'confirmed',
        timestamp: '2026-09-01 07:00 AM',
        title: 'Site Survey & Fabrication Confirmed',
        note: 'Site dimensions measured. Steel framework under fabrication.',
        updatedBy: 'James Kimani'
      }
    ]
  }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'RR-WO-2045',
    bookingId: 'RR-1048',
    customerName: 'Brian Mwangi',
    customerPhone: '+254 712 901 234',
    vehicleTitle: 'Toyota Fielder (2019)',
    registrationNo: 'KCY 456B',
    serviceName: 'Full Interior Upholstery',
    assignedCraftsman: 'John Mwangi',
    priority: 'Normal',
    stage: 'CONFIRMED',
    customerRequirements: 'Tan brown Nappa leather seats, diamond quilted backrests, black side bolsters with gold contrast double stitching.',
    materialsRequired: ['12m Nappa Leather (Tan #804)', '4m Black Perforated Leather', 'High Density Foam 50mm', 'Gold Bonded Nylon Thread #40'],
    estimatedCost: 18000,
    actualCost: 18000,
    beforePhotos: [
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=600&q=80'
    ],
    progressPhotos: [],
    afterPhotos: [],
    internalNotes: 'Client is an executive driver. Ensure extra lumbar padding on right driver cushion.',
    progressPercentage: 20,
    createdAt: '2026-09-01',
    targetCompletionDate: '2026-09-14'
  },
  {
    id: 'RR-WO-2046',
    bookingId: 'RR-1049',
    customerName: 'Anthony Kiprotich',
    customerPhone: '+254 722 345 678',
    vehicleTitle: 'Toyota Land Cruiser Prado (2020)',
    registrationNo: 'KDG 889C',
    serviceName: 'Custom Car Seats (Prado Front & Rear)',
    assignedCraftsman: 'Peter Ochieng',
    priority: 'High',
    stage: 'IN_PROGRESS',
    customerRequirements: 'Full Italian saddle brown leather, dual-density ergonomic lumbar bolster upgrade.',
    materialsRequired: ['18m Italian Saddle Leather', '60kg/m³ Re-bond Foam', 'Dacron Wrap Layer', 'Heavy Brown Piping Cord'],
    estimatedCost: 24000,
    actualCost: 24000,
    beforePhotos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'
    ],
    progressPhotos: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80'
    ],
    afterPhotos: [],
    internalNotes: 'Seats stripped, foam shaped, leather stitching currently on front driver seat.',
    progressPercentage: 55,
    createdAt: '2026-08-30',
    targetCompletionDate: '2026-09-04'
  },
  {
    id: 'RR-WO-2047',
    bookingId: 'RR-1050',
    customerName: 'Captain Mercy Njeri',
    customerPhone: '+254 733 998 877',
    vehicleTitle: 'Subaru Outback (2017)',
    registrationNo: 'KCY 774D',
    serviceName: 'Steering Wheel Stitching',
    assignedCraftsman: 'Peter Ochieng',
    priority: 'Normal',
    stage: 'NEW',
    customerRequirements: 'Black alcantara with yellow 12 o\'clock marker stripe and yellow baseball cross-stitch.',
    materialsRequired: ['1m Premium Automotive Alcantara', 'Yellow Center Marker Band', 'Yellow Waxed Stitching Cord'],
    estimatedCost: 4500,
    actualCost: 4500,
    beforePhotos: [],
    progressPhotos: [],
    afterPhotos: [],
    internalNotes: 'Quick same-day express service on arrival.',
    progressPercentage: 10,
    createdAt: '2026-09-01',
    targetCompletionDate: '2026-09-03'
  },
  {
    id: 'RR-WO-2048',
    bookingId: 'RR-1053',
    customerName: 'Dr. Evans Omondi',
    customerPhone: '+254 715 889 900',
    vehicleTitle: 'Mercedes GLE 400d Carport',
    registrationNo: 'KDG 001A',
    serviceName: 'Double Cantilever Car Shade',
    assignedCraftsman: 'Boniface Kiprop',
    priority: 'Urgent',
    stage: 'VEHICLE_RECEIVED',
    customerRequirements: 'Heavy-gauge steel cantilever frame, forest green 98% UV shade net cloth installed in Karen.',
    materialsRequired: ['3" Galvanized Steel Pipes', '6m x 5m UV Green Shade Fabric', 'Anchor Bolts & Concrete Mix'],
    estimatedCost: 75000,
    actualCost: 75000,
    beforePhotos: [],
    progressPhotos: [],
    afterPhotos: [],
    internalNotes: 'Welding completed at workshop. Site installation set for Monday.',
    progressPercentage: 35,
    createdAt: '2026-09-01',
    targetCompletionDate: '2026-09-15'
  },
  {
    id: 'RR-WO-2040',
    bookingId: 'RR-1051',
    customerName: 'Hassan Omar',
    customerPhone: '+254 721 556 677',
    vehicleTitle: 'Nissan NV350 Caravan Shuttle',
    registrationNo: 'KDL 332X',
    serviceName: '14-Seater Matatu Cushion Overhaul',
    assignedCraftsman: 'John Mwangi',
    priority: 'Normal',
    stage: 'COMPLETED',
    customerRequirements: 'Full 14-seater high-resilience foam and heavy-duty vinyl covers.',
    materialsRequired: ['14 Heavy Vinyl Seat Sets', 'High-Density Sponge', 'Industrial Zippers'],
    estimatedCost: 38000,
    actualCost: 38000,
    beforePhotos: ['https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=600&q=80'],
    progressPhotos: ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80'],
    afterPhotos: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80'],
    internalNotes: 'Client inspected and paid full balance with M-Pesa. 6-month warranty card issued.',
    progressPercentage: 100,
    createdAt: '2026-08-26',
    targetCompletionDate: '2026-08-30'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Brian Mwangi',
    phone: '+254 712 901 234',
    email: 'brian.mwangi@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    vehiclesCount: 2,
    totalBookings: 3,
    totalSpent: 45500,
    lastVisit: '2026-09-01',
    status: 'VIP',
    address: 'South C, Nairobi, Kenya',
    savedVehicles: [
      INITIAL_VEHICLES[0],
      INITIAL_VEHICLES[1]
    ]
  },
  {
    id: 'cust-2',
    name: 'Anthony Kiprotich',
    phone: '+254 722 345 678',
    email: 'a.kiprotich@transport.co.ke',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    vehiclesCount: 1,
    totalBookings: 2,
    totalSpent: 38000,
    lastVisit: '2026-08-30',
    status: 'Active',
    address: 'Westlands, Nairobi, Kenya',
    savedVehicles: [
      INITIAL_VEHICLES[2]
    ]
  },
  {
    id: 'cust-3',
    name: 'Captain Mercy Njeri',
    phone: '+254 733 998 877',
    email: 'mercy.njeri@safari.com',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    vehiclesCount: 1,
    totalBookings: 1,
    totalSpent: 4500,
    lastVisit: '2026-09-01',
    status: 'New',
    address: 'Kilimani, Nairobi, Kenya',
    savedVehicles: []
  },
  {
    id: 'cust-4',
    name: 'Hassan Omar',
    phone: '+254 721 556 677',
    email: 'hassan.o@coastmatatu.ke',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    vehiclesCount: 3,
    totalBookings: 4,
    totalSpent: 124000,
    lastVisit: '2026-08-28',
    status: 'VIP',
    address: 'Mombasa Road / Machakos Junction',
    savedVehicles: []
  },
  {
    id: 'cust-5',
    name: 'Dr. Evans Omondi',
    phone: '+254 715 889 900',
    email: 'evans.omondi@knh.or.ke',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    vehiclesCount: 2,
    totalBookings: 1,
    totalSpent: 75000,
    lastVisit: '2026-09-01',
    status: 'Active',
    address: 'Karen, Nairobi, Kenya',
    savedVehicles: []
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'RR-INV-2045',
    bookingId: 'RR-1048',
    workOrderId: 'RR-WO-2045',
    customerName: 'Brian Mwangi',
    customerPhone: '+254 712 901 234',
    customerEmail: 'brian.mwangi@gmail.com',
    vehicleInfo: 'Toyota Fielder (KCY 456B)',
    serviceName: 'Full Interior Upholstery',
    items: [
      { description: 'Full 5-Seat Nappa Leather Re-trim & Diamond Stitch', quantity: 1, unitPrice: 15000, amount: 15000 },
      { description: 'High Density Lumbar Support Foam Reinforcement', quantity: 2, unitPrice: 1500, amount: 3000 }
    ],
    subtotal: 18000,
    depositPaid: 5000,
    balanceDue: 13000,
    total: 18000,
    paymentMethod: 'M-Pesa',
    paymentStatus: 'Deposit Paid',
    mpesaRef: 'QJ89LK3299',
    issueDate: '2026-09-01',
    dueDate: '2026-09-14'
  },
  {
    id: 'RR-INV-2040',
    bookingId: 'RR-1051',
    workOrderId: 'RR-WO-2040',
    customerName: 'Hassan Omar',
    customerPhone: '+254 721 556 677',
    customerEmail: 'hassan.o@coastmatatu.ke',
    vehicleInfo: 'Nissan NV350 Caravan Shuttle (KDL 332X)',
    serviceName: '14-Seater Matatu Cushion Overhaul',
    items: [
      { description: '14 Heavy Duty Commuter Cushions & Re-foam', quantity: 14, unitPrice: 2500, amount: 35000 },
      { description: 'Driver Ergonomic Comfort Bolster Upgrade', quantity: 1, unitPrice: 3000, amount: 3000 }
    ],
    subtotal: 38000,
    depositPaid: 15000,
    balanceDue: 0,
    total: 38000,
    paymentMethod: 'M-Pesa',
    paymentStatus: 'Paid',
    mpesaRef: 'MP88KK419Z',
    issueDate: '2026-08-26',
    dueDate: '2026-08-30'
  }
];

export const INITIAL_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'port-1',
    title: 'Toyota Probox Full Cabin Overhaul',
    category: 'Car Interiors',
    service: 'Full Upholstery',
    location: 'Nairobi, Kenya',
    vehicleModel: 'Toyota Probox 2018',
    image: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
    description: 'Converted a tired commercial cabin into a luxury executive commuter with tan double-stitched leatherette, matching door trims, and noise-canceling floor carpet.',
    tags: ['Toyota Probox', 'Tan Leather', 'Diamond Stitch', 'Full Cabin'],
    isFeatured: true
  },
  {
    id: 'port-2',
    title: 'Land Cruiser Prado Luxury Saddle Restyle',
    category: 'Seats',
    service: 'Custom Car Seats & Leather',
    location: 'Karen, Kenya',
    vehicleModel: 'Toyota Prado TX-L 2021',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    description: 'Handcrafted top-grain Italian saddle leather with perforated cooling zones, custom headrest crest debossing, and gold-thread double French stitching.',
    tags: ['Land Cruiser', 'Genuine Leather', 'Italian Hide', 'Perforated'],
    isFeatured: true
  },
  {
    id: 'port-3',
    title: 'Subaru WRX Alcantara Steering Stitch',
    category: 'Leather',
    service: 'Steering Wheel Stitching',
    location: 'Nairobi, Kenya',
    vehicleModel: 'Subaru WRX STI',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
    description: 'Plush motorsport alcantara wrap with red 12-o’clock alignment stripe and cross-stitched thread with thumb-rest contouring.',
    tags: ['Steering', 'Alcantara', 'Motorsport', 'Hand Stitch'],
    isFeatured: true
  },
  {
    id: 'port-4',
    title: 'Commercial 14-Seater Heavy Duty Overhaul',
    category: 'Cushions',
    service: 'Cushion Customization',
    location: 'Mombasa Road, Kenya',
    vehicleModel: 'Nissan Caravan NV350',
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    description: 'Custom high-resilience bonded foam cushions engineered for inter-county durability, wrapped in tear-resistant 1.2mm automotive vinyl.',
    tags: ['Matatu', 'Heavy Duty', 'Custom Foam', 'Transit'],
    isFeatured: false
  },
  {
    id: 'port-5',
    title: 'Overland 4x4 Safari Canopy & Tent',
    category: 'Canvas',
    service: 'Tents & Canvas Work',
    location: 'Naivasha, Kenya',
    vehicleModel: 'Land Cruiser 79 Series',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    description: 'Custom wax-treated 550gsm ripstop canvas canopy with heavy duty YKK roll-up side doors and integrated fold-out safari awning.',
    tags: ['Overland', 'Safari Tent', 'Ripstop Canvas', '4x4 Rig'],
    isFeatured: true
  },
  {
    id: 'port-6',
    title: 'Mercedes C-Class Starlight Headliner & Suede Roof',
    category: 'Before & After',
    service: 'Roofing & Headliner',
    location: 'Kilimani, Kenya',
    vehicleModel: 'Mercedes-Benz C200',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    beforeImage: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
    afterImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
    description: 'Eliminated sagged OEM roof lining and installed deep jet-black microfiber suede with 450-point twinkling optical fiber starlight ceiling.',
    tags: ['Starlight Roof', 'Suede Headliner', 'Luxury', 'Mercedes'],
    isFeatured: true
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    customerName: 'Brian M.',
    location: 'Nairobi, Kenya',
    rating: 5,
    vehicle: 'Toyota Fielder',
    service: 'Full Upholstery',
    comment: 'Completely transformed the interior of my car. The stitching and finishing are excellent, and they finished on schedule. Rolling Razors is truly top tier in Kenya!',
    date: 'August 2026',
    verified: true
  },
  {
    id: 'rev-2',
    customerName: 'Kiprono Cheruiyot',
    location: 'Eldoret, Kenya',
    rating: 5,
    vehicle: 'Land Cruiser Prado TX',
    service: 'Custom Leather Seats',
    comment: 'The craftsmanship on my Prado seats is unmatched. Drove all the way from Eldoret to their workshop and it was worth every shilling. Proper Kenyan hands-on quality.',
    date: 'July 2026',
    verified: true
  },
  {
    id: 'rev-3',
    customerName: 'Esther Ndunge',
    location: 'Machakos / Nairobi',
    rating: 5,
    vehicle: 'Mazda Demio',
    service: 'Roofing & Headliner Repair',
    comment: 'My roof cloth had been sagging for months. James and his team stripped it, fitted a plush black fabric, and delivered the car clean within 6 hours. M-Pesa booking was seamless!',
    date: 'August 2026',
    verified: true
  },
  {
    id: 'rev-4',
    customerName: 'Captain David Oduor',
    location: 'Mombasa, Kenya',
    rating: 5,
    vehicle: 'Nissan X-Trail',
    service: 'Steering Stitch & Floor Carpeting',
    comment: 'The steering wheel grip feels better than brand new OEM. Beautiful gold contrast stitching and comfortable bolstering. Highly recommended to all Kenyan drivers.',
    date: 'June 2026',
    verified: true
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    recipientType: 'customer',
    title: 'Booking Confirmed!',
    message: 'Your booking #RR-1048 for Toyota Fielder has been confirmed for Saturday, 12 Sept at 10:00 AM.',
    timestamp: '2 hours ago',
    isRead: false,
    type: 'booking',
    relatedBookingId: 'RR-1048'
  },
  {
    id: 'notif-2',
    recipientType: 'customer',
    title: 'M-Pesa Deposit Received',
    message: 'KES 5,000 deposit received via M-Pesa (Ref: QJ89LK3299). Thank you!',
    timestamp: '2 hours ago',
    isRead: true,
    type: 'payment',
    relatedBookingId: 'RR-1048'
  },
  {
    id: 'notif-3',
    recipientType: 'admin',
    title: 'New Booking Request',
    message: 'Brian Mwangi submitted a new custom interior upholstery booking #RR-1048.',
    timestamp: '3 hours ago',
    isRead: false,
    type: 'booking',
    relatedBookingId: 'RR-1048'
  },
  {
    id: 'notif-4',
    recipientType: 'admin',
    title: 'M-Pesa STK Payment Settled',
    message: 'Received KES 10,000 deposit from Anthony Kiprotich (Ref: RG41ZX780N).',
    timestamp: 'Yesterday',
    isRead: true,
    type: 'payment',
    relatedBookingId: 'RR-1049'
  }
];
