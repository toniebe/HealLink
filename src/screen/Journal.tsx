import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { C } from '../helper/theme'

const MoodJournalScreen = () => {
  return (
    <View style={styles.container}>
      <Text>MoodJournalScreen</Text>
    </View>
  )
}

export default MoodJournalScreen

const styles = StyleSheet.create({
       container: { flex: 1, backgroundColor: C.bg },
})