import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { C } from '../helper/theme';
import CustomHeader from '../components/molecules/HeaderCustom';

const InsightScreen = () => {
  return (
    <View style={styles.container}>
      <CustomHeader title="Insight" centerTitle showMenu />{' '}
      <Text>InsightScreen</Text>
    </View>
  );
};

export default InsightScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
});
