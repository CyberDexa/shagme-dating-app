import React from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Sun } from '@/components/icons/Sun';
import { MoonStar } from '@/components/icons/MoonStar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { cn } from '@/utils/cn';

interface ValidationTestProps {
  className?: string;
}

const ValidationTest: React.FC<ValidationTestProps> = ({ className }) => {
  const { colorScheme, isDarkColorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className={cn('flex-1 items-center justify-center p-6 bg-background', className)}>
      <View className="max-w-md w-full space-y-6">
        {/* Header */}
        <View className="text-center space-y-2">
          <Text className="text-3xl font-bold text-foreground">
            ShagMe Setup Test
          </Text>
          <Text className="text-muted-foreground">
            Validating React Native + Expo + NativeWind + Reusables integration
          </Text>
        </View>

        {/* Theme Information */}
        <View className="bg-card p-4 rounded-lg border border-border space-y-3">
          <Text className="text-lg font-semibold text-card-foreground">
            Theme Status
          </Text>
          <View className="space-y-2">
            <Text className="text-sm text-muted-foreground">
              Current scheme: {colorScheme}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Is dark mode: {isDarkColorScheme ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        {/* Interactive Elements */}
        <View className="space-y-4">
          <Text className="text-lg font-semibold text-foreground">
            Component Tests
          </Text>
          
          {/* Theme Toggle Button */}
          <Button 
            onPress={toggleColorScheme}
            variant="outline"
            className="flex-row items-center space-x-2"
          >
            {isDarkColorScheme ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <MoonStar className="h-4 w-4 mr-2" />
            )}
            <Text className="text-foreground">
              Switch to {isDarkColorScheme ? 'Light' : 'Dark'} Mode
            </Text>
          </Button>

          {/* Button Variants */}
          <View className="space-y-2">
            <Button variant="default">
              <Text className="text-primary-foreground">Default Button</Text>
            </Button>
            
            <Button variant="secondary">
              <Text className="text-secondary-foreground">Secondary Button</Text>
            </Button>
            
            <Button variant="destructive">
              <Text className="text-destructive-foreground">Destructive Button</Text>
            </Button>
            
            <Button variant="ghost">
              <Text className="text-foreground">Ghost Button</Text>
            </Button>
          </View>
        </View>

        {/* Success Message */}
        <View className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <Text className="text-center text-primary font-medium">
            ✅ All systems operational!
          </Text>
          <Text className="text-center text-sm text-muted-foreground mt-1">
            React Native, Expo, NativeWind, and React Native Reusables are properly configured
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ValidationTest;
