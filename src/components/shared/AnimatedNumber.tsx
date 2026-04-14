import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber({ value, suffix = '', decimals = 0 }: AnimatedNumberProps) {
  const displayed = useAnimatedNumber(value);
  const formatted = decimals > 0 ? displayed.toFixed(decimals) : displayed.toLocaleString();
  return <span className="count-animate">{formatted}{suffix}</span>;
}
