// js/data/food.js
// Food items available in the market and as quest incidental rewards.
// foodRestore: how much food value is added on consumption (max 100)
// effect: temporary stat modifier applied on consumption
// shopAvailable: false = not sold in market (e.g., rift drops)

const FOOD_ITEMS = [
    {
        id: 'bread',
        name: 'Bread',
        description: 'A dense loaf baked in ash. Hard but filling.',
        foodRestore: 15,
        goldValue: 15,
        shopAvailable: true,
        effect: { type: 'regen_reduction', stat: 'health', amount: 0.10, durationMin: 10 },
        effectDesc: '−10% health regen for 10 min',
        effectWarn: true,
    },
    {
        id: 'dried_meat',
        name: 'Dried Meat',
        description: 'Salted and cured strips of venison. Clean and balanced.',
        foodRestore: 35,
        goldValue: 36,
        shopAvailable: true,
        effect: null,
        effectDesc: 'No side effects',
        effectWarn: false,
    },
    {
        id: 'hot_stew',
        name: 'Hot Stew',
        description: 'A thick stew ladled from a tavern pot. Warming but heavy.',
        foodRestore: 50,
        goldValue: 45,
        shopAvailable: true,
        effect: { type: 'regen_reduction', stat: 'stamina', amount: 0.15, durationMin: 15 },
        effectDesc: '−15% stamina regen for 15 min (heavy meal)',
        effectWarn: true,
    },
    {
        id: 'travel_rations',
        name: 'Travel Rations',
        description: 'A wrapped bundle of dried goods for the road. Light and efficient.',
        foodRestore: 70,
        goldValue: 66,
        shopAvailable: true,
        effect: { type: 'regen_boost', stat: 'stamina', amount: 0.20, durationMin: 20 },
        effectDesc: '+20% stamina regen for 20 min',
        effectWarn: false,
    },
    {
        id: 'feast_plate',
        name: 'Feast Plate',
        description: 'A full meal fit for a soldier returning from war. Filling but sluggish.',
        foodRestore: 100,
        goldValue: 105,
        shopAvailable: true,
        effect: { type: 'regen_reduction', stat: null, amount: 0.20, durationMin: 30 },
        effectDesc: '−20% ALL regen for 30 min (food coma)',
        effectWarn: true,
    },
    {
        id: 'corrupted_ration',
        name: 'Corrupted Ration',
        description: 'Rift-tainted sustenance. Fills the body while darkening the soul.',
        foodRestore: 75,
        goldValue: 0,
        shopAvailable: false,
        effect: { type: 'corruption_gain', stat: null, amount: 15, durationMin: 0 },
        effectDesc: '+15 Corruption',
        effectWarn: true,
    },
];
