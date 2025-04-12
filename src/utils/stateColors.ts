
export const getStateColor = (state: string): string => {
  switch (state) {
    case 'running':
      return 'bg-green-500/20 text-green-500 border border-green-500/50';
    case 'idle':
      return 'bg-blue-500/20 text-blue-500 border border-blue-500/50';
    case 'error':
      return 'bg-red-500/20 text-red-500 border border-red-500/50';
    case 'maintenance':
      return 'bg-amber-500/20 text-amber-500 border border-amber-500/50';
    case 'standby':
      return 'bg-purple-500/20 text-purple-500 border border-purple-500/50';
    default:
      return 'bg-gray-500/20 text-gray-500 border border-gray-500/50';
  }
};
