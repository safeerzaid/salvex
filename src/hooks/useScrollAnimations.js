import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * useScrollAnimations
 * Smooth, natural GSAP ScrollTrigger enhancements for Salvex Auction.
 *
 * Principles:
 * - Natural unpinned browser scrolling
 * - Subtle hero parallax depth (background yPercent: -8, content yPercent: -3)
 * - Grouped subtle reveals for section headings, vehicle cards, auction cards, steps, and CTAs
 * - Responsive via gsap.matchMedia()
 * - Respects prefers-reduced-motion
 * - Strict transform & opacity only
 */
export function useScrollAnimations(pathname) {
  useEffect(() => {
    // 01. Accessibility Check: Disable animations if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const mm = gsap.matchMedia();

    // 02. DESKTOP & TABLET LANDSCAPE (> 768px)
    mm.add('(min-width: 769px)', () => {
      // A. HERO SECTION: Subtle natural parallax (NO PINNING)
      const hero = document.querySelector('.salvex-hero-section');
      if (hero) {
        const bgImg = hero.querySelector('.hero-bg-image');
        const heroContent = hero.querySelector('.hero-content-wrapper');

        // Background moves slightly slower than content for depth
        if (bgImg) {
          gsap.to(bgImg, {
            yPercent: -8,
            scale: 0.98,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        }

        // Hero content moves naturally upward with subtle opacity drop as it leaves
        if (heroContent) {
          gsap.to(heroContent, {
            yPercent: -3,
            opacity: 0.88,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        }
      }

      // B. SECTION HEADINGS: Subtle upward fade reveal
      const sectionHeadings = gsap.utils.toArray(
        '.section-header-centered, .about-eyebrow-tag, .about-heading'
      );
      sectionHeadings.forEach((heading) => {
        gsap.from(heading, {
          opacity: 0,
          y: 24,
          duration: 0.65,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 88%',
            once: true
          }
        });
      });

      // C. CARD GROUPS: Staggered reveal for vehicle & auction cards
      const cardGroups = [
        {
          trigger: '.salvex-live-section',
          items: '.salvex-live-section .live-slider-card'
        },
        {
          trigger: '.salvex-upcoming-section',
          items: '.salvex-upcoming-section .upcoming-ref-card'
        },
        {
          trigger: '.salvex-recent-section',
          items: '.salvex-recent-section .salvex-vehicle-card'
        },
        {
          trigger: '.salvex-how-section',
          items: '.salvex-how-section .step-process-card'
        },
        {
          trigger: '.salvex-trust-section',
          items: '.salvex-trust-section .why-feature-card'
        },
        {
          trigger: '.steps-journey-container',
          items: '.step-journey-card'
        },
        {
          trigger: '.trust-grid',
          items: '.trust-col'
        },
        {
          trigger: '.vehicles-results-grid',
          items: '.vehicle-card-wrapper, .vehicles-results-grid .salvex-vehicle-card'
        }
      ];

      cardGroups.forEach(({ trigger, items }) => {
        const triggerEl = document.querySelector(trigger);
        if (triggerEl) {
          const elements = triggerEl.querySelectorAll(items);
          if (elements.length > 0) {
            gsap.from(elements, {
              opacity: 0,
              y: 28,
              scale: 0.98,
              duration: 0.65,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: triggerEl,
                start: 'top 85%',
                once: true
              }
            });
          }
        }
      });

      // D. ABOUT SECTION: Refined dual-column entrance
      const aboutSection = document.querySelector('.salvex-about-section');
      if (aboutSection) {
        const aboutImg = aboutSection.querySelector('.about-image-wrapper');
        const aboutContent = aboutSection.querySelector('.about-paragraphs, .about-sources-card');

        if (aboutImg) {
          gsap.from(aboutImg, {
            opacity: 0,
            y: 28,
            scale: 0.98,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: aboutSection,
              start: 'top 85%',
              once: true
            }
          });
        }

        if (aboutContent) {
          gsap.from(aboutContent, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: aboutSection,
              start: 'top 85%',
              once: true
            }
          });
        }
      }

      // E. FINAL CTA SECTION: Smooth elevated card reveal
      const finalCta = document.querySelector('.salvex-final-cta-section');
      if (finalCta) {
        const ctaCard = finalCta.querySelector('.final-cta-card');
        if (ctaCard) {
          gsap.from(ctaCard, {
            opacity: 0,
            y: 28,
            scale: 0.98,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: finalCta,
              start: 'top 85%',
              once: true
            }
          });
        }
      }
    });

    // 03. MOBILE (<= 768px): Light, fluid reveals without heavy transforms
    mm.add('(max-width: 768px)', () => {
      const mobileHeadings = gsap.utils.toArray('.section-title, .about-heading');
      mobileHeadings.forEach((heading) => {
        gsap.from(heading, {
          opacity: 0,
          y: 16,
          duration: 0.45,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 92%',
            once: true
          }
        });
      });
    });

    // 04. Refresh ScrollTrigger after DOM has settled
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);

    // 05. Clean up on route change / unmount
    return () => {
      clearTimeout(refreshTimer);
      mm.revert();
    };
  }, [pathname]);
}
