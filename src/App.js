import './App.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  zoom: 0
};
const DEGREE_TO_RADIAN = Math.PI / 180;
const NUM_POINTS = 100_000;
const VIEW_MODE = {
  SVG: 0,
  CANVAS: 1,
  WEBGL: 2
};

function App() {
  const [data, setData] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODE.SVG);
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
    size: undefined,
  })
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const currTimeRef = useRef();
  const prevTimeRef = useRef();

  const canvasRef = useRef();

  useEffect(() => {
    const newData = Array.from(Array(NUM_POINTS)).map((_, i) => {
      return {
        radius: Math.random(),
        theta: Math.random() * 360
      };
    });
    setData(newData);

    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
      size: window.innerWidth >= window.innerHeight ? window.innerHeight / 2 : window.innerWidth / 2,
    });
  }, []);

  useEffect(() => {
    const animate = time => {
      if (prevTimeRef.current !== undefined) {
        setData(data => data.map(d => ({
          ...d, 
          theta: d.theta + Math.sqrt(d.radius)
        })));
      }
      prevTimeRef.current = time;
      currTimeRef.current = requestAnimationFrame(animate);
    };
    currTimeRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(currTimeRef.current);
  }, []); // Make sure the effect runs only once

  const handleClick = useCallback(() => {
    switch(viewMode) {
      case VIEW_MODE.SVG:
        setViewMode(VIEW_MODE.CANVAS);
        break;
      case VIEW_MODE.CANVAS:
        setViewMode(VIEW_MODE.WEBGL);
        break;
      case VIEW_MODE.WEBGL:
        setViewMode(VIEW_MODE.SVG);
        break;
      default:
        setViewMode(VIEW_MODE.SVG);
    }
  }, [viewMode]);

  const {width, height, size} = windowSize;

  const renderSVGPoints = () => {
    return (
      <g transform={`translate(${size}, ${size})`}>
        {data && data.length && data.map((p, i) => (
          <circle key={i} r={2} fill="#ed3e15"
            cx={p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size}
            cy={p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size} />
        ))}
      </g>
    );
  };


  const renderDeckglLayer = () => {
    return new ScatterplotLayer({
      id: 'scatter-plot',
      data,
      radiusScale: 2,
      radiusMinPixels: 0.25,
      getPosition: p => [
        p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size,
        p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size
      ],
      getFillColor: [26, 142, 156, 255],
      getRadius: 1,
      updateTriggers: {
        getPosition: updateTrigger
      },
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    });
  };


  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fca106";

      data && data.length && data.forEach(p => { 
        const cx = p.radius * Math.cos(p.theta * DEGREE_TO_RADIAN) * size + width * 0.5;
        const cy = p.radius * Math.sin(p.theta * DEGREE_TO_RADIAN) * size + size;
        ctx.beginPath();
        // x, y, radius, start angle, end angle
        ctx.arc(cx, cy, 2, 0, Math.PI * 2); 
        ctx.fill();
      });
    }
    
  }

  if (!data || !data.length) {
    return null;
  }

  if (viewMode === VIEW_MODE.CANVAS) {
    renderCanvas();
    return (
      <div id='canvas-div' >
        <canvas id='canvas-layer' ref={canvasRef}/>
        <button style={{position: 'absolute', top: '8px', right: '8px'}} onClick={handleClick}>{Object.keys(VIEW_MODE)[viewMode]}</button>
      </div>
    );
  }

  return <>
    {
      viewMode === VIEW_MODE.SVG && <svg viewBox={`${size - 0.5*width} 0 ${width} ${height}`}>
        {renderSVGPoints()}
      </svg>
    }
    {
      viewMode === VIEW_MODE.WEBGL && <DeckGL
        layers={[renderDeckglLayer()]}
        initialViewState={INITIAL_VIEW_STATE}
        views={new OrthographicView({})}
      />
    }
    <button style={{position: 'absolute', top: '8px', right: '8px'}} onClick={handleClick}>{Object.keys(VIEW_MODE)[viewMode]}</button>
  </>;
}



export default App;

