import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const InsightScreen = () => {
  return (
    <View style={styles.container}>

      <Text>InsightScreen</Text>
    </View>
  )
}

export default InsightScreen

const styles = StyleSheet.create({
      container: { flex: 1, backgroundColor: C.bg },
})