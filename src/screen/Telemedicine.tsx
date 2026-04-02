import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const TelemedicineScreen = () => {
  return (
    <View style={styles.container}>
      <Text>TelemedicineScreen</Text>
    </View>
  )
}

export default TelemedicineScreen

const styles = StyleSheet.create({
       container: { flex: 1, backgroundColor: C.bg },
})