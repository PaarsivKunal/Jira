import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 z-50 flex items-center justify-center gap-2 safe-top">
      <WifiOff size={16} />
      <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
    </div>
  );
};

export default OfflineIndicator;

