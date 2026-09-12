import React from 'react';

export const AmbientOrbs: React.FC = () => {
  return (
    <>
      <div
        className="ambient-orb ambient-orb-blue"
        style={{
          top: '-10%',
          right: '5%',
          width: '550px',
          height: '550px',
        }}
      />
      <div
        className="ambient-orb ambient-orb-purple"
        style={{
          bottom: '10%',
          left: '-5%',
          width: '500px',
          height: '500px',
        }}
      />
      <div
        className="ambient-orb ambient-orb-blue"
        style={{
          bottom: '-15%',
          right: '25%',
          width: '450px',
          height: '450px',
          opacity: 0.1,
        }}
      />
    </>
  );
};
