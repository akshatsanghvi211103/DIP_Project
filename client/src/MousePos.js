import React from 'react';

const useMousePosition = () => {
    const [mousePosition, setMousePosition] = React.useState({ x: null, y: null });
    const fastCursorSize = 20
    const slowCursorSize = 40

    React.useEffect(() => {
        const updateMousePosition = e => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', updateMousePosition);
        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);

    return (
        <>
            {/* <div id="slowCursor" style={{
                height: `${slowCursorSize}px`,
                width: `${slowCursorSize}px`,
                top: `${mousePosition["y"] - slowCursorSize / 2}px`,
                left: `${mousePosition["x"] - slowCursorSize / 2}px`}
            }></div> */}
            <div id="fastCursor" style={{
                        height: `${fastCursorSize}px`,
                        width: `${fastCursorSize}px`,
                        top: `${mousePosition["y"] - fastCursorSize / 2}px`,
                        left: `${mousePosition["x"] - fastCursorSize / 2}px`}
                        }></div>
        </>
    )
};

export default useMousePosition;