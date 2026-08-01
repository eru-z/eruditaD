import { useEffect, useMemo, useState } from "react";

import { ArrowRight, Mail, Menu, Moon, Sparkles, Sun, X } from "lucide-react";

import { Link, useLocation } from "react-router-dom";

import "./navbar-pixel-perfect.css";



const navLinks = [

  { number: "01", label: "Home", href: "/#home" },

  { number: "02", label: "About", href: "/#about" },

  { number: "03", label: "Experience", href: "/#experience" },

  { number: "04", label: "Projects", href: "/#projects" },

  { number: "05", label: "Stack", href: "/#stack" },

  { number: "06", label: "Achievements", href: "/#achievements" },

  { number: "07", label: "Contact", href: "/#contact" },

];



export default function Navbar({

  name = "Erudita Zilbeari",

  title = "Full-Stack Developer",

  theme = "light",

  onToggleTheme,

}) {

  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => location.hash.slice(1) || "home");



  const activeHref = useMemo(() => {
    if (location.pathname.startsWith("/projects")) return "/#projects";
    if (location.pathname === "/") return `/#${activeSection || "home"}`;
    return "/#home";
  }, [location.pathname, activeSection]);

  useEffect(() => {
    if (location.pathname !== "/") return undefined;
    const sections = navLinks.map((link) => document.getElementById(link.href.split("#")[1])).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveSection(visible.target.id);
    }, { rootMargin: "-24% 0px -58% 0px", threshold: [0.08, 0.2, 0.45] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [location.pathname]);
  const closeMobileMenu = () => {

    setMobileMenuOpen(false);

  };



  const toggleMobileMenu = () => {

    setMobileMenuOpen((current) => !current);

  };



  useEffect(() => {

    closeMobileMenu();

  }, [location.pathname, location.hash]);



  useEffect(() => {

    const onResize = () => {

      if (window.innerWidth > 900) {

        closeMobileMenu();

      }

    };



    window.addEventListener("resize", onResize);



    return () => {

      window.removeEventListener("resize", onResize);

    };

  }, []);



  useEffect(() => {

    if (!mobileMenuOpen) {

      return undefined;

    }



    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";



    const onKeyDown = (event) => {

      if (event.key === "Escape") {

        closeMobileMenu();

      }

    };



    document.addEventListener("keydown", onKeyDown);



    return () => {

      document.body.style.overflow = previousOverflow;

      document.removeEventListener("keydown", onKeyDown);

    };

  }, [mobileMenuOpen]);



  return (

    <header

      className={`pp-navbar-wrap ${mobileMenuOpen ? "is-mobile-open" : ""}`}

    >

      <nav className="pp-navbar" aria-label="Primary">

        <span className="pp-navbar-shine" aria-hidden="true" />

        <span className="pp-navbar-glow" aria-hidden="true" />



        <Link

          to="/#home"

          className="pp-navbar-brand"

          onClick={closeMobileMenu}

        >

          <span className="pp-navbar-mark" aria-hidden="true">

            <img src="/images/ez-logo-navbar.png" alt="" width="78" height="40" decoding="async" />

          </span>



          <span className="pp-navbar-id">

            <strong>{name.toUpperCase()}</strong>

            <em>{title.toUpperCase()}</em>

          </span>

        </Link>



        <ul className="pp-navbar-links">

          {navLinks.map((link) => {

            const isActive = link.href === activeHref;



            return (

              <li key={link.href} className={isActive ? "is-active" : ""}>

                <Link to={link.href}>

                  <span className="pp-navbar-num">{link.number}</span>

                  <span className="pp-navbar-link-label">{link.label}</span>

                </Link>



                {isActive && (

                  <span className="pp-navbar-dot" aria-hidden="true" />

                )}

              </li>

            );

          })}

        </ul>



        <div className="pp-navbar-actions">

          <Link to="/#contact" className="pp-navbar-cta">

            <Sparkles className="pp-navbar-cta-spark" size={13} />

            <span>Start a Project</span>

            <ArrowRight size={14} />

            <Mail className="pp-navbar-cta-mobile-icon" size={21} aria-hidden="true" />

          </Link>



          <button
            type="button"
            className="pp-navbar-theme"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to galaxy dark mode"}
            aria-pressed={theme === "dark"}
            onClick={onToggleTheme}
          >

            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}

          </button>



          <button

            type="button"

            className="pp-navbar-menu-button"

            onClick={toggleMobileMenu}

            aria-label={

              mobileMenuOpen

                ? "Close navigation menu"

                : "Open navigation menu"

            }

            aria-expanded={mobileMenuOpen}

            aria-controls="pp-mobile-navigation"

          >

            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}

          </button>

        </div>

      </nav>



      <button

        type="button"

        className="pp-mobile-menu-backdrop"

        aria-label="Close navigation menu"

        tabIndex={mobileMenuOpen ? 0 : -1}

        onClick={closeMobileMenu}

      />



      <div

        id="pp-mobile-navigation"

        className="pp-mobile-menu"

        aria-hidden={!mobileMenuOpen}

      >

        <div className="pp-mobile-menu-header">

          <div>

            <span>Navigation</span>

            <strong>Explore the portfolio</strong>

          </div>



          <button

            type="button"

            onClick={closeMobileMenu}

            aria-label="Close navigation menu"

          >

            <X size={18} />

          </button>

        </div>



        <ul className="pp-mobile-menu-links">

          {navLinks.map((link) => {

            const isActive = link.href === activeHref;



            return (

              <li key={link.href} className={isActive ? "is-active" : ""}>

                <Link

                  to={link.href}

                  onClick={closeMobileMenu}

                  tabIndex={mobileMenuOpen ? 0 : -1}

                >

                  <span className="pp-mobile-menu-number">{link.number}</span>

                  <span>{link.label}</span>

                  <ArrowRight size={15} />

                </Link>

              </li>

            );

          })}

        </ul>



        <Link

          to="/#contact"

          className="pp-mobile-menu-cta"

          onClick={closeMobileMenu}

          tabIndex={mobileMenuOpen ? 0 : -1}

        >

          <Sparkles size={15} />

          Start a Project

          <ArrowRight size={16} />

        </Link>

      </div>

    </header>

  );

}
