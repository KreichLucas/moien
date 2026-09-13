import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export type LuxPose =
  | 'hero'
  | 'pointing'
  | 'thumbsup'
  | 'jumping'
  | 'armsCrossed'
  | 'waving'
  | 'thinking'
  | 'reading'
  | 'laptop'
  | 'celebrating';

const SOURCES: Record<LuxPose, number> = {
  hero: require('../../assets/lux-mascot.png'),
  pointing: require('../../assets/lux/lux-pointing.png'),
  thumbsup: require('../../assets/lux/lux-thumbsup.png'),
  jumping: require('../../assets/lux/lux-jumping.png'),
  armsCrossed: require('../../assets/lux/lux-arms-crossed.png'),
  waving: require('../../assets/lux/lux-waving.png'),
  thinking: require('../../assets/lux/lux-thinking.png'),
  reading: require('../../assets/lux/lux-reading.png'),
  laptop: require('../../assets/lux/lux-laptop.png'),
  celebrating: require('../../assets/lux/lux-celebrating.png'),
};

const ASPECT_RATIOS: Record<LuxPose, number> = {
  hero: 1374 / 1145,
  pointing: 403 / 249,
  thumbsup: 404 / 236,
  jumping: 401 / 270,
  armsCrossed: 400 / 212,
  waving: 311 / 239,
  thinking: 311 / 246,
  reading: 311 / 294,
  laptop: 311 / 265,
  celebrating: 311 / 234,
};

export function Lux({
  pose = 'hero',
  width = 100,
  style,
}: {
  pose?: LuxPose;
  width?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={SOURCES[pose]}
      style={[{ width, height: width * ASPECT_RATIOS[pose] }, style]}
      resizeMode="contain"
    />
  );
}
