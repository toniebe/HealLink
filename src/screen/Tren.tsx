import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const TrendScreen = () => {
  return (
    <View style={styles.container}>
      <Text>TrendScreen</Text>
    </View>
  )
}

export default TrendScreen

const styles = StyleSheet.create({
       container: { flex: 1, backgroundColor: C.bg },
})