import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ImageMessagingService} from '../services/ImageMessagingService';
import MonitoringService from '../services/MonitoringService';

const {width, height} = Dimensions.get('window');

const EphemeralImageViewer = ({
  messageId,
  senderName,
  ttl = 5,
  onImageDestroyed,
  onImageViewed,
  thumbnail = null,
  dimensions = {width: 300, height: 300},
}) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(ttl);
  const [isViewed, setIsViewed] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  // Timer de destruição
  useEffect(() => {
    if (isViewed && !isDestroyed) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            destroyImage();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isViewed, isDestroyed]);

  // Carregar imagem
  useEffect(() => {
    loadImage();
  }, [messageId]);

  // Pan responder para gestos
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value,
      });
    },
    onPanResponderMove: Animated.event(
      [null, {dx: pan.x, dy: pan.y}],
      {useNativeDriver: false}
    ),
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();
      
      // Se o usuário fez um gesto de swipe para baixo, destruir imagem
      if (gestureState.dy > 100) {
        destroyImage();
      } else {
        // Retornar à posição original
        Animated.spring(pan, {
          toValue: {x: 0, y: 0},
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro
      const cachedImage = await ImageMessagingService.getCachedImage(messageId);
      if (cachedImage) {
        setImage(cachedImage);
        setLoading(false);
        return;
      }

      // Carregar imagem do servidor
      const result = await ImageMessagingService.receiveEphemeralImage(messageId);
      
      if (result.success) {
        setImage(result.image);
        
        // Salvar no cache
        await ImageMessagingService.cacheImage(messageId, result.image);
        
        // Marcar como visualizada
        await ImageMessagingService.markImageAsViewed(messageId);
        setIsViewed(true);
        
        // Notificar que foi visualizada
        if (onImageViewed) {
          onImageViewed(messageId);
        }
      } else {
        throw new Error('Falha ao carregar imagem');
      }
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
      setError(err.message);
      MonitoringService.error('Erro ao carregar imagem', {
        messageId,
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const destroyImage = () => {
    if (isDestroyed) return;

    setIsDestroyed(true);
    
    // Animação de destruição
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Limpar cache
      ImageMessagingService.clearImageCache();
      
      // Notificar destruição
      if (onImageDestroyed) {
        onImageDestroyed(messageId);
      }
    });

    MonitoringService.logMessage('destroyed', {
      messageType: 'image',
      messageId,
      ttl,
    });
  };

  const handleImagePress = () => {
    if (!isViewed) {
      setIsViewed(true);
      if (onImageViewed) {
        onImageViewed(messageId);
      }
    }
  };

  if (isDestroyed) {
    return (
      <View style={styles.destroyedContainer}>
        <Animatable.View
          animation="fadeIn"
          duration={1000}
          style={styles.destroyedContent}>
          <Icon name="delete-forever" size={60} color="#ff6b6b" />
          <Text style={styles.destroyedText}>Imagem destruída</Text>
          <Text style={styles.destroyedSubtext}>
            Esta imagem foi auto-destruída após {ttl} segundos
          </Text>
        </Animatable.View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Carregando imagem...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>Erro ao carregar imagem</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadImage}>
          <Text style={styles.retryText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {scale: scaleAnim},
            {translateX: pan.x},
            {translateY: pan.y},
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="image" size={24} color="#ffffff" />
            <Text style={styles.headerText}>Imagem de {senderName}</Text>
          </View>
          
          {isViewed && (
            <View style={styles.timerContainer}>
              <Icon name="timer" size={20} color="#ff6b6b" />
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          )}
        </View>

        {/* Imagem */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleImagePress}
          activeOpacity={0.9}>
          
          {image ? (
            <Animated.Image
              source={{uri: `data:image/jpeg;base64,${image}`}}
              style={[
                styles.image,
                {
                  width: Math.min(dimensions.width, width - 40),
                  height: Math.min(dimensions.height, height - 200),
                },
              ]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="image" size={80} color="#666" />
              <Text style={styles.placeholderText}>Imagem não disponível</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          {!isViewed ? (
            <View style={styles.viewPrompt}>
              <Icon name="touch-app" size={20} color="#4ecdc4" />
              <Text style={styles.viewPromptText}>
                Toque na imagem para visualizar
              </Text>
            </View>
          ) : (
            <View style={styles.destructionWarning}>
              <Icon name="warning" size={20} color="#ff6b6b" />
              <Text style={styles.destructionText}>
                Esta imagem será destruída em {timeLeft} segundos
              </Text>
            </View>
          )}
        </View>

        {/* Controles */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => Alert.alert('Info', `Imagem de ${senderName}\nTTL: ${ttl} segundos`)}>
            <Icon name="info" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={destroyImage}>
            <Icon name="delete" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  gradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 10,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginLeft: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 20,
  },
  image: {
    borderRadius: 15,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  viewPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  viewPromptText: {
    fontSize: 16,
    color: '#4ecdc4',
    marginLeft: 10,
  },
  destructionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  destructionText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginLeft: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 20,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  destroyedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  destroyedContent: {
    alignItems: 'center',
  },
  destroyedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 20,
  },
  destroyedSubtext: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EphemeralImageViewer;

