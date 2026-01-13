import { useEffect, useRef } from 'react';

export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const font_size = 10;
    const columns = canvas.width / font_size;
    const drops: number[] = [];

    
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#00FF41"; 
      ctx.font = font_size + "px 'JetBrains Mono'";

      
      for (let i = 0; i < drops.length; i++) {
        
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
        
        
        ctx.fillStyle = Math.random() > 0.98 ? "#00FFFF" : "#00FF41";
        ctx.fillText(text, i * font_size, drops[i] * font_size);

        
        if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20 z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
