import React from 'react';
import { ModelType } from '../types/models';

interface ModelIconProps {
  className?: string;
}

export const DurianIcon: React.FC<ModelIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" fill="#4CAF50" r="100" />
    <polygon fill="white" points="150.0,80.0 170.0,115.359 210.6218,115.0 190.0,150.0 210.6218,185.0 170.0,184.641 150.0,220.0 130.0,184.641 89.3782,185.0 110.0,150.0 89.3782,115.0 130.0,115.359" />
  </svg>
);

export const MangoIcon: React.FC<ModelIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" fill="#FFC107" r="100" />
    <polygon fill="white" points="150.0,80.0 173.5114,117.6393 216.574,128.3688 188.0423,162.3607 191.145,206.6312 150.0,190.0 108.855,206.6312 111.9577,162.3607 83.426,128.3688 126.4886,117.6393" />
  </svg>
);

export const GuavaIcon: React.FC<ModelIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <circle cx="150" cy="150" fill="#FF4081" r="100" />
    <polygon fill="white" points="150.0,80.0 178.2843,121.7157 220.0,150.0 178.2843,178.2843 150.0,220.0 121.7157,178.2843 80.0,150.0 121.7157,121.7157" />
  </svg>
);

export function getModelIcon(model: ModelType) {
  switch (model) {
    case 'durian':
      return DurianIcon;
    case 'mango':
      return MangoIcon;
    case 'guava':
      return GuavaIcon;
  }
}