import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Moon, Bell, User as UserIcon, Sun, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface DashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const navigationItems = [
  { label: 'Dashboard' },
  { label: 'Devices' },
  { label: 'Alarms' },
];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
  toggleSidebar,
  isSidebarOpen,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const desktopNavRef = useRef<HTMLElement | null>(null);
  const mobileNavRef = useRef<HTMLElement | null>(null);

  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [mobileSliderStyle, setMobileSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  /**
   * Measure slider left/width.
   * - If the container's first child looks like the **slider** (absolute / aria-hidden etc), ignore it.
   * - Otherwise prefer measuring relative to an inner wrapper (mobile), or to the container itself (desktop).
   */
  const measureSlider = (container: HTMLElement | null) => {
    if (!container) return { left: 0, width: 0 };

    // Candidate first child (could be the slider DIV in desktop).
    const firstChild = container.querySelector<HTMLElement>(':scope > div') as HTMLElement | null;

    // Decide whether to use the first child as the "base" (mobile inner wrapper)
    let useInner = false;
    if (firstChild) {
      try {
        const cs = window.getComputedStyle(firstChild);
        // If firstChild is positioned absolute OR explicitly marked aria-hidden/pointer-events-none, it's likely the slider element -> don't use it.
        if (cs.position !== 'absolute' && firstChild.getAttribute('aria-hidden') !== 'true' && !firstChild.classList.contains('pointer-events-none')) {
          useInner = true;
        }
      } catch (e) {
        // In very old browsers getComputedStyle might fail — fall back to not using inner.
        useInner = false;
      }
    }

    const baseRect = useInner && firstChild ? firstChild.getBoundingClientRect() : container.getBoundingClientRect();

    // Find the active button (prefer data-active inside inner if we use inner)
    const activeBtn =
      (useInner && firstChild && firstChild.querySelector<HTMLButtonElement>('button[data-active="true"]')) ||
      container.querySelector<HTMLButtonElement>('button[data-active="true"]') ||
      (useInner && firstChild && firstChild.querySelector<HTMLButtonElement>('button')) ||
      container.querySelector<HTMLButtonElement>('button');

    if (!activeBtn) return { left: 0, width: 0 };

    const rect = activeBtn.getBoundingClientRect();

    // Padding / breathing room for the pill
    const horizontalPadding = useInner ? 8 : 6;
    // sensible minimum width so a short label still produces a visible pill
    const minWidth = useInner ? 56 : 40;

    const left = Math.max(4, rect.left - baseRect.left + (useInner ? horizontalPadding : 4));
    const width = Math.max(minWidth, rect.width - (useInner ? horizontalPadding * 2 : 8));

    return { left, width };
  };

  const updateSliders = () => {
    const desktopContainer = desktopNavRef.current;
    if (desktopContainer) {
      const measured = measureSlider(desktopContainer);
      setSliderStyle(measured);
      requestAnimationFrame(() => {
        const measured2 = measureSlider(desktopContainer);
        setSliderStyle(measured2);
      });
    }

    const mobileContainer = mobileNavRef.current;
    if (mobileContainer) {
      const measuredM = measureSlider(mobileContainer);
      setMobileSliderStyle(measuredM);
      requestAnimationFrame(() => {
        const measuredM2 = measureSlider(mobileContainer);
        setMobileSliderStyle(measuredM2);
      });
    }
  };

  useLayoutEffect(() => {
    updateSliders();
    const t = setTimeout(updateSliders, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, theme]);

  useEffect(() => {
    updateSliders();
    const onResize = () => updateSliders();
    window.addEventListener('resize', onResize);

    let desktopObserver: ResizeObserver | null = null;
    let mobileObserver: ResizeObserver | null = null;

    try {
      if (desktopNavRef.current) {
        desktopObserver = new ResizeObserver(() => updateSliders());
        desktopObserver.observe(desktopNavRef.current);
      }
      if (mobileNavRef.current) {
        mobileObserver = new ResizeObserver(() => updateSliders());
        mobileObserver.observe(mobileNavRef.current);
      }
    } catch (e) {
      // ignore if ResizeObserver unsupported
    }

    return () => {
      window.removeEventListener('resize', onResize);
      desktopObserver?.disconnect();
      mobileObserver?.disconnect();
    };
  }, []);

  const logoSrcDark = '/logolight.png';
  const logoSrcLight = '/logodark.png';

  return (
    <header
      className={`w-full flex-shrink-0 border-b ${
        theme === 'dark' ? 'bg-[#121429] border-none' : 'bg-white border-[#ececec]'
      }`}
    >
      {/* Top Row */}
      <div className="h-14 md:h-16 lg:h-20 px-3 md:px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6 xl:gap-8 min-w-0">
          <button
            onClick={toggleSidebar}
            className={`md:hidden flex items-center justify-center transition-colors shrink-0 ${
              theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-[#555758] hover:text-gray-900'
            }`}
            aria-label="Toggle menu"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div
            className={`hidden md:flex items-center rounded-2xl p-1.5 shrink-0 ${theme === 'dark' ? 'bg-[#101428]/60' : 'bg-white shadow-sm border border-[#ececec]'}`}
            style={{ paddingLeft: 8, paddingRight: 12 }}
          >
            <img
              src={theme === 'dark' ? logoSrcDark : logoSrcLight}
              alt="Saher Logo"
              className="h-6 md:h-7 lg:h-8 w-auto transition-all duration-300"
            />
          </div>

          {/* Desktop Navigation */}
          <nav
            ref={desktopNavRef as any}
            className={`hidden lg:flex relative items-center rounded-full h-9 md:h-10 lg:h-11 p-0.5 overflow-hidden lg:ml-4 xl:ml-10 shrink-0 ${
              theme === 'dark' ? 'bg-[#162345]' : 'bg-white shadow-sm border border-[#ececec]'
            }`}
            aria-label="Primary navigation"
          >
            {/* desktop slider (absolute) */}
            <div
              aria-hidden
              className={`absolute rounded-full transition-all duration-250 ease-in-out pointer-events-none ${
                theme === 'dark' ? 'bg-[#6656F5]' : 'bg-[#F97316]'
              }`}
              style={{
                left: sliderStyle.left,
                width: sliderStyle.width,
                top: '50%',
                transform: 'translateY(-50%)',
                height: 'calc(100% - 8px)',
              }}
            />

            {navigationItems.map((item) => {
              const isActive = activeTab === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  data-active={isActive ? 'true' : 'false'}
                  className={`relative z-10 h-7 md:h-8 lg:h-9 px-3 md:px-4 lg:px-6 flex items-center justify-center rounded-full text-xs md:text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : theme === 'dark'
                      ? 'text-gray-400 hover:text-gray-200'
                      : 'text-[#555758] hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className={`h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full flex items-center justify-center transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#2b3168] bg-[#1D2147] text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 bg-[#EAEAEA] text-[#555758] hover:text-gray-900'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
          </button>

          <button
            className={`h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full flex items-center justify-center relative transition-colors ${
              theme === 'dark'
                ? 'hover:bg-[#2b3168] bg-[#1D2147] text-gray-400 hover:text-gray-200'
                : 'hover:bg-gray-100 bg-[#EAEAEA] text-[#555758] hover:text-gray-900'
            }`}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <div
              className={`absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 h-2 w-2 md:h-2.5 md:w-2.5 lg:h-3 lg:w-3 rounded-full ${
                theme === 'dark' ? 'bg-[#6656F5]' : 'bg-[#F56C44]'
              }`}
            />
          </button>

          <div className={`h-8 w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#2b3168]' : 'bg-gray-200'}`}>
            <UserIcon className={`h-4 w-4 md:h-5 md:w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-[#555758]'}`} />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <nav
        ref={mobileNavRef as any}
        className={`lg:hidden w-full px-3 md:px-4 pb-2 md:pb-3 pt-1 flex justify-center ${theme === 'dark' ? 'bg-[#121429]' : 'bg-white'}`}
        aria-label="Primary navigation"
      >
        <div
          className={`relative inline-flex items-center rounded-full h-9 md:h-10 lg:h-11 p-0.5 md:p-1 w-full max-w-md ${
            theme === 'dark' ? 'bg-[#162345]' : 'bg-gray-100'
          }`}
        >
          <div
            aria-hidden
            className={`absolute rounded-full transition-all duration-300 ease-in-out pointer-events-none ${
              theme === 'dark' ? 'bg-[#6656F5]' : 'bg-[#F97316]'
            }`}
            style={{
              left: mobileSliderStyle.left,
              width: mobileSliderStyle.width,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 'calc(100% - 8px)',
            }}
          />

          {navigationItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                data-active={isActive ? 'true' : 'false'}
                className={`relative z-10 h-8 md:h-9 flex-1 px-2 md:px-3 flex items-center justify-center rounded-full text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                  isActive ? 'text-white font-semibold' : theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default DashboardHeader;
