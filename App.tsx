import { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  useEffect(() => {
    mobileAds().initialize().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}