import { useMediaQuery } from "./hooks/useStore";
import { DesktopApp } from "./components/desktop/DesktopApp";
import { MobileApp } from "./components/mobile/MobileApp";

/** Pick the layout by viewport width — same 760px breakpoint as the handoff. */
export function App() {
  const isMobile = useMediaQuery("(max-width: 760px)");
  return isMobile ? <MobileApp /> : <DesktopApp />;
}
