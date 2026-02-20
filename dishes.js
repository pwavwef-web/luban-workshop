// Hardcoded dish catalog for Luban Workshop Restaurant
// Admin can toggle each dish's availability in the admin dashboard.
// Availability state is persisted in Firestore (menuItems collection).
const DISHES = [
    // ── Soups ──
    { id: 'SP1', name: 'Chicken & Sweet Corn Soup', category: 'soups', price: 40, description: 'A smooth, savoury broth with tender chicken and sweet corn.', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=240&fit=crop&auto=format' },
    { id: 'SP2', name: 'Hot & Sour Soup', category: 'soups', price: 40, description: 'Traditional Chinese hot and sour broth with tofu and vegetables.', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=240&fit=crop&auto=format' },

    // ── Starters ──
    { id: 'S1', name: 'Beef Spring Rolls (3 pcs)', category: 'starters', price: 30, description: 'Crispy fried rolls filled with seasoned beef, served with sweet chilli sauce.', image: 'https://images.unsplash.com/photo-1606525437394-f0b0df43c5e0?w=400&h=240&fit=crop&auto=format' },
    { id: 'S2', name: 'Vegetable Spring Rolls (3 pcs)', category: 'starters', price: 25, description: 'Golden fried rolls packed with fresh garden vegetables.', image: 'https://images.unsplash.com/photo-1563245372-f89ffd94b5eb?w=400&h=240&fit=crop&auto=format' },
    { id: 'S3', name: 'Beef Samosa (5 pcs)', category: 'starters', price: 30, description: 'Crispy pastry parcels filled with spiced minced beef.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=240&fit=crop&auto=format' },
    { id: 'S4', name: 'Fish Samosa (5 pcs)', category: 'starters', price: 30, description: 'Crispy pastry parcels filled with seasoned fish.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=240&fit=crop&auto=format' },
    { id: 'S5', name: 'Fried Chicken Pieces (6 pcs)', category: 'starters', price: 65, description: 'Juicy chicken pieces fried to a perfect golden crisp.', image: 'https://images.unsplash.com/photo-1562967915-6ba607ff4a08?w=400&h=240&fit=crop&auto=format' },
    { id: 'S6', name: 'Special Chicken Wings', category: 'starters', price: 65, description: 'Marinated chicken wings glazed in our house special sauce.', image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=240&fit=crop&auto=format' },
    { id: 'S7', name: 'Golden Fried Prawns', category: 'starters', price: 90, description: 'Plump prawns lightly battered and fried until golden.', image: 'https://images.unsplash.com/photo-1559410545-0bdb565a7e6b?w=400&h=240&fit=crop&auto=format' },
    { id: 'S8', name: 'Fried Squid in Spicy Salt', category: 'starters', price: 85, description: 'Tender squid tossed in aromatic spiced salt.', image: 'https://images.unsplash.com/photo-1617622141573-0e6db8c3dc7a?w=400&h=240&fit=crop&auto=format' },

    // ── Beef & Lamb ──
    { id: 'B1', name: 'Shredded Beef with Green Pepper & Onion', category: 'beef-lamb', price: 110, description: 'Tender shredded beef stir-fried with fresh green pepper and onion in a rich sauce.', image: 'https://images.unsplash.com/photo-1529193591-8c9ae9699b13?w=400&h=240&fit=crop&auto=format' },
    { id: 'B2', name: 'Beef in Sichuan Sauce', category: 'beef-lamb', price: 110, description: 'Sliced beef in a bold, aromatic Sichuan sauce. Please ask staff for today\'s pricing.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=240&fit=crop&auto=format' },
    { id: 'B3', name: 'Sliced Beef in Curry Sauce', category: 'beef-lamb', price: 110, description: 'Tender sliced beef simmered in a fragrant curry sauce.', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=240&fit=crop&auto=format' },
    { id: 'B4', name: 'Beef in Oyster Sauce', category: 'beef-lamb', price: 110, description: 'Succulent beef wok-tossed in a classic oyster sauce.', image: 'https://images.unsplash.com/photo-1529193591-8c9ae9699b13?w=400&h=240&fit=crop&auto=format' },
    { id: 'B5', name: 'Crispy Chilli Beef', category: 'beef-lamb', price: 85, description: 'Crispy strips of beef tossed in a sweet chilli glaze.', image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&h=240&fit=crop&auto=format' },
    { id: 'B6', name: 'Mongolian Shallot Lamb', category: 'beef-lamb', price: 115, description: 'Tender lamb stir-fried with shallots in a rich Mongolian sauce.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=240&fit=crop&auto=format' },
    { id: 'B7', name: 'Lamb Chops', category: 'beef-lamb', price: 85, description: 'Succulent lamb chops marinated and cooked to perfection.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=240&fit=crop&auto=format' },

    // ── Pork ──
    { id: 'P1', name: 'Sweet & Sour Pork', category: 'pork', price: 90, description: 'Classic sweet and sour pork with peppers and pineapple.', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=240&fit=crop&auto=format' },
    { id: 'P2', name: 'Pork Sichuan Style', category: 'pork', price: 90, description: 'Tender pork slices in a fiery, numbing Sichuan sauce.', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=240&fit=crop&auto=format' },
    { id: 'P3', name: 'Pork in Chilli Sauce', category: 'pork', price: 90, description: 'Juicy pork pieces in a vibrant, spicy chilli sauce.', image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=240&fit=crop&auto=format' },
    { id: 'P4', name: 'Pork in Oyster Sauce', category: 'pork', price: 90, description: 'Tender pork wok-tossed in a savoury oyster sauce.', image: 'https://images.unsplash.com/photo-1529193591-8c9ae9699b13?w=400&h=240&fit=crop&auto=format' },
    { id: 'P5', name: 'Fried Pork Ribs', category: 'pork', price: 75, description: 'Crispy fried pork ribs seasoned with aromatic spices.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=240&fit=crop&auto=format' },

    // ── Chicken ──
    { id: 'K1', name: 'Sweet & Sour Chicken', category: 'chicken', price: 100, description: 'Tender chicken in a classic sweet and sour sauce with colourful peppers.', image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=240&fit=crop&auto=format' },
    { id: 'K2', name: 'Chicken Sichuan Sauce', category: 'chicken', price: 100, description: 'Succulent chicken in a bold, aromatic Sichuan sauce.', image: 'https://images.unsplash.com/photo-1604908176997-7f81f85f7c8e?w=400&h=240&fit=crop&auto=format' },
    { id: 'K3', name: 'Chicken in Curry Sauce', category: 'chicken', price: 100, description: 'Juicy chicken pieces slow-cooked in a fragrant curry sauce.', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=240&fit=crop&auto=format' },
    { id: 'K4', name: 'Chicken in Oyster Sauce', category: 'chicken', price: 100, description: 'Tender chicken wok-tossed in a rich oyster sauce with vegetables.', image: 'https://images.unsplash.com/photo-1562967915-6ba607ff4a08?w=400&h=240&fit=crop&auto=format' },

    // ── Seafood ──
    { id: 'Q1', name: 'Squid in Luban Chilli Sauce', category: 'seafood', price: 120, description: 'Tender squid in our signature Luban chilli sauce.', image: 'https://images.unsplash.com/photo-1617622141573-0e6db8c3dc7a?w=400&h=240&fit=crop&auto=format' },
    { id: 'Q2', name: 'Squid in Sichuan Sauce', category: 'seafood', price: 120, description: 'Squid rings in a bold, numbing Sichuan sauce.', image: 'https://images.unsplash.com/photo-1617622141573-0e6db8c3dc7a?w=400&h=240&fit=crop&auto=format' },
    { id: 'Q3', name: 'Squid in Garlic Sauce', category: 'seafood', price: 120, description: 'Tender squid stir-fried with aromatic garlic sauce.', image: 'https://images.unsplash.com/photo-1617622141573-0e6db8c3dc7a?w=400&h=240&fit=crop&auto=format' },
    { id: 'F1', name: 'Fish Fillet in Chilli Sauce', category: 'seafood', price: 115, description: 'Delicate fish fillet in a vibrant spicy chilli sauce.', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=240&fit=crop&auto=format' },
    { id: 'F2', name: 'Fish Fillet in Vegetable Sauce', category: 'seafood', price: 115, description: 'Tender fish fillet served in a light, garden-fresh vegetable sauce.', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=240&fit=crop&auto=format' },
    { id: 'F3', name: 'Fish Fillet in Sichuan Sauce', category: 'seafood', price: 115, description: 'Flaky fish fillet in a bold Sichuan sauce.', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=240&fit=crop&auto=format' },
    { id: 'F4', name: 'Sweet & Sour Fish Fillet', category: 'seafood', price: 115, description: 'Crispy fish fillet in a tangy sweet and sour sauce.', image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=240&fit=crop&auto=format' },
    { id: 'PR1', name: 'Prawns in Chilli Sauce', category: 'seafood', price: 155, description: 'Plump prawns tossed in a fiery, flavourful chilli sauce.', image: 'https://images.unsplash.com/photo-1559410545-0bdb565a7e6b?w=400&h=240&fit=crop&auto=format' },
    { id: 'PR2', name: 'Prawns in Curry Sauce', category: 'seafood', price: 155, description: 'Succulent prawns in a rich, fragrant curry sauce.', image: 'https://images.unsplash.com/photo-1559410545-0bdb565a7e6b?w=400&h=240&fit=crop&auto=format' },
    { id: 'PR3', name: 'Prawns in Sichuan Sauce', category: 'seafood', price: 155, description: 'Juicy prawns in an aromatic, spicy Sichuan sauce.', image: 'https://images.unsplash.com/photo-1559410545-0bdb565a7e6b?w=400&h=240&fit=crop&auto=format' },
    { id: 'SF1', name: 'Special Seafood in Sichuan Sauce', category: 'seafood', price: 170, description: 'A chef\'s selection of premium seafood in our bold Sichuan sauce.', image: 'https://images.unsplash.com/photo-1559410545-0bdb565a7e6b?w=400&h=240&fit=crop&auto=format' },

    // ── Rice ──
    { id: 'R1', name: 'Steamed Rice', category: 'rice', price: 29, description: 'Fluffy steamed white rice, the perfect accompaniment.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'R2', name: 'Special Jollof Rice', category: 'rice', price: 50, description: 'Our flavourful take on West African jollof rice.', image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&h=240&fit=crop&auto=format' },
    { id: 'R3', name: 'Combo Fried Rice', category: 'rice', price: 50, description: 'Wok-fried rice with a combination of chicken, beef and vegetables.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'R4', name: 'Shrimp Fried Rice', category: 'rice', price: 50, description: 'Fragrant fried rice tossed with plump shrimp and egg.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'RS', name: 'Egg Fried Rice', category: 'rice', price: 40, description: 'Classic wok-fried rice with fluffy scrambled egg.', image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400&h=240&fit=crop&auto=format' },
    { id: 'R6', name: 'Beef Fried Rice', category: 'rice', price: 45, description: 'Savoury fried rice stir-fried with tender sliced beef.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'R7', name: 'Chicken Fried Rice', category: 'rice', price: 45, description: 'Aromatic fried rice wok-tossed with succulent chicken pieces.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'R8', name: 'Seafood Fried Rice', category: 'rice', price: 85, description: 'Wok-fried rice packed with a generous medley of fresh seafood.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },
    { id: 'R9', name: 'Pork Fried Rice', category: 'rice', price: 45, description: 'Fragrant fried rice with tender pork and vegetables.', image: 'https://images.unsplash.com/photo-1603133872634-6e01db44284e?w=400&h=240&fit=crop&auto=format' },

    // ── Noodles ──
    { id: 'N1', name: 'Vegetable Noodles', category: 'noodles', price: 45, description: 'Wok-tossed noodles with a colourful medley of fresh vegetables.', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=240&fit=crop&auto=format' },
    { id: 'N2', name: 'Special Noodles', category: 'noodles', price: 80, description: 'Wok-fried noodles with a chef\'s special combination of meat and vegetables.', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=240&fit=crop&auto=format' },
    { id: 'N4', name: 'Singapore Noodles', category: 'noodles', price: 80, description: 'Thin rice vermicelli stir-fried with curry powder, prawns, and vegetables.', image: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?w=400&h=240&fit=crop&auto=format' },
    { id: 'N5', name: 'Seafood Noodles', category: 'noodles', price: 100, description: 'Noodles wok-fried with a generous helping of mixed seafood.', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=240&fit=crop&auto=format' },
    { id: 'N6', name: 'Chicken Noodles', category: 'noodles', price: 60, description: 'Tender chicken strips tossed with flavourful wok-fried noodles.', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=240&fit=crop&auto=format' },

    // ── Dumplings ──
    { id: 'D1', name: 'Steamed Pork Dumpling', category: 'dumplings', price: 30, description: 'Handcrafted dumplings filled with seasoned pork, gently steamed.', image: 'https://images.unsplash.com/photo-1563245372-f89ffd94b5eb?w=400&h=240&fit=crop&auto=format' },
    { id: 'D2', name: 'Fried Pork Dumpling', category: 'dumplings', price: 30, description: 'Crispy pan-fried dumplings filled with seasoned pork.', image: 'https://images.unsplash.com/photo-1563245372-f89ffd94b5eb?w=400&h=240&fit=crop&auto=format' },
    { id: 'D3', name: 'Steamed Beef Dumpling', category: 'dumplings', price: 30, description: 'Handcrafted dumplings filled with seasoned beef, gently steamed.', image: 'https://images.unsplash.com/photo-1563245372-f89ffd94b5eb?w=400&h=240&fit=crop&auto=format' },
    { id: 'D4', name: 'Fried Beef Dumpling', category: 'dumplings', price: 30, description: 'Crispy pan-fried dumplings filled with seasoned beef.', image: 'https://images.unsplash.com/photo-1563245372-f89ffd94b5eb?w=400&h=240&fit=crop&auto=format' },

    // ── Vegetable ──
    { id: 'V1', name: 'Mixed Vegetable Sauce', category: 'veg', price: 40, description: 'A vibrant stir-fry of seasonal mixed vegetables in a light savoury sauce.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=240&fit=crop&auto=format' }
];
