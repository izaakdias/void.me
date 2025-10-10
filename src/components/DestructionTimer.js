import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const DestructionTimer = ({ttl, openedAt, onDestroy}) => {
  const [timeLeft, setTimeLeft] = useState(ttl);

  useEffect(() => {
    if (!openedAt) return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - openedAt) / 1000;
      const remaining = Math.max(0, ttl - elapsed);
      
      setTimeLeft(Math.ceil(remaining));
      
      if (remaining <= 0) {
        clearInterval(interval);
        onDestroy && onDestroy();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [ttl, openedAt, onDestroy]);

  if (!openedAt || timeLeft <= 0) {
    return null;
  }

  const progress = timeLeft / ttl;
  const color = progress > 0.5 ? '#4CAF50' : progress > 0.2 ? '#FF9800' : '#F44336';

  return (
    <View style={styles.timerContainer}>
      <LinearGradient
        colors={[color, color + '80']}
        style={[styles.timerBar, {width: `${progress * 100}%`}]}
      />
      <Text style={[styles.timerText, {color}]}>
        {timeLeft}s
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  timerBar: {
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  timerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DestructionTimer;

