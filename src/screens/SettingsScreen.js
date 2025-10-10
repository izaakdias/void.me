import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';

const SettingsScreen = ({navigation}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'You have been signed out');
            navigation.navigate('Welcome');
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will remove all messages and local data. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Success', 'Data cleared successfully');
          }
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About vo1d',
      'vo1d v1.0.0\n\nEphemeral messages with end-to-end encryption.\n\nBuilt with React Native and Expo.',
      [{text: 'OK'}]
    );
  };

  const SettingItem = ({icon, title, subtitle, onPress, rightComponent, isDestructive, isPremium}) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, isDestructive && styles.destructiveText, isPremium && styles.premiumText]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, isPremium && styles.premiumSubtitle]}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || <Text style={styles.settingArrow}>›</Text>}
    </TouchableOpacity>
  );

  const ToggleItem = ({icon, title, subtitle, value, onToggle}) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E5EA', true: '#000000' }}
        thumbColor={value ? '#ffffff' : '#ffffff'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Texto principal */}
        <Text style={styles.mainText}>
          Manage your privacy and security settings
        </Text>

        {/* Seção de Notificações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <ToggleItem
            icon=""
            title="Push Notifications"
            subtitle="Receive notifications for new messages"
            value={notificationsEnabled}
            onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
          />
        </View>

        {/* Seção de Privacidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingItem
            icon=""
            title="High Encryption"
            subtitle="Add ultra encryption to all messages"
            onPress={() => Alert.alert(
              'Premium Feature', 
              'High encryption is available for premium users only',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Redirecting to premium purchase...')}
              ]
            )}
            isPremium={true}
          />
          <SettingItem
            icon=""
            title="Auto-destruction"
            subtitle="Set the time of your messages"
            onPress={() => Alert.alert(
              'Premium Feature', 
              'Auto-destruction is available for premium users only',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Redirecting to premium purchase...')}
              ]
            )}
            isPremium={true}
          />
        </View>

        {/* Seção de Conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon=""
            title="Profile"
            subtitle="Edit personal information"
            onPress={() => Alert.alert('Profile', 'Feature will be implemented')}
          />
          <SettingItem
            icon=""
            title="Statistics"
            subtitle="127 messages sent"
            onPress={() => Alert.alert('Statistics', 'You have sent 127 messages')}
          />
        </View>

        {/* Botão de Suporte */}
        <View style={styles.supportSection}>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => Alert.alert('Support', 'Contact us at support@vo1d.app')}
            activeOpacity={0.8}>
            <Text style={styles.supportButtonText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Botão de Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainText: {
    fontSize: 36,
    color: '#000000',
    textAlign: 'left',
    lineHeight: 42,
    opacity: 0.9,
    paddingHorizontal: 0,
    marginBottom: 40,
  },
  section: {
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: -5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginVertical: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  settingArrow: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  destructiveText: {
    color: '#FF3B30',
  },
  premiumText: {
    color: '#8E8E93',
  },
  premiumSubtitle: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  supportSection: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  supportButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8E8E93',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  logoutSection: {
    marginTop: 40,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default SettingsScreen;