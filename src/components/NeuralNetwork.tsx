import { useEffect, useRef, useState, useCallback } from 'react';

interface Neuron {
  id: number;
  x: number;
  y: number;
  layer: number;
  activation: number;
  connections: number[];
}

interface NeuralNetworkProps {
  isLearning: boolean;
  learningProgress: number;
  className?: string;
}

export function NeuralNetwork({ isLearning, learningProgress, className = '' }: NeuralNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const generateNetwork = useCallback((width: number, height: number) => {
    const layers = [4, 6, 8, 6, 4];
    const newNeurons: Neuron[] = [];
    let id = 0;

    const layerSpacing = width / (layers.length + 1);

    layers.forEach((neuronCount, layerIndex) => {
      const neuronSpacing = height / (neuronCount + 1);
      
      for (let i = 0; i < neuronCount; i++) {
        const connections: number[] = [];
        
        if (layerIndex < layers.length - 1) {
          const nextLayerStart = layers.slice(0, layerIndex + 1).reduce((a, b) => a + b, 0);
          const nextLayerCount = layers[layerIndex + 1];
          
          for (let j = 0; j < nextLayerCount; j++) {
            if (Math.random() > 0.3) {
              connections.push(nextLayerStart + j);
            }
          }
        }

        newNeurons.push({
          id: id++,
          x: layerSpacing * (layerIndex + 1),
          y: neuronSpacing * (i + 1),
          layer: layerIndex,
          activation: Math.random(),
          connections
        });
      }
    });

    return newNeurons;
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { width, height } = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
        setNeurons(generateNetwork(width, height));
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [generateNetwork]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Update neuron activations
      const updatedNeurons = neurons.map(neuron => ({
        ...neuron,
        activation: isLearning 
          ? (Math.sin(time * 3 + neuron.id * 0.5) + 1) / 2
          : 0.3 + Math.sin(time + neuron.id * 0.3) * 0.2
      }));

      // Draw connections
      updatedNeurons.forEach(neuron => {
        neuron.connections.forEach(targetId => {
          const target = updatedNeurons.find(n => n.id === targetId);
          if (!target) return;

          const gradient = ctx.createLinearGradient(neuron.x, neuron.y, target.x, target.y);
          const alpha = isLearning ? 0.4 + neuron.activation * 0.4 : 0.15;
          
          gradient.addColorStop(0, `hsla(180, 100%, 50%, ${alpha})`);
          gradient.addColorStop(0.5, `hsla(260, 100%, 65%, ${alpha})`);
          gradient.addColorStop(1, `hsla(320, 100%, 60%, ${alpha})`);

          ctx.beginPath();
          ctx.moveTo(neuron.x, neuron.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = isLearning ? 1 + neuron.activation * 2 : 1;
          ctx.stroke();

          // Data flow particles
          if (isLearning && Math.random() > 0.95) {
            const progress = (time * 0.5 + neuron.id * 0.1) % 1;
            const px = neuron.x + (target.x - neuron.x) * progress;
            const py = neuron.y + (target.y - neuron.y) * progress;

            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(180, 100%, 70%, ${0.8})`;
            ctx.fill();
          }
        });
      });

      // Draw neurons
      updatedNeurons.forEach(neuron => {
        const radius = 6 + neuron.activation * 6;
        const hue = 180 + neuron.layer * 30;

        // Glow effect
        const glowRadius = radius * 3;
        const glow = ctx.createRadialGradient(
          neuron.x, neuron.y, 0,
          neuron.x, neuron.y, glowRadius
        );
        glow.addColorStop(0, `hsla(${hue}, 100%, 60%, ${neuron.activation * 0.5})`);
        glow.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, ${50 + neuron.activation * 20}%, ${0.8 + neuron.activation * 0.2})`;
        ctx.fill();

        // Inner glow
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${neuron.activation})`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [neurons, dimensions, isLearning]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />
      
      {/* Learning indicator */}
      {isLearning && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-primary/30 box-glow-cyan">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-sm text-primary">
              Processando: {Math.round(learningProgress)}%
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300"
                style={{ width: `${learningProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
