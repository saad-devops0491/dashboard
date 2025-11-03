import React, { useEffect, useRef, useState } from 'react';

const Timer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // initial countdown (1 day, 5h, 34m, 41s)
  const totalTime = 1 * 24 * 60 * 60 + 5 * 60 * 60 + 34 * 60 + 41;
  const [remaining, setRemaining] = useState(totalTime);
  const [running, setRunning] = useState(true);

  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  // draw arcs on canvas
  const drawArc = (
    ctx: CanvasRenderingContext2D,
    progress: number,
    radius: number,
    color: string,
    bgColor: string,
    centerX: number,
    centerY: number
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 5;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.arc(
      centerX,
      centerY,
      radius,
      -Math.PI / 2,
      2 * Math.PI * progress - Math.PI / 2
    );
    ctx.stroke();
  };

  // update canvas each tick
  const updateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // flip so arcs move forward
    drawArc(ctx, (7 - days) / 7, 150, '#4D3DF7', '#141D36', centerX, centerY);
    drawArc(
      ctx,
      (24 - hours) / 24,
      130,
      '#F35DCB',
      '#141D36',
      centerX,
      centerY
    );
    drawArc(
      ctx,
      (60 - minutes) / 60,
      110,
      '#ECDF2A',
      '#141D36',
      centerX,
      centerY
    );
    drawArc(
      ctx,
      (60 - seconds) / 60,
      90,
      '#3FFFDA',
      '#141D36',
      centerX,
      centerY
    );
  };

  // countdown interval
  useEffect(() => {
    updateCanvas();
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (!running) return prev;
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running]);

  // redraw when time updates
  useEffect(() => {
    updateCanvas();
  }, [remaining]);

  const reset = () => {
    setRemaining(totalTime);
    setRunning(true);
  };

  return (
    <div className="relative w-[400px] h-[400px] bg-[#0b1430] rounded-2xl flex items-center justify-center">
      {/* Play/Pause button */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={() => setRunning(!running)}
          className="w-8 h-8 rounded-full bg-[#141D36] text-white text-lg"
        >
          {running ? '❚❚' : '▶'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="absolute top-0 left-0"
      />

      {/* Time text */}
      <div className="text-center z-10">
        <div className="flex space-x-2 text-xl font-semibold">
          <span className="text-[#4D3DF7]">
            {String(days).padStart(2, '0')}
            <div className="text-[10px] tracking-widest">DAYS</div>
          </span>
          <span className="text-[#F35DCB]">
            {String(hours).padStart(2, '0')}
            <div className="text-[10px] tracking-widest">HOURS</div>
          </span>
          <span className="text-[#ECDF2A]">
            {String(minutes).padStart(2, '0')}
            <div className="text-[10px] tracking-widest">MINUTES</div>
          </span>
          <span className="text-[#3FFFDA]">
            {String(seconds).padStart(2, '0')}
            <div className="text-[10px] tracking-widest">SECONDS</div>
          </span>
        </div>
      </div>

      {/* Reset button */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <button
          onClick={reset}
          className="w-8 h-8 rounded-full bg-[#141D36] text-white text-lg"
        >
          ⟳
        </button>
      </div>
    </div>
  );
};

export default Timer;
