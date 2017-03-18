import {
  MODES,
  TILE_SIZE,
  MAGIC_SCALE,
  GRID_LINE_WIDTH,
  SELECTION_COLOR,
  ERASE_TILE_COLOR,
  TILE_HOVER_COLOR,
  SELECTION_COLOR_ACTIVE
} from "../cfg";

import { roundTo } from "../math";

export function redraw() {
  // only redraw texture if it's absolutely necessary
  if (this.last.cx !== this.cx || this.last.cy !== this.cy) {
    this.redrawGridBuffer();
  }
};

/** Main render method */
export function render() {
  const selection = this.sw !== -0 && this.sh !== -0;
  this.renderBackground();
  this.renderGrid();
  this.renderLayers();
  if (!this.states.select || !selection) {
    this.renderHoveredTile();
  }
  if (selection) this.renderSelection();
};

export function renderBackground() {
  this.drawImage(
    this.cache.bg,
    0, 0,
    this.cw, this.ch
  );
};

export function renderGrid() {
  this.drawImage(
    this.cache.gridTexture,
    0, 0,
    this.cw, this.ch
  );
};

/** Render all layers */
export function renderLayers() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const layers = this.layers;
  for (let ii = 0; ii < this.layers.length; ++ii) {
    const layer = layers[ii];
    const bounds = layer.bounds;
    if (layer.states.hidden) continue;
    if (!this.boundsInsideView(bounds)) continue;
    if (MODES.DEV) {
      const x = (cx + ((bounds.x * TILE_SIZE) * cr)) | 0;
      const y = (cy + ((bounds.y * TILE_SIZE) * cr)) | 0;
      const w = (bounds.w * TILE_SIZE) * cr;
      const h = (bounds.h * TILE_SIZE) * cr;
      this.drawRectangle(
        x, y,
        w, h,
        this.buffers.boundingColor
      );
    }
    this.renderLayer(layer);
  };
};

/**
 * @param {Layer} layer
 */
export function renderLayer(layer) {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const lx = layer.x * TILE_SIZE;
  const ly = layer.y * TILE_SIZE;
  const batches = layer.batches;
  const opacity = layer.opacity;
  const sindex = this.sindex;
  // reset renderer opacity into original state
  const oopacity = opacity;
  if (opacity !== 255.0) this.setOpacity(opacity);
  for (let ii = 0; ii < batches.length; ++ii) {
    const batch = batches[ii];
    const bounds = batch.bounds;
    // batch index is higher than stack index, so ignore this batch
    if (sindex - ii < 0 && !batch.isEraser) {
      const drawing = this.buffers.drawing;
      // don't ignore our drawing batch
      if (drawing === null || drawing !== batch) continue;
    }
    if (!this.boundsInsideView(bounds)) continue;
    // batch is a background, fill the whole screen
    if (batch.isBackground) {
      this.drawRectangle(
        0, 0,
        this.cw, this.ch,
        batch.color
      );
      continue;
    }
    // draw batch boundings
    const x = (cx + (lx + (bounds.x * TILE_SIZE) * cr)) | 0;
    const y = (cy + (lx + (bounds.y * TILE_SIZE) * cr)) | 0;
    const w = (bounds.w * TILE_SIZE) * cr;
    const h = (bounds.h * TILE_SIZE) * cr;
    if (MODES.DEV) {
      if (batch.isEraser && batch.isEmpty()) continue;
      this.drawRectangle(
        x, y,
        w, h,
        this.buffers.boundingColor
      );
    }
    this.drawImage(
      batch.texture,
      x, y,
      w, h
    );
  };
  if (opacity !== 255.0) this.setOpacity(oopacity);
};

export function renderHoveredTile() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  // apply empty tile hover color
  const mx = this.mx;
  const my = this.my;
  const relative = this.getRelativeTileOffset(mx, my);
  //console.log(relative.x, relative.y);
  const rx = relative.x * TILE_SIZE;
  const ry = relative.y * TILE_SIZE;
  const x = ((cx + GRID_LINE_WIDTH/2) + (rx * cr)) | 0;
  const y = ((cy + GRID_LINE_WIDTH/2) + (ry * cr)) | 0;
  const ww = (TILE_SIZE * cr) | 0;
  const hh = (TILE_SIZE * cr) | 0;
  this.drawRectangle(
    x, y,
    ww, hh,
    TILE_HOVER_COLOR
  );
};

export function renderSelection() {
  const cx = this.cx | 0;
  const cy = this.cy | 0;
  const cr = this.cr;
  const xx = (cx + (this.sx * TILE_SIZE) * cr) | 0;
  const yy = (cy + (this.sy * TILE_SIZE) * cr) | 0;
  const ww = ((this.sw * TILE_SIZE) * cr) | 0;
  const hh = ((this.sh * TILE_SIZE) * cr) | 0;
  let color = (
    this.states.selecting ?
    SELECTION_COLOR_ACTIVE :
    SELECTION_COLOR
  );
  this.drawRectangle(
    xx, yy,
    ww, hh,
    color
  );
};
