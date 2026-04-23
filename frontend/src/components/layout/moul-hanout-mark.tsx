import { cn } from '@/lib/utils';

type MoulHanoutMarkProps = {
  className?: string;
};

export function MoulHanoutMark({ className }: MoulHanoutMarkProps) {
  return (
    <svg
      viewBox="0 0 56 72"
      fill="none"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <path
        d="M28 3C18.8 8.4 10.9 18.2 8.6 31.6V69h38.8V31.6C45.1 18.2 37.2 8.4 28 3Z"
        fill="#F6F1E6"
        stroke="#C8B08A"
        strokeWidth="2.4"
      />
      <path
        d="M28 15.8c-6.9 4.3-11.7 11.8-13.1 20.5V69h26.2V36.3c-1.4-8.7-6.2-16.2-13.1-20.5Z"
        fill="#F9F7F1"
        stroke="#D7C3A4"
        strokeWidth="1.4"
      />
      <path
        d="M28.2 23.8c-4.8 0-8.8 3.9-8.8 8.8 0 4.9 4 8.9 8.8 8.9 4.8 0 8.8-4 8.8-8.9 0-4.9-4-8.8-8.8-8.8Z"
        fill="#E6F3EA"
        stroke="#4A8D62"
        strokeWidth="1.4"
      />
      <path
        d="M20.7 53.7c2.3-5.4 5-8.8 7.9-10.3 2.7 1.2 5.1 4.3 7.1 9.2"
        stroke="#4A8D62"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M28.5 18.4c1 4.8 1.6 10.2.7 16.4"
        stroke="#4A8D62"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M25.4 29.1c2.6.9 4.9 2.3 6.8 4.3"
        stroke="#4A8D62"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path d="M8.6 69h38.8" stroke="#C8B08A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
