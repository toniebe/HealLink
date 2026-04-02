import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {authStore} from '../store/authStore';

const HomeScreen: React.FC = () => {
  const user = authStore.getUser();

  const handleLogout = () => {
    authStore.clear(); // hapus token & user
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name}!</Text>
      {/* <Text style={styles.role}>Role: {user?.role}</Text> */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 24, fontWeight: '700', color: '#2A8FA0', marginBottom: 24},
  logoutButton: {
    backgroundColor: '#E05252',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  logoutText: {color: '#FFF', fontWeight: '700'},
});

export default HomeScreen;