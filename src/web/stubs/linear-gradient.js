import React from 'react';
import { View } from 'react-native';

export default function LinearGradient({ children, style, ...props }) {
  return React.createElement(View, { style }, children);
}
