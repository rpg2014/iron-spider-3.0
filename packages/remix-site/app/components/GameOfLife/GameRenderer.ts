import { Cell, Universe } from "client-rust-functions";
import { GameOfLifeProps } from "../GameOfLife";




// Canvas drawing utilities with performance optimizations
export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private props: GameOfLifeProps;
  private width: number;
  private height: number;
  private gridCanvas: HTMLCanvasElement | null = null;
  private gridCanvasRef: React.RefObject<HTMLCanvasElement> | null = null
  private imageData: ImageData | null = null;
  private pixelBuffer: Uint32Array | null = null;
  private debugGrid: boolean = false;
  private createdCanvas: HTMLCanvasElement | null  = null;

  constructor(ctx: CanvasRenderingContext2D, props: GameOfLifeProps, width: number, height: number, gridCanvasRef: React.RefObject<HTMLCanvasElement> | null, debugGrid?: boolean) {
    this.ctx = ctx;
    this.props = props;
    this.width = width;
    this.height = height;
    this.gridCanvasRef = gridCanvasRef
    this.createdCanvas = document.createElement("canvas");
    this.initializeOptimizations();
  }

  private getIndex(row: number, column: number) {
    return row * this.width + column;
  }

  private initializeOptimizations() {
    console.log("Initializing optimizations with cellSize:", this.props.cellSize);

    // Create static grid background
    this.createStaticGrid();

    // Initialize ImageData for fast pixel manipulation (for small cell sizes)
    if (this.props.cellSize <= 4) {
      console.log("Using ImageData optimization for small cells");
      this.initializeImageData();
    } else {
      console.log("Using canvas optimization for larger cells");
    }
  }

  public createStaticGrid() {
    // Create an offscreen canvas for the static grid
    this.gridCanvas =  this.gridCanvasRef?.current ?? null// : this.createdCanvas;
    if(this.gridCanvas === null) {
      console.error('Grid canvas ref not set')
      return;
    }
    this.gridCanvas.width = this.ctx.canvas.width;
    this.gridCanvas.height = this.ctx.canvas.height;
    // put grid canvas below play and reset buttons in the dom for debugging
    // this.gridCanvas.style.position = "absolute";
    // this.gridCanvas.style.top = "0";
    

    const gridCtx = this.gridCanvas.getContext("2d");
    if (!gridCtx) return;

    gridCtx.beginPath();
    gridCtx.strokeStyle = this.props.gridColor;
    gridCtx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= this.width; i++) {
      const x = i * (this.props.cellSize + 1) + 0.5; // +0.5 for crisp lines
      gridCtx.moveTo(x, 0);
      gridCtx.lineTo(x, (this.props.cellSize + 1) * this.height + 1);
    }

    // Horizontal lines
    for (let j = 0; j <= this.height; j++) {
      const y = j * (this.props.cellSize + 1) + 0.5; // +0.5 for crisp lines
      gridCtx.moveTo(0, y);
      gridCtx.lineTo((this.props.cellSize + 1) * this.width + 1, y);
    }

    gridCtx.stroke();
  }

  private initializeImageData() {
    // For very small cells, use direct pixel manipulation
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;
    this.imageData = this.ctx.createImageData(canvasWidth, canvasHeight);
    this.pixelBuffer = new Uint32Array(this.imageData.data.buffer);
  }

  private hexToRgba(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (255 << 24) | (b << 16) | (g << 8) | r; // ABGR format
  }

  drawGrid() {
    // Simply draw the pre-rendered grid
    if (this.gridCanvas) {
      this.debugGrid && console.log('Drawing static grid using offscreen canvas');
      this.ctx.drawImage(this.gridCanvas, 0, 0);
    } else {
      console.log('Grid canvas not initialized, drawing grid with canvas');

      this.ctx.beginPath();
      this.ctx.strokeStyle = this.props.gridColor;
      this.ctx.lineWidth = 1;

      // Vertical lines.
      for (let i = 0; i <= this.width; i++) {
        this.ctx.moveTo(i * (this.props.cellSize + 1) + 1, 0);
        this.ctx.lineTo(i * (this.props.cellSize + 1) + 1, (this.props.cellSize + 1) * this.height + 1);
      }

      // Horizontal lines.
      for (let j = 0; j <= this.height; j++) {
        this.ctx.moveTo(0, j * (this.props.cellSize + 1) + 1);
        this.ctx.lineTo((this.props.cellSize + 1) * this.width + 1, j * (this.props.cellSize + 1) + 1);
      }

      this.ctx.stroke();
    }
  }

  /**
   * TODO: abstract out the cell mapping logic from array. to make the data structure easier to change, ie add color or somithgin. 
   * @param universe - The universe to draw cells from
   * @returns 
   */
  drawCells(universe: Universe) {
    const { ctx, props, width, height } = this;
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(props.memory.buffer, cellsPtr, width * height);

    this.debugGrid && console.log('Drawing cells:', { 
      width, 
      height, 
      cellSize: props.cellSize, 
      totalCells: cells.length,
      aliveCells: cells.filter(cell => cell === Cell.Alive).length
    });

    // Use ImageData for small cells (much faster)
    if (this.imageData && this.pixelBuffer && props.cellSize <= 4) {
      this.debugGrid && console.log('Using ImageData rendering method');
      this.drawCellsWithImageData(cells);
      return;
    }

    // Optimized canvas drawing for larger cells
    this.debugGrid && console.log('Using canvas rendering method');
    this.drawCellsWithCanvas(cells);
  }

  private drawCellsWithImageData(cells: Uint8Array) {
    if (!this.imageData || !this.pixelBuffer) return;

    const { props, width, height } = this;
    const aliveColor = this.hexToRgba(props.aliveColor);
    const deadColor = this.hexToRgba(props.deadColor);
    const canvasWidth = this.ctx.canvas.width;

    // Clear the buffer
    this.pixelBuffer.fill(deadColor);

    // Draw cells directly to pixel buffer
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = this.getIndex(row, col);
        const isAlive = cells[idx] === Cell.Alive;

        if (isAlive) {
          const startX = col * (props.cellSize + 1) + 1;
          const startY = row * (props.cellSize + 1) + 1;

          // Fill the cell area in the pixel buffer
          for (let y = 0; y < props.cellSize; y++) {
            for (let x = 0; x < props.cellSize; x++) {
              const pixelIndex = (startY + y) * canvasWidth + (startX + x);
              if (pixelIndex < this.pixelBuffer.length) {
                this.pixelBuffer[pixelIndex] = aliveColor;
              }
            }
          }
        }
      }
    }

    // Draw the entire image data at once
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  private drawCellsWithCanvas(cells: Uint8Array) {
    const { ctx, props, width, height } = this;

    // Batch drawing by color to reduce fillStyle changes
    const aliveCells: Array<{ x: number; y: number }> = [];
    const deadCells: Array<{ x: number; y: number }> = [];

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = this.getIndex(row, col);
        const isAlive = cells[idx] === Cell.Alive;
        const x = col * (props.cellSize + 1) + 1;
        const y = row * (props.cellSize + 1) + 1;

        if (isAlive) {
          aliveCells.push({ x, y });
        } else {
          deadCells.push({ x, y });
        }
      }
    }

    // Draw all dead cells at once
    ctx.fillStyle = props.deadColor;
    ctx.beginPath();
    for (const cell of deadCells) {
      ctx.rect(cell.x, cell.y, props.cellSize, props.cellSize);
    }
    ctx.fill();

    // Draw all alive cells at once
    ctx.fillStyle = props.aliveColor;
    ctx.beginPath();
    for (const cell of aliveCells) {
      ctx.rect(cell.x, cell.y, props.cellSize, props.cellSize);
    }
    ctx.fill();
  }
}