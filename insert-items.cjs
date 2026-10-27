const {createClient} = require('@supabase/supabase-js');
const supabase = createClient('https://rmgrhxvbxwdpctvegppb.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_J6uMcF72NX9RctyJvc-L_A_C9KBhVa3');

const newItems = [
  {name: 'Premium Kitchen Knife Set', quantity: 1, price: 25000, formatted_price: '₦25,000', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1593010918738-92261972b2e8?w=500&q=80', description: 'Complete set of high-quality stainless steel kitchen knives.'},
  {name: 'Elegant 24-Piece Cutlery Set', quantity: 1, price: 35000, formatted_price: '₦35,000', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1619860645601-5cd12e4303f2?w=500&q=80', description: 'Beautifully crafted cutlery set for dining and hosting.'},
  {name: 'Ceramic Mug Set', quantity: 1, price: 15000, formatted_price: '₦15,000', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80', description: 'Matching ceramic coffee mugs for a perfect morning brew.'},
  {name: 'Cozy Fleece Blanket', quantity: 1, price: 30000, formatted_price: '₦30,000', category: 'Home & Bedding', image: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=500&q=80', description: 'Ultra-soft fleece blanket for warmth and comfort.'},
  {name: 'Decorative Throw Pillows', quantity: 1, price: 20000, formatted_price: '₦20,000', category: 'Home & Bedding', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500&q=80', description: 'Set of stylish decorative throw pillows to elevate the living room.'},
  {name: '2-Slice Electric Toaster', quantity: 1, price: 22000, formatted_price: '₦22,000', category: 'Kitchen & Dining', image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=500&q=80', description: 'Modern electric toaster for quick and even browning.'},
  {name: '16-in-1 Food Processor', quantity: 1, price: 155000, formatted_price: '₦155,000', category: 'Kitchen & Dining', image: '/assets/16-in-1-food-processor.jpeg', description: 'Versatile food processor capable of blending, chopping, and much more.'}
];

supabase.from('wishlist_items').insert(newItems).select().then(({data, error}) => console.log('Inserted:', error || 'Success'));
