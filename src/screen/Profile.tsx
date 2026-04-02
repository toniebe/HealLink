import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text>ProfileScreen</Text>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
       container: { flex: 1, backgroundColor: C.bg },
})