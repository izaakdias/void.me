import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {ImageMessagingService} from '../services/ImageMessagingService';
import MonitoringService from '../services/MonitoringService';

const {width} = Dimensions.get('window');

const ImageSelector = ({onImageSelected, onClose}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const showImagePicker = () => {
    Alert.alert(
      'Selecionar Imagem',
      'Escolha uma opção',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Câmera', onPress: openCamera},
        {text: 'Galeria', onPress: openGallery},
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: true,
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: true,
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response) => {
    if (response.didCancel || response.error) {
      return;
    }

    if (response.assets && response.assets[0]) {
      const asset = response.assets[0];
      const imageBase64 = asset.base64;
      
      if (imageBase64) {
        setSelectedImage(imageBase64);
        setPreview(`data:image/jpeg;base64,${imageBase64}`);
      }
    }
  };

  const validateAndSendImage = async () => {
    if (!selectedImage) {
      Alert.alert('Erro', 'Nenhuma imagem selecionada');
      return;
    }

    setLoading(true);

    try {
      // Validar imagem
      const validation = await ImageMessagingService.validateImageBeforeSending(selectedImage);
      
      if (!validation.valid) {
        Alert.alert('Erro', validation.error);
        return;
      }

      // Processar imagem
      const processedImage = await processImage(selectedImage);
      
      // Chamar callback com imagem processada
      if (onImageSelected) {
        onImageSelected(processedImage);
      }

      // Log para monitoramento
      MonitoringService.logUserActivity('image_selected', {
        imageSize: selectedImage.length,
        processedSize: processedImage.length,
        compressionRatio: processedImage.length / selectedImage.length,
      });

    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      Alert.alert('Erro', 'Falha ao processar imagem');
      MonitoringService.error('Erro ao processar imagem', {
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const processImage = async (imageBase64) => {
    // Aqui você pode adicionar processamento adicional
    // Por exemplo, compressão, redimensionamento, etc.
    
    return imageBase64;
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setPreview(null);
  };

  const getImageSize = (imageBase64) => {
    const sizeInBytes = imageBase64.length;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    const sizeInMB = Math.round(sizeInKB / 1024 * 100) / 100;
    
    if (sizeInMB >= 1) {
      return `${sizeInMB} MB`;
    } else {
      return `${sizeInKB} KB`;
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Enviar Imagem</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {!selectedImage ? (
          <Animatable.View
            animation="fadeIn"
            duration={500}
            style={styles.selectorContainer}>
            
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={showImagePicker}>
              <Icon name="add-photo-alternate" size={60} color="#4ecdc4" />
              <Text style={styles.selectorText}>Selecionar Imagem</Text>
              <Text style={styles.selectorSubtext}>
                Toque para escolher uma imagem
              </Text>
            </TouchableOpacity>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={openCamera}>
                <Icon name="camera-alt" size={30} color="#ffffff" />
                <Text style={styles.optionText}>Câmera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={openGallery}>
                <Icon name="photo-library" size={30} color="#ffffff" />
                <Text style={styles.optionText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        ) : (
          <Animatable.View
            animation="fadeIn"
            duration={500}
            style={styles.previewContainer}>
            
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Pré-visualização</Text>
              <TouchableOpacity onPress={clearSelection}>
                <Icon name="refresh" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.imagePreview}>
              <Image
                source={{uri: preview}}
                style={styles.previewImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.imageInfo}>
              <View style={styles.infoRow}>
                <Icon name="info" size={20} color="#4ecdc4" />
                <Text style={styles.infoText}>
                  Tamanho: {getImageSize(selectedImage)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="timer" size={20} color="#ff6b6b" />
                <Text style={styles.infoText}>
                  Auto-destruição: 5 segundos
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="security" size={20} color="#4ecdc4" />
                <Text style={styles.infoText}>
                  Criptografia: E2E
                </Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={clearSelection}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sendButton}
                onPress={validateAndSendImage}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="send" size={20} color="#ffffff" />
                    <Text style={styles.sendText}>Enviar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animatable.View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 Imagens são criptografadas e auto-destruídas em 5 segundos
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  closeButton: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 40,
    marginBottom: 40,
  },
  selectorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
  },
  selectorSubtext: {
    fontSize: 14,
    color: '#a0a0a0',
    marginTop: 10,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    minWidth: 100,
  },
  optionText: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 10,
  },
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  imagePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  previewImage: {
    width: width - 80,
    height: 200,
    borderRadius: 10,
  },
  imageInfo: {
    marginBottom: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sendButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 0.45,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sendText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
  },
});

export default ImageSelector;

