import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const InviteCodeScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableInvites, setAvailableInvites] = useState(5);
  const [maxInvites] = useState(5);
  const [selectedCountry, setSelectedCountry] = useState({
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    mask: '(###) ###-####'
  });
  const [sentInvites, setSentInvites] = useState([
    {
      id: '1',
      phoneNumber: '+55 11 99999-9999',
      status: 'pending'
    },
    {
      id: '2',
      phoneNumber: '+55 11 88888-8888',
      status: 'accepted'
    }
  ]);

  const countries = [
    { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', mask: '(##) #####-####' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', mask: '### ###-####' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', mask: '### ###-####' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', mask: '(###) ###-####' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', mask: '#### ### ####' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', mask: '## ## ## ## ##' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', mask: '### ########' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', mask: '### ## ## ##' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', mask: '### ### ####' },
  ];

  const handleCountrySelect = (countryCode) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      setPhoneNumber('');
    }
  };

  const handlePhoneNumberChange = (text) => {
    const numbers = text.replace(/\D/g, '');
    let maskedNumber = '';
    let maskIndex = 0;
    
    for (let i = 0; i < numbers.length && maskIndex < selectedCountry.mask.length; i++) {
      if (selectedCountry.mask[maskIndex] === '#') {
        maskedNumber += numbers[i];
        maskIndex++;
      } else {
        maskedNumber += selectedCountry.mask[maskIndex];
        maskIndex++;
        i--;
      }
    }
    
    setPhoneNumber(maskedNumber);
  };

  const validatePhoneNumber = () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 8 && selectedCountry.code !== '';
  };

  const handleInvite = async () => {
    if (!validatePhoneNumber()) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (availableInvites <= 0) {
      Alert.alert('No Invites', 'You have no invites available');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newInvite = {
        id: Date.now().toString(),
        phoneNumber: `${selectedCountry.dialCode} ${phoneNumber}`,
        status: 'pending'
      };
      
      setSentInvites(prev => [newInvite, ...prev]);
      setAvailableInvites(prev => prev - 1);
      setPhoneNumber('');
      
      Alert.alert('Invite Sent!', `Invite sent to ${selectedCountry.dialCode} ${phoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = (inviteId) => {
    Alert.alert(
      'Cancel Invite',
      'Are you sure you want to cancel this invite?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => {
            setSentInvites(prev => prev.filter(invite => invite.id !== inviteId));
            setAvailableInvites(prev => prev + 1);
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'accepted': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      default: return 'Unknown';
    }
  };

  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteItem}>
      <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
      <View style={styles.rightSection}>
        <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        {item.status === 'pending' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelInvite(item.id)}
          >
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.mainText}>Invite someone to the high level of privacy chat</Text>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Country Selector */}
          <View style={styles.countrySelector}>
            <Picker
              selectedValue={selectedCountry.code}
              onValueChange={handleCountrySelect}
              style={styles.picker}
              itemStyle={styles.pickerItem}>
              {countries.map((country) => (
                <Picker.Item
                  key={country.code}
                  label={`${country.flag} ${country.name} (${country.dialCode})`}
                  value={country.code}
                />
              ))}
            </Picker>
          </View>

          {/* Phone Input */}
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor="#8E8E93"
            value={phoneNumber}
            onChangeText={handlePhoneNumberChange}
            keyboardType="phone-pad"
          />

          {/* Send Button */}
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!validatePhoneNumber() || isLoading || availableInvites <= 0) && styles.sendButtonDisabled,
            ]} 
            onPress={handleInvite}
            disabled={!validatePhoneNumber() || isLoading || availableInvites <= 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send Invite</Text>
            )}
          </TouchableOpacity>

          {/* Invites Counter */}
          <Text style={styles.invitesCounter}>
            {availableInvites} of {maxInvites} invites available
          </Text>
        </View>

        {/* Invites List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Sent Invites</Text>
          
          {sentInvites.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No invites sent yet</Text>
            </View>
          ) : (
            <FlatList
              data={sentInvites}
              renderItem={renderInviteItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        </View>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
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
  formSection: {
    paddingHorizontal: 0,
    paddingBottom: 30,
  },
  countrySelector: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  picker: {
    height: 50,
    color: '#000000',
  },
  pickerItem: {
    fontSize: 16,
    color: '#000000',
  },
  phoneInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  invitesCounter: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  listSection: {
    paddingHorizontal: 0,
    paddingBottom: 30,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  inviteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  cancelButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default InviteCodeScreen;