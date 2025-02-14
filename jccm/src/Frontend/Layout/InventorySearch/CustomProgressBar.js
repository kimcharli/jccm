import React from 'react';
import { Field, ProgressBar, Text, tokens } from '@fluentui/react-components';
import { RocketFilled, FireFilled, FlagCheckeredRegular } from '@fluentui/react-icons'; // Adjust the import path as necessary

const getRandomFontSize = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomColor = () => {
    const colors = [
        tokens.colorPaletteCranberryBorderActive,
        tokens.colorStatusWarningBorderActive,
        tokens.colorPaletteMarigoldBackground3,
        tokens.colorPalettePumpkinBorderActive,
        tokens.colorPaletteRedForegroundInverted,
        tokens.colorPaletteBerryBackground3,
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const CustomProgressBar = ({ message, size, max, value }) => {
    // Calculate the left position of the rocket based on the progress
    const rocketPosition = (value / max) * 100;
    const fireOffset = 12; // Adjust this value to control the distance between the rocket and the fire
    const fireFontSize = getRandomFontSize(10, 15); // Random font size between 5 and 15
    const fireColor = getRandomColor(); // Random color from the set

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // Align items to the start
                justifyContent: 'center',
                width: '100%',
                position: 'relative', // Make the container relative to position the rocket icon absolutely inside it
                overflow: 'visible',
                height: '20px'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    width: '100%',
                    gap: '20px',
                    marginBottom: '3px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: '20px',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                        }}
                    >
                        <Text
                            size={size}
                            font='numeric'
                        >
                            {'Processing '}
                            <Text
                                size={size}
                                font='monospace'
                                weight='bold'
                            >
                                {message.hostSeq}
                            </Text>
                            {' devices'}
                        </Text>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginLeft: '20px' }}>
                        {Object.entries(message.hostStatusCount).map(([status, count]) => (
                            <div
                                key={status}
                                style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}
                            >
                                <Text
                                    size={100}
                                    font='numeric'
                                >
                                    {`${status}: `}
                                    <Text
                                        size={100}
                                        font='monospace'
                                        weight='bold'
                                    >
                                        {count}
                                    </Text>
                                </Text>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: '5px',
                    }}
                >
                    <Text
                        size={size}
                        font='numeric'
                    >
                        Completing
                    </Text>
                    <Text
                        size={size}
                        font='monospace'
                        weight='bold'
                    >
                        {((100 * message.hostSeq) / message.totalHostCount).toFixed(2)}
                    </Text>
                    <Text
                        size={size}
                        font='numeric'
                    >
                        %
                    </Text>
                </div>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
                <ProgressBar
                    value={value}
                    max={max}
                    shape='rounded'
                    thickness='medium'
                    style={{ width: '100%' }}
                    color='success'
                />
                <div style={{ display: 'flex', marginTop: '7px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {value < max && (
                            <FireFilled
                                style={{
                                    position: 'absolute',
                                    left: `calc(${rocketPosition}% - ${fireOffset}px)`,
                                    transform: 'translateX(-50%) rotate(-90deg)',
                                    transition: 'left 0.3s ease-out', // Smooth transition
                                    fontSize: `${fireFontSize}px`,
                                    color: fireColor,
                                }}
                            />
                        )}
                        <RocketFilled
                            style={{
                                position: 'absolute',
                                left: `${rocketPosition}%`,
                                transform: 'translateX(-50%) rotate(45deg)',
                                transition: 'left 0.3s ease-out', // Smooth transition
                                color: tokens.colorBrandForegroundLink,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
