import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

const {width, height} = Dimensions.get('window');

const LoadingScreen = ({message = 'Carregando...', showSpinner = true}) => {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}>
      <View style={styles.content}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>vo1d</Text>
          </View>
        </Animatable.View>

        {showSpinner && (
          <Animatable.View
            animation="fadeIn"
            duration={1000}
            style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </Animatable.View>
        )}

        <Animatable.Text
          animation="fadeInUp"
          duration={1000}
          style={styles.message}>
          {message}
        </Animatable.Text>
      </View>
    </LinearGradient>
  );
};

const ErrorBoundary = ({error, onRetry}) => {
  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}>
      <View style={styles.content}>
        <Animatable.View
          animation="shake"
          duration={1000}
          style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>
            {error || 'Ocorreu um erro inesperado'}
          </Text>
        </Animatable.View>

        {onRetry && (
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            style={styles.retryContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </View>
    </LinearGradient>
  );
};

const EmptyState = ({icon, title, message, actionText, onAction}) => {
  return (
    <View style={styles.emptyContainer}>
      <Animatable.View
        animation="fadeIn"
        duration={1000}
        style={styles.emptyContent}>
        <Text style={styles.emptyIcon}>{icon}</Text>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyMessage}>{message}</Text>
        
        {actionText && onAction && (
          <TouchableOpacity style={styles.emptyAction} onPress={onAction}>
            <Text style={styles.emptyActionText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </Animatable.View>
    </View>
  );
};

const PullToRefresh = ({refreshing, onRefresh, children}) => {
  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#ffffff"
          colors={['#ffffff']}
        />
      }>
      {children}
    </ScrollView>
  );
};

const SwipeGesture = ({onSwipeLeft, onSwipeRight, children}) => {
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        onSwipeRight && onSwipeRight();
      } else if (gestureState.dx < -50) {
        onSwipeLeft && onSwipeLeft();
      }
    },
  });

  return (
    <View {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  spinnerContainer: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
  errorContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  retryContainer: {
    marginTop: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyAction: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export {
  LoadingScreen,
  ErrorBoundary,
  EmptyState,
  PullToRefresh,
  SwipeGesture,
};

