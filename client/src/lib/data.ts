import ganeshaImg from "@assets/generated_images/pencil_sketch_of_lord_ganesha.png";
import yogaAbstractImg from "@assets/generated_images/abstract_yoga_painting.png";
import yogaSketchImg from "@assets/generated_images/charcoal_yoga_sketch.png";
import lotusImg from "@assets/generated_images/digital_lotus_painting.png";
import krishnaImg from "@assets/generated_images/krishna_sculpture.png";

// Using stock images for variety
const stockAbstract1 = "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&q=80&w=800";
const stockAbstract2 = "https://images.unsplash.com/photo-1549887534-1541e9326642?auto=format&fit=crop&q=80&w=800";
const stockSculpture = "https://images.unsplash.com/photo-1515169273894-7e876dcf15ea?auto=format&fit=crop&q=80&w=800";

export const products = [
  {
    id: 1,
    name: "Divine Ganesha",
    description: "A soft pencil sketch capturing the gentle wisdom of Lord Ganesha. Created on textured archival paper.",
    price: 250,
    category: "Sketches",
    image: ganeshaImg,
    dimensions: "12 x 16 inches",
    medium: "Graphite on Paper"
  },
  {
    id: 2,
    name: "Flow State",
    description: "An abstract exploration of energy and movement in yoga practice. Soft pastels and fluid forms.",
    price: 850,
    category: "Abstract",
    image: yogaAbstractImg,
    dimensions: "24 x 36 inches",
    medium: "Acrylic on Canvas"
  },
  {
    id: 3,
    name: "Asana Study I",
    description: "Expressive charcoal study of a dancer in a meditative pose. Minimalist and powerful.",
    price: 180,
    category: "Sketches",
    image: yogaSketchImg,
    dimensions: "11 x 14 inches",
    medium: "Charcoal on Paper"
  },
  {
    id: 4,
    name: "Eternal Lotus",
    description: "Digital painting depicting spiritual awakening. Ethereal lighting and calm waters.",
    price: 120,
    category: "Digital",
    image: lotusImg,
    dimensions: "Digital Print (Various Sizes)",
    medium: "Digital Art"
  },
  {
    id: 5,
    name: "Krishna's Flute",
    description: "Detailed clay sculpture focusing on the divine melody. Soft lighting brings out the texture.",
    price: 1200,
    category: "Sculptures",
    image: krishnaImg,
    dimensions: "14 inches height",
    medium: "Terracotta"
  },
  {
    id: 6,
    name: "Morning Meditation",
    description: "Abstract interpretation of the morning sun and inner peace.",
    price: 600,
    category: "Abstract",
    image: stockAbstract1,
    dimensions: "20 x 20 inches",
    medium: "Oil on Canvas"
  },
  {
    id: 7,
    name: "Inner Silence",
    description: "Textured abstract work exploring the concept of silence and void.",
    price: 550,
    category: "Abstract",
    image: stockAbstract2,
    dimensions: "18 x 24 inches",
    medium: "Mixed Media"
  },
  {
    id: 8,
    name: "Temple Guardian",
    description: "Classical sculpture inspired by ancient temple art.",
    price: 1500,
    category: "Sculptures",
    image: stockSculpture,
    dimensions: "18 inches height",
    medium: "Stone"
  }
];

export const categories = ["All", "Sketches", "Abstract", "Digital", "Sculptures"];
