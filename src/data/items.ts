export type ItemCategory =
  | "Percusión"
  | "Amplificadores guitarra"
  | "Amplificadores bajo"
  | "Teclados"
  | "Micrófonos"
  | "Consola"
  | "Monitores"
  | "Pedales"
  | "Cables y accesorios"
  | "Otros";

export const itemCategories: ItemCategory[] = [
  "Percusión",
  "Amplificadores guitarra",
  "Amplificadores bajo",
  "Teclados",
  "Micrófonos",
  "Consola",
  "Monitores",
  "Pedales",
  "Cables y accesorios",
  "Otros",
];

export type InventoryItem = {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  image?: string;
  totalQty: number;
  addonPrice: number;
  rentalPrice: number;
  availableForRental: boolean;
  forSale: boolean;
  salePrice?: number;
  linkedRooms: { roomName: string; qty: number }[];
};

export const items: InventoryItem[] = [
  {
    id: "i1",
    name: "Marshall JCM800",
    category: "Amplificadores guitarra",
    description: "Cabezal a válvulas 100W con pantalla 4x12.",
    totalQty: 2,
    addonPrice: 6,
    rentalPrice: 45,
    availableForRental: true,
    forSale: false,
    linkedRooms: [{ roomName: "Studio A", qty: 1 }],
  },
  {
    id: "i2",
    name: "Pearl Export 5pc",
    category: "Percusión",
    description: "Batería completa con hardware. Platos no incluidos.",
    totalQty: 1,
    addonPrice: 8,
    rentalPrice: 60,
    availableForRental: true,
    forSale: false,
    linkedRooms: [{ roomName: "Studio A", qty: 1 }],
  },
  {
    id: "i3",
    name: "Shure SM58",
    category: "Micrófonos",
    description: "Micrófono dinámico cardioide para voz.",
    totalQty: 8,
    addonPrice: 2,
    rentalPrice: 8,
    availableForRental: true,
    forSale: true,
    salePrice: 110,
    linkedRooms: [
      { roomName: "Studio A", qty: 4 },
      { roomName: "Studio B", qty: 2 },
    ],
  },
  {
    id: "i4",
    name: "Ampeg SVT-CL",
    category: "Amplificadores bajo",
    description: "Cabezal de bajo a válvulas, 300W.",
    totalQty: 1,
    addonPrice: 7,
    rentalPrice: 50,
    availableForRental: true,
    forSale: false,
    linkedRooms: [{ roomName: "Studio A", qty: 1 }],
  },
  {
    id: "i5",
    name: "Yamaha HS8",
    category: "Monitores",
    description: "Monitor de campo cercano, par.",
    totalQty: 4,
    addonPrice: 4,
    rentalPrice: 25,
    availableForRental: true,
    forSale: false,
    linkedRooms: [{ roomName: "Studio A", qty: 2 }],
  },
  {
    id: "i6",
    name: "Boss DD-200",
    category: "Pedales",
    description: "Pedal de delay digital con presets.",
    totalQty: 3,
    addonPrice: 1,
    rentalPrice: 10,
    availableForRental: true,
    forSale: true,
    salePrice: 220,
    linkedRooms: [],
  },
  {
    id: "i7",
    name: "SSL SiX",
    category: "Consola",
    description: "Consola compacta de 6 canales con preamps SSL.",
    totalQty: 1,
    addonPrice: 12,
    rentalPrice: 80,
    availableForRental: false,
    forSale: false,
    linkedRooms: [{ roomName: "Studio C", qty: 1 }],
  },
  {
    id: "i8",
    name: "Nord Stage 3",
    category: "Teclados",
    description: "Teclado de escenario 88 teclas, acción ponderada.",
    totalQty: 1,
    addonPrice: 10,
    rentalPrice: 70,
    availableForRental: true,
    forSale: false,
    linkedRooms: [],
  },
];
