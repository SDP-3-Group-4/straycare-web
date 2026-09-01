export interface Clinic {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  openHour: number;
  closeHour: number;
  services: string[];
  emoji: string;
  lat: number;
  lng: number;
  verified?: boolean;
}

export const CLINIC_CATEGORIES = [
  "All",
  "Veterinary Clinic",
  "Pet Hospital",
  "Grooming",
  "24/7 Emergency",
];

export const CLINICS: Clinic[] = [
  {
    id: "clinic-1",
    name: "Dhaka Pet Clinic",
    category: "Veterinary Clinic",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
    phone: "+880 1712-345678",
    rating: 4.8,
    reviews: 214,
    openHour: 9,
    closeHour: 21,
    services: ["Checkups", "Vaccination", "Surgery", "Lab Tests"],
    emoji: "🐶",
    lat: 23.7461,
    lng: 90.3762,
  },
  {
    id: "clinic-2",
    name: "Care Veterinary Hospital",
    category: "Pet Hospital",
    address: "Plot 45, Gulshan 2, Dhaka 1212",
    phone: "+880 1711-987654",
    rating: 4.7,
    reviews: 168,
    openHour: 8,
    closeHour: 22,
    services: ["Emergency", "ICU", "X-Ray", "Dentistry"],
    emoji: "🏥",
    lat: 23.7925,
    lng: 90.4153,
  },
  {
    id: "clinic-3",
    name: "PawLife Animal Hospital",
    category: "24/7 Emergency",
    address: "Road 8, Banani, Dhaka 1213",
    phone: "+880 1922-334455",
    rating: 4.9,
    reviews: 302,
    openHour: 0,
    closeHour: 24,
    services: ["24/7 Emergency", "Surgery", "Ambulance", "Online Consult"],
    emoji: "🐱",
    lat: 23.7936,
    lng: 90.4042,
  },
  {
    id: "clinic-4",
    name: "Vet Express Care",
    category: "Veterinary Clinic",
    address: "Shop 8, Shahbagh, Dhaka 1000",
    phone: "+880 1815-667788",
    rating: 4.5,
    reviews: 97,
    openHour: 10,
    closeHour: 20,
    services: ["Checkups", "Vaccination", "Grooming", "Pet Food"],
    emoji: "🩺",
    lat: 23.7381,
    lng: 90.3851,
  },
  {
    id: "clinic-5",
    name: "Green Leaf Pet Care",
    category: "Grooming",
    address: "House 22, Road 7, Mirpur 10, Dhaka 1216",
    phone: "+880 1677-889900",
    rating: 4.6,
    reviews: 121,
    openHour: 9,
    closeHour: 19,
    services: ["Grooming", "Spa", "Bathing", "Nail Care"],
    emoji: "🦮",
    lat: 23.8069,
    lng: 90.3687,
  },
  {
    id: "clinic-6",
    name: "Blue Cross Veterinary Clinic",
    category: "Pet Hospital",
    address: "Road 11, Uttara Sector 7, Dhaka 1230",
    phone: "+880 1511-223344",
    rating: 4.4,
    reviews: 76,
    openHour: 8,
    closeHour: 20,
    services: ["Checkups", "Vaccination", "Ultrasound", "Pharmacy"],
    emoji: "🐕",
    lat: 23.8759,
    lng: 90.3795,
    verified: true,
  },
];

export const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 };
