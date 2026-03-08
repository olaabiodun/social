import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/landing.css";

const LandingPage = () => {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {if (e.isIntersecting) e.target.classList.add("visible");}),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Navbar scroll
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Custom cursor
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0,my = 0,rx = 0,ry = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;my = e.clientY;
      cursor.style.left = mx - 6 + "px";
      cursor.style.top = my - 6 + "px";
    };
    document.addEventListener("mousemove", onMove);

    let animId: number;
    const anim = () => {
      rx += (mx - rx - 18) * 0.12;
      ry += (my - ry - 18) * 0.12;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      animId = requestAnimationFrame(anim);
    };
    animId = requestAnimationFrame(anim);

    const hoverEls = document.querySelectorAll("a,button,.feature-card,.why-card,.testimonial-card,.stat-card,.metric,.why-mini,.orbit-icon,.platform-badge,.social-btn,.faq-q");
    const enter = () => {cursor.classList.add("hover");ring.classList.add("hover");};
    const leave = () => {cursor.classList.remove("hover");ring.classList.remove("hover");};
    hoverEls.forEach((el) => {el.addEventListener("mouseenter", enter);el.addEventListener("mouseleave", leave);});

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
      hoverEls.forEach((el) => {el.removeEventListener("mouseenter", enter);el.removeEventListener("mouseleave", leave);});
    };
  }, []);

  // Close mobile nav on resize
  useEffect(() => {
    const handler = () => {if (window.innerWidth > 860 && mobileNavOpen) setMobileNavOpen(false);};
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [mobileNavOpen]);

  const closeNav = useCallback(() => setMobileNavOpen(false), []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? -1 : idx);
  };

  const faqItems = [
  { q: "Are these accounts legitimate and safe to use?", a: "Absolutely. Every account in our inventory undergoes a rigorous vetting process to ensure authenticity. All accounts have real followers, genuine engagement history, and are completely safe to use on their respective platforms." },
  { q: "How long does the account transfer take?", a: "Most transfers happen instantly — within minutes of purchase confirmation. You'll receive all account credentials via secure email delivery. Our automated system ensures you get access as quickly as possible." },
  { q: "What if I'm not satisfied with my purchase?", a: "We offer a full replacement or refund within 48 hours of purchase — no questions asked. Customer satisfaction is our top priority, and we stand behind the quality of every account we sell." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and most major cryptocurrencies including Bitcoin and Ethereum. All transactions are processed through our bank-level encrypted payment system." },
  { q: "Can I verify account stats before buying?", a: "Yes! Each listing contains detailed analytics including follower count, engagement rate, account age, post history, and any verification badges. What you see is exactly what you get — we believe in complete transparency." }];


  const tickerItems = ["INSTANT DELIVERY", "VERIFIED ACCOUNTS", "REAL FOLLOWERS", "SECURE PAYMENT", "24/7 SUPPORT", "MONEY BACK GUARANTEE", "BANK-LEVEL ENCRYPTION"];

  return (
    <div className="landing-page" style={{ background: "var(--gl-white)", color: "var(--ink)", fontFamily: "var(--font-body)", overflowX: "hidden" }}>
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* NAV */}
      <nav className={`landing-nav${navScrolled ? " scrolled" : ""}`}>
        <Link to="/" className="nav-logo">Goodluck <span>Store</span></Link>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How It Works</a></li>
          <li><a href="#testimonials">Reviews</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <Link to="/auth" className="nav-cta nav-cta-desktop text-primary-foreground">Login →</Link>
        <button className={`nav-hamburger${mobileNavOpen ? " open" : ""}`} onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div className={`nav-drawer${mobileNavOpen ? " open" : ""}`} style={{ display: mobileNavOpen ? "flex" : "none" }}>
        <a href="#about" onClick={closeNav}>About</a>
        <a href="#features" onClick={closeNav}>Features</a>
        <a href="#how" onClick={closeNav}>How It Works</a>
        <a href="#testimonials" onClick={closeNav}>Reviews</a>
        <a href="#faq" onClick={closeNav}>FAQ</a>
        <Link to="/auth" className="drawer-cta" onClick={closeNav}>Shop Accounts →</Link>
      </div>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-glow-2" />
        <div className="hero-floats">
          <div className="float-icon icon-1"><i className="fa-brands fa-instagram" /></div>
          <div className="float-icon icon-2"><i className="fa-brands fa-tiktok" /></div>
          <div className="float-icon icon-3"><i className="fa-brands fa-youtube" /></div>
          <div className="float-icon icon-4"><i className="fa-brands fa-x-twitter" /></div>
          <div className="float-icon icon-5"><i className="fa-brands fa-facebook" /></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge"><span />{" "}Premium Social Accounts</div>
          <h1><span>Premium</span> <span className="blue">Social Media</span> Accounts<br />Ready to Use</h1>
          <p>Instant access to verified Instagram, Twitter, TikTok, YouTube & more. Established accounts with real followers. Secure delivery guaranteed.</p>
          <div className="hero-btns">
            <button className="btn-primary text-primary-foreground"><span>Shop Accounts Now →</span></button>
            <button className="btn-ghost">Learn More</button>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card"><div className="stat-num">10K+</div><div className="stat-label">Accounts</div></div>
          <div className="stat-card"><div className="stat-num">50K+</div><div className="stat-label">Verified</div></div>
          <div className="stat-card"><div className="stat-num">98%</div><div className="stat-label">Satisfied</div></div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker" role="marquee">
        <div className="ticker-inner">
          {[...tickerItems, ...tickerItems].map((item, i) =>
          <div className="ticker-item text-primary-foreground" key={i}><div className="ticker-dot" />{item}</div>
          )}
        </div>
      </div>

      {/* ABOUT */}
      <section className="about landing-section" id="about">
        <div className="about-content reveal">
          <div className="section-tag text-primary-foreground">Who We Are</div>
          <h2 className="section-title">The Premier<br /><span style={{ color: "var(--blue)" }}>Social Media</span><br />Marketplace</h2>
          <p className="section-sub"><p className="section-sub">Goodluck Store is a premier provider of established social media accounts across all major platforms. We specialize in delivering authentic, ready-to-use accounts with real followers, genuine engagement, and verified status options.</p> of established social media accounts across all major platforms. We specialize in delivering authentic, ready-to-use accounts with real followers, genuine engagement, and verified status options.</p>
          <div className="platforms-showcase">
            {[
            { icon: "fa-brands fa-instagram", name: "Instagram" },
            { icon: "fa-brands fa-x-twitter", name: "Twitter/X" },
            { icon: "fa-brands fa-tiktok", name: "TikTok" },
            { icon: "fa-brands fa-youtube", name: "YouTube" },
            { icon: "fa-brands fa-facebook", name: "Facebook" },
            { icon: "fa-brands fa-linkedin", name: "LinkedIn" },
            { icon: "fa-brands fa-snapchat", name: "Snapchat" }].
            map((p) =>
            <div className="platform-badge" key={p.name}><i className={p.icon} /> {p.name}</div>
            )}
          </div>
          <div className="about-metrics">
            <div className="metric"><div className="metric-val">10K+</div><div className="metric-label">Accounts Sold</div></div>
            <div className="metric"><div className="metric-val">5★</div><div className="metric-label">Customer Rating</div></div>
            <div className="metric"><div className="metric-val">24/7</div><div className="metric-label">Live Support</div></div>
            <div className="metric"><div className="metric-val">98%</div><div className="metric-label">Satisfaction Rate</div></div>
          </div>
        </div>
        <div className="about-visual reveal reveal-delay-2">
          <div className="orbit-container">
            <div className="orbit-ring ring1" style={{ width: 188, height: 188, animation: "spin 12s linear infinite" }}>
              <div className="orbit-icon"><i className="fa-brands fa-instagram" /></div>
              <div className="orbit-icon"><i className="fa-brands fa-x-twitter" /></div>
            </div>
            <div className="orbit-ring ring2" style={{ width: 300, height: 300, animation: "spin 20s linear infinite reverse" }}>
              <div className="orbit-icon"><i className="fa-brands fa-tiktok" /></div>
              <div className="orbit-icon"><i className="fa-brands fa-youtube" /></div>
              <div className="orbit-icon"><i className="fa-brands fa-facebook" /></div>
            </div>
            <div className="orbit-ring ring3" style={{ width: 420, height: 420, animation: "spin 30s linear infinite" }}>
              <div className="orbit-icon"><i className="fa-brands fa-linkedin" /></div>
              <div className="orbit-icon"><i className="fa-brands fa-instagram" /></div>
              <div className="orbit-icon"><i className="fa-brands fa-comments" /></div>
            </div>
            <div className="orbit-center text-primary-foreground">ALL<br />PLATFORMS</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features landing-section" id="features">
        <div className="features-header reveal">
          <div className="section-tag">Our Key Features</div>
          <h2 className="section-title">Everything You Need for a<br />Seamless <span style={{ color: "var(--blue)" }}>Experience</span></h2>
          <p className="section-sub">Our platform is built around delivering maximum value, security, and speed for every purchase.</p>
        </div>
        <div className="features-grid">
          {[
          { num: "01", icon: "fa-solid fa-shield-halved", title: "Verified Accounts", desc: "All accounts are authentic with real followers and genuine engagement history. Every single one vetted by our team." },
          { num: "02", icon: "fa-solid fa-bolt", title: "Instant Delivery", desc: "Get immediate access to your purchased account credentials via secure email delivery within minutes." },
          { num: "03", icon: "fa-solid fa-lock", title: "Secure Transactions", desc: "Bank-level encryption and secure payment processing for complete peace of mind on every order." },
          { num: "04", icon: "fa-solid fa-headset", title: "24/7 Support", desc: "Round-the-clock customer support team ready to assist with any questions or issues you might have." }].
          map((f, i) =>
          <div className={`feature-card reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} key={f.num}>
              <div className="feature-num">{f.num}</div>
              <div className="feature-icon"><i className={f.icon} /></div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how landing-section" id="how">
        <div className="how-header reveal">
          <div className="section-tag">Simple Process</div>
          <h2 className="section-title">How It <span style={{ color: "var(--blue)" }}>Works</span></h2>
          <p className="section-sub">Get your premium social media account in just three simple steps.</p>
        </div>
        <div className="steps">
          {[
          { num: 1, icon: "fa-solid fa-search", title: "Browse & Select", desc: "Choose your preferred platform and browse our inventory of available accounts with detailed analytics and follower breakdowns." },
          { num: 2, icon: "fa-solid fa-shopping-cart", title: "Secure Checkout", desc: "Complete your purchase through our encrypted payment system. Multiple payment methods accepted including crypto." },
          { num: 3, icon: "fa-solid fa-envelope", title: "Instant Access", desc: "Receive account credentials instantly via email. Login and start using your new account immediately — no waiting." }].
          map((s, i) =>
          <div className={`step reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} key={s.num}>
              <div className="step-num text-primary-foreground">{s.num}</div>
              <div className="step-icon"><i className={s.icon} /></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          )}
        </div>
        <div className="how-cta reveal text-primary-foreground"><button className="btn-primary"><span>Get Started Now →</span></button></div>
      </section>

      {/* WHY */}
      <section className="why landing-section" id="why">
        <div className="why-header reveal">
          <div className="section-tag">Our Advantages</div>
          <h2 className="section-title">Why Choose <span style={{ color: "var(--blue)" }}>Goodluck Store?</span></h2>
        </div>
        <div className="why-main">
          {[
          { icon: "fa-solid fa-trophy", title: "Premium Quality", desc: "Hand-picked accounts with genuine followers, strong engagement history, and clean reputation. Nothing but the best." },
          { icon: "fa-solid fa-dollar-sign", title: "Best Prices", desc: "Competitive pricing with transparent costs. No hidden fees, no surprises. Regular discounts and bundle offers available." },
          { icon: "fa-solid fa-arrows-rotate", title: "Satisfaction Guarantee", desc: "Not satisfied? We offer replacement or full refund within 48 hours of purchase — no questions asked." }].
          map((w, i) =>
          <div className={`why-card reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} key={w.title}>
              <div className="why-icon-circle"><i className={w.icon} /></div>
              <h3>{w.title}</h3>
              <p>{w.desc}</p>
            </div>
          )}
        </div>
        <div className="why-row">
          {[
          { icon: "fa-solid fa-mobile-screen", title: "Wide Selection", desc: "All major platforms covered" },
          { icon: "fa-solid fa-shield", title: "Privacy Protected", desc: "Your data always stays safe" },
          { icon: "fa-solid fa-thumbs-up", title: "Trusted by Thousands", desc: "Proven track record since 2020" }].
          map((w, i) =>
          <div className={`why-mini reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} key={w.title}>
              <div className="why-mini-icon"><i className={w.icon} /></div>
              <div><h4>{w.title}</h4><p>{w.desc}</p></div>
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials landing-section" id="testimonials">
        <div className="testimonials-header reveal">
          <div className="section-tag">Customer Success Stories</div>
          <h2 className="section-title">What Our <span style={{ color: "var(--blue)" }}>Customers</span> Say</h2>
          <p className="section-sub">Join thousands of satisfied customers who <p className="section-sub">Join thousands of satisfied customers who trusted Goodluck Store to grow their social presence.</p> their social presence.</p>
        </div>
        <div className="testimonials-grid">
          {[
          { initials: "SJ", name: "Sarah Johnson", role: "Content Creator", text: '"Purchased an Instagram account with 100K followers. The account was exactly as described, verified, and the transfer was seamless. Best investment I\'ve made for my business!"', platform: "Instagram", platformIcon: "fa-brands fa-instagram", stat: "100K Followers" },
          { initials: "MC", name: "Michael Chen", role: "Digital Marketer", text: '"Goodluck Store made it incredibly easy to jumpstart my social media presence. The account had real engagement and authentic followers. Customer support was absolutely amazing!"', platform: "TikTok", platformIcon: "fa-brands fa-tiktok", stat: "250K Followers" },
          { initials: "ER", name: "Emily Rodriguez", role: "Business Owner", text: '"I was skeptical at first, but Goodluck Store exceeded all expectations. Instant delivery, secure payment, and the account metrics were 100% accurate. Highly recommend!"', platform: "YouTube", platformIcon: "fa-brands fa-youtube", stat: "180K Subscribers" },
          { initials: "DK", name: "David Kim", role: "Influencer", text: '"The quality of accounts here is unmatched. Real followers, great engagement rates, and the verification badge was fully intact. Worth every single penny spent!"', platform: "Twitter/X", platformIcon: "fa-brands fa-x-twitter", stat: "75K Followers" }].
          map((t, i) =>
          <div className={`testimonial-card reveal${i > 0 ? ` reveal-delay-${i}` : ""}`} key={t.name}>
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initials}</div>
                <div><div className="author-name">{t.name}</div><div className="author-role">{t.role}</div></div>
              </div>
              <div className="author-platform">
                <span className="platform-name"><i className={t.platformIcon} /> {t.platform}</span>
                <span className="platform-stat">{t.stat}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar reveal">
        <div className="text-primary-foreground"><div className="trust-num">10,000+</div><div className="trust-label">Happy Customers</div></div>
        <div className="text-primary-foreground"><div className="trust-num">4.9/5</div><div className="trust-label">Average Rating</div></div>
        <div className="text-primary-foreground"><div className="trust-num">98%</div><div className="trust-label">Satisfaction Rate</div></div>
      </div>

      {/* FAQ */}
      <section className="faq landing-section" id="faq">
        <div className="faq-inner">
          <div className="reveal">
            <div className="section-tag">Got Questions?</div>
            <h2 className="section-title">Frequently<br />Asked<br /><span style={{ color: "var(--blue)" }}>Questions</span></h2>
            <p className="section-sub">Everything you need to know about <p className="section-sub">Everything you need to know about buying social media accounts from Goodluck Store.</p></p>
          </div>
          <div className="faq-list reveal reveal-delay-1">
            {faqItems.map((faq, i) =>
            <div className={`faq-item${openFaq === i ? " open" : ""}`} key={i}>
                <button className="faq-q" onClick={() => toggleFaq(i)}>
                  {faq.q}
                  <div className="faq-icon">+</div>
                </button>
                <div className="faq-a">{faq.a}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <h2>READY TO <em>BOOST</em><br />YOUR PRESENCE?</h2>
        <p>Join thousands of satisfied customers. Shop premium social media accounts now and start growing today.</p>
        <div className="cta-btns">
          <button className="btn-dark text-primary-foreground">Shop Accounts →</button>
          <button className="btn-outline-dark">Contact Us</button>
        </div>
        <div className="cta-trust">
          <span><i className="fa-solid fa-lock" /> Secure Payment</span>
          <span><i className="fa-solid fa-bolt" /> Instant Delivery</span>
          <span><i className="fa-solid fa-arrows-rotate" /> Money Back</span>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div>
            <div className="footer-logo">Goodluck <span>Store</span></div>
            <p className="footer-desc">Premium social media accounts with real followers and verified status. Your trusted partner for social growth.</p>
            <div className="footer-socials">
              <div className="social-btn"><i className="fa-brands fa-instagram" /></div>
              <div className="social-btn"><i className="fa-brands fa-x-twitter" /></div>
              <div className="social-btn"><i className="fa-brands fa-tiktok" /></div>
              <div className="social-btn"><i className="fa-solid fa-comments" /></div>
            </div>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#">Home</a></li><li><a href="#">Shop</a></li><li><a href="#">About</a></li><li><a href="#">FAQ</a></li><li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Platforms</h4>
            <ul className="footer-links">
              <li><a href="#">Instagram</a></li><li><a href="#">Twitter</a></li><li><a href="#">TikTok</a></li><li><a href="#">YouTube</a></li><li><a href="#">Facebook</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul className="footer-links">
              <li><a href="#">support@goodluck.com</a></li><li><a href="#">24/7 Support</a></li><li><a href="#">Live Chat</a></li><li><a href="#">Help Center</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 Goodluck StoreAccounts. All rights reserved.</div>
          <div className="footer-legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Refund Policy</a></div>
        </div>
      </footer>
    </div>);

};

export default LandingPage;