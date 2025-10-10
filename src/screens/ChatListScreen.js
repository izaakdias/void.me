import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';

const ChatListScreen = ({navigation}) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      // Simular carregamento de conversas
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados de exemplo
      const mockConversations = [
        {
          id: '1',
          recipient: {
            id: '2',
            name: 'João Silva',
            phoneNumber: '11987654321'
          },
          lastMessageTime: new Date().toISOString(), // Agora
          lastMessage: 'New message',
          hasUnreadMessages: true,
          hasMessage: true,
          messageStatus: 'unread'
        },
        {
          id: '2',
          recipient: {
            id: '3',
            name: 'Maria Santos',
            phoneNumber: '11976543210'
          },
          lastMessageTime: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
          lastMessage: 'Seen at: 14:30',
          hasUnreadMessages: false,
          hasMessage: true,
          messageStatus: 'read',
          seenAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          recipient: {
            id: '4',
            name: 'Ana Costa',
            phoneNumber: '11965432109'
          },
          lastMessageTime: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
          lastMessage: 'New message',
          hasUnreadMessages: false,
          hasMessage: false,
          messageStatus: 'empty'
        },
        {
          id: '4',
          recipient: {
            id: '5',
            name: 'Carlos Lima',
            phoneNumber: '11954321098'
          },
          lastMessageTime: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          lastMessage: 'Seen at: 09:15',
          hasUnreadMessages: false,
          hasMessage: true,
          messageStatus: 'read',
          seenAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = () => {
    Alert.alert(
      'Novo Chat',
      'Para iniciar uma nova conversa, você precisa do número de telefone do contato.',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Continuar',
          onPress: () => {
            // Aqui você poderia navegar para uma tela de busca de contatos
            Alert.alert('Info', 'Funcionalidade de novo chat será implementada');
          }
        }
      ]
    );
  };

  const handleChatPress = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      recipient: conversation.recipient
    });
  };

  const handleInvitePress = () => {
    navigation.navigate('Invites');
  };

  const formatMessageTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = (now - messageTime) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m`;
    } else if (diffInMinutes < 1440) { // 24 horas = 1440 minutos
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d`;
    }
  };

  const formatSeenTime = (timestamp) => {
    const seenTime = new Date(timestamp);
    return seenTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const renderInviteFrame = () => (
    <TouchableOpacity
      style={styles.inviteFrame}
      onPress={handleInvitePress}
      activeOpacity={0.7}>
      
      <View style={styles.inviteFrameContent}>
        <View style={styles.inviteIconContainer}>
          <Text style={styles.inviteIcon}>+</Text>
        </View>
        <Text style={styles.inviteText}>Invite someone</Text>
      </View>
    </TouchableOpacity>
  );

  const renderConversation = ({item}) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.7}>
      
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.recipient.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.recipientName}>{item.recipient.name}</Text>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.lastMessageTime)}
          </Text>
        </View>
        
        <View style={styles.conversationFooter}>
          <Text 
            style={[
              styles.lastMessage,
              styles.italicMessage, // Sempre itálico
              item.messageStatus === 'unread' && styles.unreadMessageItalic,
              item.messageStatus === 'read' && styles.readMessageItalic,
              item.messageStatus === 'empty' && styles.emptyMessageItalic
            ]}
            numberOfLines={1}>
            {item.messageStatus === 'read' && item.seenAt 
              ? `Seen at: ${formatSeenTime(item.seenAt)}`
              : item.lastMessage
            }
          </Text>
          {item.hasUnreadMessages && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>!</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
      <Text style={styles.emptySubtitle}>
        Inicie uma nova conversa para começar a usar o vo1d
      </Text>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={handleStartNewChat}
        activeOpacity={0.8}>
        <Text style={styles.newChatButtonText}>Nova Conversa</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando conversas...</Text>
      </View>
    );
  }

      return (
        <View style={styles.container}>
          {/* Lista de conversas */}
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            ListHeaderComponent={renderInviteFrame}
            contentContainerStyle={styles.conversationsList}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
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
  conversationsList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inviteFrame: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#8E8E93',
    backgroundColor: 'transparent',
  },
  inviteFrameContent: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  inviteIcon: {
    fontSize: 24,
    fontWeight: '300',
    color: '#8E8E93',
  },
  inviteText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginVertical: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '500', // Medium
    color: '#000000',
  },
  messageTime: {
    fontSize: 15,
    color: '#8E8E93',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    fontWeight: '400', // Regular
    color: '#8E8E93',
    flex: 1,
  },
  italicMessage: {
    fontStyle: 'italic',
  },
  unreadMessageItalic: {
    color: '#000000',
  },
  readMessageItalic: {
    color: '#8E8E93',
  },
  emptyMessageItalic: {
    color: '#8E8E93',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  newChatButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  newChatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ChatListScreen;