// Tag.js

import React from 'react';
import PropTypes from 'prop-types';

const Tag = ({ label, color, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(label); // Pass the label to the onClick handler
    }
  };

  return (
    <div
      style={{
        display: 'inline-block',
        backgroundColor: color,
        color: 'white',
        padding: '0.3em 0.5em',
        borderRadius: '0.44em',
        margin: '0.2em',
        fontWeight: 'light',
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.7em',
        cursor: 'pointer', // Add cursor pointer to indicate it's clickable
      }}
      onClick={handleClick}
    >
      {label}
    </div>
  );
};

Tag.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func, // onClick handler prop
};

export default Tag;
