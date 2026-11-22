import { useMemo, useState } from 'react';
import { ArrowRight, Heart, Menu, Search, ShoppingBag, SlidersHorizontal, Store, UserRound, X } from 'lucide-react';

type Product = { id: number; name: string; store: string; price: number; category: string; image: string; badge?: string };

const products: Product[] = [
  { id: 1, name: 'Everyday Canvas Tote', store: 'Common Goods', price: 549, category: 'Fashion', badge: 'Bestseller', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&q=85' },
  { id: 2, name: 'Minimal Ceramic Set', store: 'Sunday Studio', price: 890, category: 'Home', image: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=700&q=85' },
  { id: 3, name: 'Wireless Headphones', store: 'North Audio', price: 2190, category: 'Electronics', badge: 'Popular', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85' },
  { id: 4, name: 'Daily Skin Essentials', store: 'Kindred Care', price: 680, category: 'Beauty', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85' },
  { id: 5, name: 'Classic Everyday Sneaker', store: 'Form Footwear', price: 1590, category: 'Fashion', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&q=85' },
  { id: 6, name: 'Soft Lounge Chair', store: 'Sunday Studio', price: 4250, category: 'Home', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=700&q=85' },
  { id: 7, name: 'Compact Digital Camera', store: 'North Audio', price: 3890, category: 'Electronics', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&q=85' },
  { id: 8, name: 'Botanical Body Wash', store: 'Kindred Care', price: 420, category: 'Beauty', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&q=85' },
];

const categories = ['All', 'Fashion', 'Electronics', 'Home', 'Beauty'];
const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);

export default function App() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [mobileMenu, setMobileMenu] = useState(false);

  const visible = useMemo(() => products.filter((p) =>
    (category === 'All' || p.category === category) &&
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.store.toLowerCase().includes(query.toLowerCase()))
  ), [category, query]);

  const toggleFavorite = (id: number) => setFavorites((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old, id]);

  return (
    <div className="app-shell">
      <div className="announcement">A better way to discover independent businesses <span>Explore SELLSPACE <ArrowRight size={13} /></span></div>
      <header className="site-header">
        <a className="brand" href="#" aria-label="SELLSPACE home"><span className="brand-mark">S</span><span>SELLSPACE</span></a>
        <nav className={mobileMenu ? 'main-nav open' : 'main-nav'} aria-label="Main navigation">
          <a className="nav-active" href="#discover" onClick={() => setMobileMenu(false)}>Discover</a>
          <a href="#stores" onClick={() => setMobileMenu(false)}>Stores</a>
          <a href="#about" onClick={() => setMobileMenu(false)}>About</a>
        </nav>
        <div className="header-actions">
          <label className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or stores" /><kbd>⌘ K</kbd></label>
          <button className="icon-button" aria-label="Favorites" onClick={() => setCategory('All')}><Heart size={19} /></button>
          <button className="icon-button cart-button" aria-label={`Cart with ${cart.length} items`}><ShoppingBag size={19} />{cart.length > 0 && <span className="cart-count">{cart.length}</span>}</button>
          <button className="sign-in">Sign in</button>
        </div>
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X /> : <Menu />}</button>
      </header>

      <main id="discover">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> THE EVERYDAY MARKETPLACE</span>
            <h1>Good finds.<br /><em>Good businesses.</em></h1>
            <p>Discover products worth knowing and the independent businesses behind them.</p>
            <a className="hero-link" href="#products">Explore the marketplace <ArrowRight size={16} /></a>
          </div>
          <div className="hero-art" role="img" aria-label="Curated lifestyle products">
            <div className="hero-image hero-image-one" />
            <div className="hero-image hero-image-two" />
            <div className="hero-note"><Store size={17} /><span>Made for everyday discovery</span></div>
          </div>
        </section>

        <section className="category-strip" aria-label="Shop by category">
          {categories.map((item) => <button key={item} className={category === item ? 'category-chip selected' : 'category-chip'} onClick={() => setCategory(item)}>{item}</button>)}
          <button className="filter-button" onClick={() => { setCategory('All'); setQuery(''); }}><SlidersHorizontal size={15} /> Reset filters</button>
        </section>

        <section className="product-section" id="products">
          <div className="section-heading"><div><span className="eyebrow">CURATED FOR YOU</span><h2>Find your next favorite.</h2><p>Thoughtful picks from businesses on SELLSPACE.</p></div><a href="#products" className="view-all">View all <ArrowRight size={15} /></a></div>
          <div className="product-grid">
            {visible.map((product) => <article className="product-card" key={product.id}>
              <div className="product-image-wrap"><img src={product.image} alt={product.name} loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />{product.badge && <span className="product-badge">{product.badge}</span>}<button className={favorites.includes(product.id) ? 'favorite-button favorited' : 'favorite-button'} onClick={() => toggleFavorite(product.id)} aria-label="Toggle favorite"><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button></div>
              <div className="product-meta"><span>{product.store}</span><span>{product.category}</span></div>
              <h3>{product.name}</h3><div className="product-bottom"><strong>{money(product.price)}</strong><button onClick={() => setCart((old) => [...old, product.id])}>Add to bag <span>+</span></button></div>
            </article>)}
          </div>
          {visible.length === 0 && <div className="empty-state">No products match that search. Try another term or category.</div>}
        </section>
      </main>
      <footer className="site-footer" id="about"><a className="brand footer-brand" href="#"><span className="brand-mark">S</span><span>SELLSPACE</span></a><span>Discover more. Shop better.</span><span>© 2026 SELLSPACE</span></footer>
      <div className="mobile-bottom"><button className="bottom-active"><Store size={18} />Discover</button><button><Heart size={18} />Saved</button><button><ShoppingBag size={18} />Bag {cart.length ? `(${cart.length})` : ''}</button><button><UserRound size={18} />Account</button></div>
    </div>
  );
}
