import React from 'react';
import { Text as RNText } from 'react-native';
import type { TextProps } from 'react-native';
import { cn } from '@/utils/cn';

const TextClassContext = React.createContext<string | undefined>(undefined);

interface TextComponentProps extends TextProps {
  className?: string;
}

const Text = React.forwardRef<RNText, TextComponentProps>(
  ({ className, ...props }, ref) => {
    const textClass = React.useContext(TextClassContext);
    return (
      <RNText
        className={cn(
          'text-base text-foreground',
          textClass,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text, TextClassContext };
