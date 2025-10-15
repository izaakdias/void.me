import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Image,
  Keyboard,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const ChatScreen = ({navigation, route}) => {
  const {conversationId, recipient} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openedMessages, setOpenedMessages] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const messageTTL = 5; // TTL fixo em segundos
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [destroyedMessages, setDestroyedMessages] = useState({});

  useEffect(() => {
    loadMessages();
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Timer para atualizar contagem regressiva
  useEffect(() => {
    const interval = setInterval(() => {
      // Força re-render para atualizar timer
      setOpenedMessages(prev => ({...prev}));
    }, 100); // Atualiza a cada 100ms para decimais mais fluidos

    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      // Simular carregamento de mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados de exemplo
      const mockMessages = [
        {
          id: '1',
          content: 'Hello! How are you?',
          senderId: recipient.id,
          timestamp: new Date(Date.now() - 300000).toISOString(),
          isOwnMessage: false,
          isOpened: false,
          ttl: 5,
          image: null
        },
        {
          id: '2',
          content: 'Hi! I\'m doing well, thank you! And you?',
          senderId: 'current-user',
          timestamp: new Date(Date.now() - 200000).toISOString(),
          isOwnMessage: true,
          isOpened: false,
          ttl: 5,
          image: null
        },
        {
          id: '3',
          content: 'Check out this cool photo!',
          senderId: recipient.id,
          timestamp: new Date(Date.now() - 100000).toISOString(),
          isOwnMessage: false,
          isOpened: false,
          ttl: 5,
          image: 'https://picsum.photos/200/150'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedImage) return;

    const message = {
      id: Date.now().toString(),
      content: newMessage.trim() || '',
      senderId: 'current-user',
      timestamp: new Date().toISOString(),
      isOwnMessage: true,
      isOpened: false,
      ttl: messageTTL,
      image: selectedImage ? selectedImage.uri : null
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedImage(null);
  };


  const handleAddImage = () => {
    setShowImageMenu(true);
  };

  const handleCameraPress = async () => {
    setShowImageMenu(false);
    
    try {
      // Solicitar permissão para câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      // Abrir câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        Alert.alert('Photo Taken', 'Photo ready to send!');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  const handleGalleryPress = async () => {
    setShowImageMenu(false);
    
    try {
      // Solicitar permissão para galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
        return;
      }

      // Abrir galeria
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        Alert.alert('Photo Selected', 'Photo ready to send!');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to access gallery');
    }
  };

  const handleOpenMessage = (messageId, isImage = false) => {
    // Marcar mensagem como aberta
    setOpenedMessages(prev => ({
      ...prev,
      [messageId]: {
        isOpened: true,
        openedAt: Date.now()
      }
    }));

    // Se for imagem, abrir em tela cheia
    if (isImage) {
      const message = messages.find(msg => msg.id === messageId);
      if (message && message.image) {
        setFullscreenImage({
          uri: message.image,
          messageId: messageId
        });
      }
    }

        // Timer para destruir mensagem após TTL configurado
        const message = messages.find(msg => msg.id === messageId);
        const ttl = message?.ttl || messageTTL;
        
        setTimeout(() => {
          setOpenedMessages(prev => {
            const updated = {...prev};
            delete updated[messageId];
            return updated;
          });
          
          // Marcar mensagem como destruída
          setDestroyedMessages(prev => ({
            ...prev,
            [messageId]: true
          }));
          
          setFullscreenImage(null);
        }, ttl * 1000);
  };

  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    
    // Formato hh:mm
    const hours = messageTime.getHours().toString().padStart(2, '0');
    const minutes = messageTime.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  const getRemainingTime = (messageId) => {
    const openedMessage = openedMessages[messageId];
    if (!openedMessage) return 0;
    
    const message = messages.find(msg => msg.id === messageId);
    const ttl = message?.ttl || messageTTL;
    
    const elapsed = Date.now() - openedMessage.openedAt;
    const remaining = Math.max(0, (ttl * 1000) - elapsed);
    return (remaining / 1000).toFixed(1);
  };

  const renderMessage = ({item}) => {
    const isOpened = openedMessages[item.id]?.isOpened;
    const remainingTime = getRemainingTime(item.id);
    const isImage = item.image !== null;
    const isDestroyed = destroyedMessages[item.id];
    
    // Não renderizar mensagens destruídas
    if (isDestroyed) {
      return null;
    }
    
    // Mensagens próprias sempre mostram conteúdo, exceto quando foram abertas por outros
    const shouldShowContent = item.isOwnMessage && !isOpened;
    
    return (
      <View style={[
        styles.messageRow,
        item.isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow
      ]}>
        {/* Timer/Timestamp - posição diferente para mensagens próprias vs recebidas */}
        {item.isOwnMessage ? (
          // Mensagens próprias: timestamp à esquerda da mensagem
          <>
            {isOpened ? (
              <View style={[styles.timerSide, styles.timerLeft]}>
                <Text style={styles.timerText}>{remainingTime}s</Text>
              </View>
            ) : (
              <View style={[styles.timerSide, styles.timerLeft]}>
                <Text style={styles.timestampText}>{formatMessageTime(item.timestamp)}</Text>
              </View>
            )}
            <View style={[
              styles.messageContainer,
              styles.ownMessage,
            ]}>
          
          {shouldShowContent ? (
            // Mensagem própria - mostrar conteúdo normalmente
            <>
              {isImage && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {item.content && (
                <Text style={[
                  styles.messageText,
                  item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}>
                  {item.content}
                </Text>
              )}
              
                  <View style={styles.messageFooter}>
                    {item.isOwnMessage && (
                      <Text style={styles.readStatus}>sent</Text>
                    )}
                  </View>
            </>
          ) : !isOpened ? (
            // Mensagem não aberta - mostrar botão para abrir
            <TouchableOpacity
              style={styles.unopenedMessage}
              onPress={() => handleOpenMessage(item.id, isImage)}
              activeOpacity={0.7}>
              <View style={styles.unopenedContent}>
                <Text style={styles.unopenedTitle}>
                  {isImage ? 'Image message' : 'Text message'}
                </Text>
                <Text style={styles.unopenedSubtitle}>
                  [click to open]
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            // Mensagem aberta - mostrar conteúdo
            <>
              {isImage && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.messageImage} />
                </View>
              )}
              {item.content && (
                <Text style={[
                  styles.messageText,
                  item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}>
                  {item.content}
                </Text>
              )}
              
                  <View style={styles.messageFooter}>
                    {item.isOwnMessage && (
                      <Text style={styles.readStatus}>sent</Text>
                    )}
                  </View>
            </>
          )}
        </View>
          </>
        ) : (
          // Mensagens recebidas: mensagem primeiro, timestamp depois
          <>
            <View style={[
              styles.messageContainer,
              styles.otherMessage,
            ]}>
          
          {shouldShowContent ? (
            // Mensagem própria - mostrar conteúdo normalmente
            <>
              {isImage && (
                <Image source={{ uri: item.image }} style={styles.messageImage} />
              )}
              {item.content && (
                <Text style={[
                  styles.messageText,
                  item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}>
                  {item.content}
                </Text>
              )}
              
                  <View style={styles.messageFooter}>
                    {item.isOwnMessage && (
                      <Text style={styles.readStatus}>sent</Text>
                    )}
                  </View>
            </>
          ) : !isOpened ? (
            // Mensagem não aberta - mostrar botão para abrir
            <TouchableOpacity
              style={styles.unopenedMessage}
              onPress={() => handleOpenMessage(item.id, isImage)}
              activeOpacity={0.7}>
              <View style={styles.unopenedContent}>
                <Text style={styles.unopenedTitle}>
                  {isImage ? 'Image message' : 'Text message'}
                </Text>
                <Text style={styles.unopenedSubtitle}>
                  [click to open]
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            // Mensagem aberta - mostrar conteúdo
            <>
              {isImage && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.image }} style={styles.messageImage} />
                </View>
              )}
              {item.content && (
                <Text style={[
                  styles.messageText,
                  item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
                ]}>
                  {item.content}
                </Text>
              )}
              
                  <View style={styles.messageFooter}>
                    {item.isOwnMessage && (
                      <Text style={styles.readStatus}>sent</Text>
                    )}
                  </View>
            </>
          )}
        </View>
            {isOpened ? (
              <View style={[styles.timerSide, styles.timerRight]}>
                <Text style={styles.timerText}>{remainingTime}s</Text>
              </View>
            ) : (
              <View style={[styles.timerSide, styles.timerRight]}>
                <Text style={styles.timestampText}>{formatMessageTime(item.timestamp)}</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Conversation started</Text>
      <Text style={styles.emptySubtitle}>
        Messages auto-destruct 5 seconds after being opened
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Lista de mensagens */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Input de mensagem */}
      <View style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
        

        {/* Prévia da imagem selecionada */}
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
              activeOpacity={0.7}>
              <Text style={styles.removeImageText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.addImageButton}
            onPress={handleAddImage}
            activeOpacity={0.7}>
            <Text style={styles.addImageButtonText}>+</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            placeholderTextColor="#8E8E93"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() && !selectedImage) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() && !selectedImage}
            activeOpacity={0.8}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
        
        {/* Aviso de segurança */}
        <View style={styles.securityWarning}>
          <Text style={styles.securityText}>
            Encrypted messages with no history
          </Text>
        </View>
      </View>

      {/* Modal do Menu de Imagem */}
      <Modal
        visible={showImageMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageMenu(false)}
        >
          <View style={styles.imageMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleCameraPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Send from camera</Text>
            </TouchableOpacity>
            
            <View style={styles.menuSeparator} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleGalleryPress}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemText}>Send from gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para Imagem em Tela Cheia */}
      <Modal
        visible={!!fullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenContainer}>
          <Image 
            source={{ uri: fullscreenImage?.uri }} 
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          
          {/* Timer na parte superior */}
          {fullscreenImage && (
            <View style={styles.fullscreenTimer}>
              <Text style={styles.fullscreenTimerText}>
                {getRemainingTime(fullscreenImage.messageId)}s
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000000',
    fontSize: 18,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100, // Espaço para o input fixo
  },
  messageContainer: {
    maxWidth: '75%',
    marginVertical: 6,
    borderRadius: 15,
    padding: 10,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E5E5EA',
    borderBottomRightRadius: 5,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  ownMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93',
  },
  readStatus: {
    fontSize: 10,
    color: '#8E8E93',
  },
  destructionTimer: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 5,
  },
  unopenedMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  unopenedContent: {
    alignItems: 'center',
  },
  unopenedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  unopenedSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  addImageButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  addImageButtonText: {
    fontSize: 20,
    fontWeight: '300',
    color: '#ffffff',
  },
  messageInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    maxHeight: 100,
    paddingVertical: 5,
  },
  sendButton: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  securityWarning: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  securityText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  imageMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  menuSeparator: {
    height: 0.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginHorizontal: 20,
  },
  // Image Styles
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  removeImageButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  imageContainer: {
    marginBottom: 5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#8E8E93',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  timerSide: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  timerLeft: {
    marginRight: 5,
  },
  timerRight: {
    marginLeft: 5,
  },
  // Fullscreen Image Styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenTimer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
  },
  fullscreenTimerText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
  },
});

export default ChatScreen;