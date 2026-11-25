import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GameScreen from './src/screens/GameScreen';
import { installWebRuntime } from './src/services/webRuntime';

export default function App() {
  useEffect(() => installWebRuntime(), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GameScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
