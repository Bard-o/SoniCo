import room1 from "@/assets/room-1.jpg";
import room2 from "@/assets/room-2.jpg";
import room3 from "@/assets/room-3.jpg";

export type RoomItem = { name: string; category: string; qty: number };

export type Room = {
  slug: string;
  name: string;
  image: string;
  gallery: string[];
  pricePerHalfHour: number;
  shortDescription: string;
  description: string;
  available: boolean;
  categories: string[];
  items: RoomItem[];
};

export const rooms: Room[] = [
  {
    slug: "studio-a",
    name: "Studio A — The Live Room",
    image: room1,
    gallery: [room1, room3, room2],
    pricePerHalfHour: 18,
    shortDescription: "Sala insignia con kit completo, acústica tratada y monitoreo profesional.",
    description:
      "Nuestra sala más grande, diseñada para bandas completas. Tratamiento acústico de primer nivel, isolation premium e iluminación cálida regulable. Ideal para ensayos serios y pre-producción.",
    available: true,
    categories: ["Percusión", "Amplificadores", "Micrófonos", "Monitores"],
    items: [
      { name: "Pearl Export 5pc", category: "Percusión", qty: 1 },
      { name: "Zildjian A Custom Cymbals", category: "Percusión", qty: 4 },
      { name: "Marshall JCM800", category: "Amplificadores", qty: 1 },
      { name: "Fender Twin Reverb", category: "Amplificadores", qty: 1 },
      { name: "Ampeg SVT Bass", category: "Amplificadores", qty: 1 },
      { name: "Shure SM58", category: "Micrófonos", qty: 4 },
      { name: "Yamaha HS8", category: "Monitores", qty: 2 },
    ],
  },
  {
    slug: "studio-b",
    name: "Studio B — The Vintage Room",
    image: room2,
    gallery: [room2, room1, room3],
    pricePerHalfHour: 14,
    shortDescription: "Sala íntima de pared de ladrillo con amps a válvulas y carácter retro.",
    description:
      "Sala diseñada para tonos cálidos y sesiones creativas. Amps boutique, guitarras vintage y atmósfera única. Perfecta para tríos y cuartetos.",
    available: true,
    categories: ["Amplificadores", "Guitarras", "Micrófonos"],
    items: [
      { name: "Vox AC30", category: "Amplificadores", qty: 1 },
      { name: "Orange Rockerverb", category: "Amplificadores", qty: 1 },
      { name: "Gibson Les Paul Studio", category: "Guitarras", qty: 1 },
      { name: "Fender Stratocaster", category: "Guitarras", qty: 1 },
      { name: "Sennheiser e835", category: "Micrófonos", qty: 3 },
    ],
  },
  {
    slug: "studio-c",
    name: "Studio C — The Composer Suite",
    image: room3,
    gallery: [room3, room1, room2],
    pricePerHalfHour: 22,
    shortDescription: "Suite luminosa con piano de cola, consola y monitores de campo cercano.",
    description:
      "Espacio amplio con luz natural, ideal para composición, ensayos acústicos y sesiones de piano. Equipo de monitoreo de referencia para producción profesional.",
    available: false,
    categories: ["Piano", "Monitores", "Consola"],
    items: [
      { name: "Yamaha C3 Grand Piano", category: "Piano", qty: 1 },
      { name: "Genelec 8030C", category: "Monitores", qty: 2 },
      { name: "SSL SiX Console", category: "Consola", qty: 1 },
    ],
  },
];

export const studioHours = "Lun – Dom · 9:00 – 23:00";
