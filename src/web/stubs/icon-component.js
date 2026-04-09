import React from 'react';
import { Text } from 'react-native';

const Icon = ({ name, size = 24, color = '#000', style, ...rest }) =>
  React.createElement(Text, { style: [{ fontSize: size, color }, style], ...rest }, '');

Icon.getImageSource = () => Promise.resolve(null);
Icon.getImageSourceSync = () => null;
Icon.getFontFamily = () => '';
Icon.loadFont = () => Promise.resolve();
Icon.hasIcons = () => true;

export default Icon;
