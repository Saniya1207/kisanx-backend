import { Router } from "express";

const router = Router();

// 100+ Products Database with Base Mandi Prices
const PRODUCT_MASTER = [
  // --- VEGETABLES (35) ---
  { name: "Tomato", category: "vegetables", base: 32, unit: "kg" },
  { name: "Potato", category: "vegetables", base: 22, unit: "kg" },
  { name: "Onion", category: "vegetables", base: 28, unit: "kg" },
  { name: "Cauliflower", category: "vegetables", base: 45, unit: "kg" },
  { name: "Cabbage", category: "vegetables", base: 25, unit: "kg" },
  { name: "Spinach (Palak)", category: "vegetables", base: 20, unit: "kg" },
  { name: "Brinjal (Long)", category: "vegetables", base: 35, unit: "kg" },
  { name: "Brinjal (Round)", category: "vegetables", base: 38, unit: "kg" },
  { name: "Lady Finger (Okra)", category: "vegetables", base: 55, unit: "kg" },
  { name: "Bottle Gourd (Lauki)", category: "vegetables", base: 30, unit: "kg" },
  { name: "Bitter Gourd (Karela)", category: "vegetables", base: 60, unit: "kg" },
  { name: "Ridge Gourd (Turai)", category: "vegetables", base: 45, unit: "kg" },
  { name: "Green Chilli", category: "vegetables", base: 70, unit: "kg" },
  { name: "Ginger", category: "vegetables", base: 120, unit: "kg" },
  { name: "Garlic", category: "vegetables", base: 180, unit: "kg" },
  { name: "Capsicum (Green)", category: "vegetables", base: 65, unit: "kg" },
  { name: "Capsicum (Red/Yellow)", category: "vegetables", base: 150, unit: "kg" },
  { name: "Carrot (Orange)", category: "vegetables", base: 40, unit: "kg" },
  { name: "Carrot (Red)", category: "vegetables", base: 50, unit: "kg" },
  { name: "Radish (Mooli)", category: "vegetables", base: 25, unit: "kg" },
  { name: "Cucumber", category: "vegetables", base: 35, unit: "kg" },
  { name: "French Beans", category: "vegetables", base: 90, unit: "kg" },
  { name: "Green Peas (Matar)", category: "vegetables", base: 80, unit: "kg" },
  { name: "Beetroot", category: "vegetables", base: 45, unit: "kg" },
  { name: "Sweet Potato", category: "vegetables", base: 40, unit: "kg" },
  { name: "Drumstick", category: "vegetables", base: 110, unit: "kg" },
  { name: "Pumpkin", category: "vegetables", base: 20, unit: "kg" },
  { name: "Pointed Gourd (Parwal)", category: "vegetables", base: 60, unit: "kg" },
  { name: "Ivy Gourd (Tindora)", category: "vegetables", base: 40, unit: "kg" },
  { name: "Colocasia (Arbi)", category: "vegetables", base: 45, unit: "kg" },
  { name: "Mushroom (Button)", category: "vegetables", base: 200, unit: "kg" },
  { name: "Coriander Leaves", category: "vegetables", base: 15, unit: "kg" },
  { name: "Mint Leaves", category: "vegetables", base: 10, unit: "kg" },
  { name: "Broccoli", category: "vegetables", base: 140, unit: "kg" },
  { name: "Zucchini", category: "vegetables", base: 120, unit: "kg" },

  // --- FRUITS (30) ---
  { name: "Mango (Alphonso)", category: "fruits", base: 450, unit: "kg" },
  { name: "Mango (Kesar)", category: "fruits", base: 250, unit: "kg" },
  { name: "Mango (Dasheri)", category: "fruits", base: 120, unit: "kg" },
  { name: "Apple (Kashmiri)", category: "fruits", base: 140, unit: "kg" },
  { name: "Apple (Shimla)", category: "fruits", base: 160, unit: "kg" },
  { name: "Banana (Robusta)", category: "fruits", base: 40, unit: "kg" },
  { name: "Banana (Elaichi)", category: "fruits", base: 80, unit: "kg" },
  { name: "Grapes (Green Seedless)", category: "fruits", base: 90, unit: "kg" },
  { name: "Grapes (Black)", category: "fruits", base: 130, unit: "kg" },
  { name: "Orange (Nagpur)", category: "fruits", base: 70, unit: "kg" },
  { name: "Sweet Lime (Mosambi)", category: "fruits", base: 65, unit: "kg" },
  { name: "Pomegranate (Anar)", category: "fruits", base: 180, unit: "kg" },
  { name: "Watermelon", category: "fruits", base: 20, unit: "kg" },
  { name: "Muskmelon", category: "fruits", base: 45, unit: "kg" },
  { name: "Papaya", category: "fruits", base: 40, unit: "kg" },
  { name: "Guava (Amrud)", category: "fruits", base: 60, unit: "kg" },
  { name: "Pineapple", category: "fruits", base: 80, unit: "kg" },
  { name: "Chickoo", category: "fruits", base: 55, unit: "kg" },
  { name: "Pear (Nashpati)", category: "fruits", base: 110, unit: "kg" },
  { name: "Kiwi", category: "fruits", base: 350, unit: "kg" },
  { name: "Dragon Fruit", category: "fruits", base: 220, unit: "kg" },
  { name: "Strawberry", category: "fruits", base: 400, unit: "kg" },
  { name: "Plum", category: "fruits", base: 150, unit: "kg" },
  { name: "Custard Apple (Sitaphal)", category: "fruits", base: 100, unit: "kg" },
  { name: "Litchi", category: "fruits", base: 200, unit: "kg" },
  { name: "Coconut (Tender)", category: "fruits", base: 50, unit: "unit" },
  { name: "Coconut (Dry)", category: "fruits", base: 35, unit: "unit" },
  { name: "Peach", category: "fruits", base: 130, unit: "kg" },
  { name: "Apricot", category: "fruits", base: 250, unit: "kg" },
  { name: "Cherry", category: "fruits", base: 500, unit: "kg" },

  // --- GRAINS & PULSES (25) ---
  { name: "Wheat (Sharbati)", category: "grains", base: 3200, unit: "Quintal" },
  { name: "Wheat (Lokwan)", category: "grains", base: 2800, unit: "Quintal" },
  { name: "Rice (Basmati)", category: "grains", base: 8500, unit: "Quintal" },
  { name: "Rice (Kolam)", category: "grains", base: 5500, unit: "Quintal" },
  { name: "Rice (Indrayani)", category: "grains", base: 6000, unit: "Quintal" },
  { name: "Rice (Sona Masoori)", category: "grains", base: 5200, unit: "Quintal" },
  { name: "Bajra (Pearl Millet)", category: "grains", base: 2400, unit: "Quintal" },
  { name: "Jowar (Sorghum)", category: "grains", base: 3500, unit: "Quintal" },
  { name: "Ragi (Finger Millet)", category: "grains", base: 3000, unit: "Quintal" },
  { name: "Maize (Corn)", category: "grains", base: 2100, unit: "Quintal" },
  { name: "Toor Dal (Arhar)", category: "grains", base: 11000, unit: "Quintal" },
  { name: "Moong Dal", category: "grains", base: 9500, unit: "Quintal" },
  { name: "Moong (Whole)", category: "grains", base: 8500, unit: "Quintal" },
  { name: "Chana Dal", category: "grains", base: 6500, unit: "Quintal" },
  { name: "Kabuli Chana", category: "grains", base: 12000, unit: "Quintal" },
  { name: "Urad Dal", category: "grains", base: 10500, unit: "Quintal" },
  { name: "Masoor Dal", category: "grains", base: 7500, unit: "Quintal" },
  { name: "Rajma (Red)", category: "grains", base: 13000, unit: "Quintal" },
  { name: "Soyabean", category: "grains", base: 4800, unit: "Quintal" },
  { name: "Groundnut (Moongfali)", category: "grains", base: 7000, unit: "Quintal" },
  { name: "Mustard Seeds (Sarson)", category: "grains", base: 5500, unit: "Quintal" },
  { name: "Sunflower Seeds", category: "grains", base: 6200, unit: "Quintal" },
  { name: "Black Pepper", category: "grains", base: 55000, unit: "Quintal" },
  { name: "Turmeric (Raw)", category: "grains", base: 8000, unit: "Quintal" },
  { name: "Cumin Seeds (Jeera)", category: "grains", base: 35000, unit: "Quintal" },

  // --- SPICES (10) ---
  { name: "Turmeric (Haldi)", category: "spices", base: 120, unit: "kg" },
  { name: "Cumin (Jeera)", category: "spices", base: 350, unit: "kg" },
  { name: "Coriander Powder (Dhania)", category: "spices", base: 180, unit: "kg" },
  { name: "Red Chilli Powder", category: "spices", base: 220, unit: "kg" },
  { name: "Black Pepper (Kali Mirch)", category: "spices", base: 600, unit: "kg" },
  { name: "Cardamom (Elaichi)", category: "spices", base: 1800, unit: "kg" },
  { name: "Cinnamon (Dalchini)", category: "spices", base: 450, unit: "kg" },
  { name: "Cloves (Laung)", category: "spices", base: 900, unit: "kg" },
  { name: "Mustard Seeds (Rai)", category: "spices", base: 95, unit: "kg" },
  { name: "Fenugreek (Methi Seeds)", category: "spices", base: 110, unit: "kg" },
];

// Function to simulate hourly price change
const getDynamicPrice = (base: number) => {
  const hour = new Date().getHours();
  // Deterministic fluctuation based on current hour (+/- 8%)
  const fluctuation = Math.sin(hour) * 0.08; 
  return parseFloat((base * (1 + fluctuation)).toFixed(2));
};

router.get("/rates", (req, res) => {
  const { search } = req.query;
  
  let data = PRODUCT_MASTER;
  if (search) {
    data = PRODUCT_MASTER.filter(p => 
      p.name.toLowerCase().includes(search.toString().toLowerCase())
    );
  }

  const results = data.map(p => {
    const mandiPrice = getDynamicPrice(p.base);
    return {
      ...p,
      mandi: mandiPrice,
      blinkit: parseFloat((mandiPrice * 1.45).toFixed(2)), // 45% Retail Margin
      zepto: parseFloat((mandiPrice * 1.50).toFixed(2)),   // 50% Retail Margin
      dmart: parseFloat((mandiPrice * 1.25).toFixed(2)),   // 25% Margin
    };
  });

  res.json(results);
});

export default router;