import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const SkriningScreen = () => {
  return (
    <View style={styles.container}>
      <Text>SkriningScreen</Text>
    </View>
  )
}

export default SkriningScreen

const styles = StyleSheet.create({
       container: { flex: 1, backgroundColor: C.bg },
})