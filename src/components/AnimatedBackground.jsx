import React from 'react';

// Simple animated gradient background using CSS
const AnimatedBackground = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      background: 'linear-gradient(-45deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientBG 15s ease infinite',
    }}
  />
);

export default AnimatedBackground;

// Add the CSS keyframes to global styles
const style = document.createElement('style');
style.innerHTML = `
@keyframes gradientBG {
  0% {background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}`;
document.head.appendChild(style);
