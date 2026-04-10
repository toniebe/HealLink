import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { TourStep, useSpotlightTour } from 'react-native-spotlight-tour';
import TourTooltip from '../components/tour/TourTooltip';
import { authStore } from '../store/authStore';

// ── AttachStep index map (static, never changes) ──────────────────────────────
// 0 → Menu button   — Screening tour step 1
// 1 → Overview      — Screening tour step 2
// 2 → Sleep card    — Daily tour step 1
// 3 → Menu button   — Daily tour step 2 (same element as 0 via multi-index [0,3])
// 4 → FloatingButton — Wimbi tour step 1

// ── Context ───────────────────────────────────────────────────────────────────
interface TourContextValue {
  startScreeningTour: () => void;
  startDailyTour: () => void;
  startWimbiTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  startScreeningTour: () => {},
  startDailyTour: () => {},
  startWimbiTour: () => {},
});

export const useTour = () => useContext(TourContext);

// ── Provider ──────────────────────────────────────────────────────────────────
interface TourProviderProps {
  children: React.ReactNode;
  setSteps: (steps: TourStep[]) => void;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children, setSteps }) => {
  const { start, goTo } = useSpotlightTour();

  // Keep mutable refs so closures inside steps always call the latest version
  // without those functions being dependencies that trigger re-renders
  const startRef = useRef(start);
  const goToRef = useRef(goTo);
  const setStepsRef = useRef(setSteps);
  startRef.current = start;
  goToRef.current = goTo;
  setStepsRef.current = setSteps;

  // Build and register steps ONCE on mount.
  // Closures reference the refs above so they always have fresh start/goTo.
  useEffect(() => {
    const afterScreening = () => {
      const today = new Date().toISOString().split('T')[0];
      authStore.completeTour('tour_screening_completed');
      if (authStore.getDailyTourDate() !== today) {
        setTimeout(() => { startRef.current(); goToRef.current(2); }, 600);
      } else if (!authStore.hasTourCompleted('tour_wimbi_completed')) {
        setTimeout(() => { startRef.current(); goToRef.current(4); }, 600);
      }
    };

    const afterDaily = () => {
      const today = new Date().toISOString().split('T')[0];
      authStore.setDailyTourDate(today);
      if (!authStore.hasTourCompleted('tour_wimbi_completed')) {
        setTimeout(() => { startRef.current(); goToRef.current(4); }, 600);
      }
    };

    const afterWimbi = () => {
      authStore.completeTour('tour_wimbi_completed');
    };

    setStepsRef.current([
      // ── 0: Screening → Menu button ─────────────────────────────────────
      {
        shape: { type: 'rectangle', padding: 10 },
        motion: 'slide',
        render({ next, stop }) {
          return (
            <TourTooltip
              title="Health Screening"
              description="Tap the menu icon to open navigation. Go to 'Screening Manual' to complete your initial health assessment."
              step={1}
              total={2}
              isLast={false}
              onNext={next}
              onSkip={stop}
            />
          );
        },
      },
      // ── 1: Screening → Overview section ────────────────────────────────
      {
        shape: { type: 'rectangle', padding: 8 },
        motion: 'slide',
        render({ stop }) {
          return (
            <TourTooltip
              title="Your Health Dashboard"
              description="Once you complete your screening, your BMI, blood pressure, and mental health scores will appear here."
              step={2}
              total={2}
              isLast={true}
              onNext={() => { stop(); afterScreening(); }}
              onSkip={() => { stop(); afterScreening(); }}
            />
          );
        },
      },
      // ── 2: Daily → Sleep card ───────────────────────────────────────────
      {
        shape: { type: 'rectangle', padding: 8 },
        motion: 'slide',
        render({ next, stop }) {
          return (
            <TourTooltip
              title="Sleep Tracking"
              description="Track your sleep quality daily. Color-coded bars show poor (red), fair (orange), and good (green/blue) nights for the last 7 days."
              step={1}
              total={2}
              isLast={false}
              onNext={next}
              onSkip={stop}
            />
          );
        },
      },
      // ── 3: Daily → Menu button ──────────────────────────────────────────
      {
        shape: { type: 'rectangle', padding: 10 },
        motion: 'slide',
        render({ stop }) {
          return (
            <TourTooltip
              title="Mood Journal"
              description="Open the menu and tap 'Mood Journal' to log your emotions every day. Regular journaling helps track your mental wellbeing over time."
              step={2}
              total={2}
              isLast={true}
              onNext={() => { stop(); afterDaily(); }}
              onSkip={() => { stop(); afterDaily(); }}
            />
          );
        },
      },
      // ── 4: Wimbi → FloatingButton ───────────────────────────────────────
      {
        shape: { type: 'circle', padding: 16 },
        motion: 'bounce',
        render({ stop }) {
          return (
            <TourTooltip
              title="Meet Wimbi!"
              description="Wimbi is your AI well-being companion. Tap this button anytime to chat, share how you're feeling, and get personalized mental health support."
              step={1}
              total={1}
              isLast={true}
              onNext={() => { stop(); afterWimbi(); }}
              onSkip={() => { stop(); afterWimbi(); }}
            />
          );
        },
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — refs keep closures fresh without re-running

  // ── Stable tour starters (refs, never cause re-renders) ──────────────────
  const startScreeningTour = useCallback(() => {
    startRef.current();
  }, []);

  const startDailyTour = useCallback(() => {
    startRef.current();
    goToRef.current(2);
  }, []);

  const startWimbiTour = useCallback(() => {
    startRef.current();
    goToRef.current(4);
  }, []);

  return (
    <TourContext.Provider value={{ startScreeningTour, startDailyTour, startWimbiTour }}>
      {children}
    </TourContext.Provider>
  );
};
