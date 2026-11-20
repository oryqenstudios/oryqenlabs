import type { ExploreSource } from '../sections/Teardown';

/** Nectar N7 Pro, photographed: the die and its blocks (frames/chip/die.webp, frames/chip/die/<block>.webp).
 *  Block rects are where each sits on the die; macros are exact crops of them, sharpened. Specs are placeholders. */
export const CHIP: ExploreSource = {
  name: 'Nectar N7 Pro',
  dir: 'chip/die',
  layers: [
    { id: 'perf', name: "Performance cores", story: "Two big cores for the heaviest work, each with wide execution and deep prediction.", specs: ["2 performance cores", "Up to 4.4 GHz", "Wide out-of-order execution", "Per-core L1: 192 KB instruction, 128 KB data"], mm: "2 cores", temp: 38 },
    { id: 'l2', name: "Performance L2 cache", story: "A fast shared cache sits right beside the big cores.", specs: ["16 MB shared L2", "Perfectly regular SRAM banks", "Shared by both performance cores"], mm: "16 MB", temp: 38 },
    { id: 'eff', name: "Efficiency cores", story: "Four small cores do most of the day’s work on a sliver of power.", specs: ["4 efficiency cores", "Up to 2.9 GHz", "Shared 4 MB L2"], mm: "4 cores", temp: 38 },
    { id: 'gpu', name: "GPU", story: "Six shader cores with hardware ray tracing for console-class graphics.", specs: ["6-core GPU", "Hardware ray tracing", "Mesh shading", "Dynamic caching"], mm: "6 cores", temp: 38 },
    { id: 'npu', name: "Neural engine", story: "Thirty-two identical cores run on-device intelligence privately.", specs: ["32-core neural engine", "45 trillion operations per second", "Shared local buffer"], mm: "32 cores", temp: 38 },
    { id: 'slc', name: "System cache", story: "A large last-level cache feeds every block on the die.", specs: ["24 MB system-level cache", "Shared by CPU, GPU and neural engine", "Cuts trips to memory"], mm: "24 MB", temp: 38 },
    { id: 'io', name: "Memory and I/O", story: "The edges carry memory interfaces and the pads that connect the die to the world.", specs: ["LPDDR6 memory interface", "12 GB unified memory", "USB4 and display controllers", "Bond pads and seal ring"], mm: "Edge", temp: 38 },
  ],
  parts: {
    perf: { rect: [0.0605, 0.0399, 0.3193, 0.5], markers: [{ x: 0.3, y: 0.3, label: "Execution units" }, { x: 0.65, y: 0.6, label: "Branch prediction and decode" }, { x: 0.5, y: 0.85, label: "Register files" }] },
    l2: { rect: [0.2856, 0.0347, 0.5444, 0.4948], markers: [{ x: 0.3, y: 0.3, label: "SRAM banks" }, { x: 0.82, y: 0.12, label: "Tag and control arrays" }, { x: 0.5, y: 0.75, label: "Sense amplifiers" }] },
    eff: { rect: [0.1802, 0.4201, 0.4399, 0.6797], markers: [{ x: 0.22, y: 0.5, label: "Core 1" }, { x: 0.5, y: 0.5, label: "Core 2" }, { x: 0.78, y: 0.5, label: "Core 3" }, { x: 0.5, y: 0.87, label: "Shared L2" }] },
    gpu: { rect: [0.5649, 0.3099, 0.8652, 0.6102], markers: [{ x: 0.2, y: 0.25, label: "Shader core" }, { x: 0.55, y: 0.55, label: "Ray-tracing unit" }, { x: 0.85, y: 0.85, label: "GPU cache" }] },
    npu: { rect: [0.625, 0.5946, 0.9448, 0.9149], markers: [{ x: 0.2, y: 0.3, label: "One of 32 neural cores" }, { x: 0.55, y: 0.62, label: "Multiply–accumulate array" }, { x: 0.93, y: 0.5, label: "Shared buffer" }] },
    slc: { rect: [0.2002, 0.5998, 0.52, 0.9201], markers: [{ x: 0.3, y: 0.5, label: "Cache banks" }, { x: 0.7, y: 0.12, label: "Bank control strip" }, { x: 0.5, y: 0.92, label: "Memory fabric" }] },
    io: { rect: [0.8682, 0.77, 0.9917, 0.9896], markers: [{ x: 0.2, y: 0.3, label: "Memory interface" }, { x: 0.55, y: 0.5, label: "ESD protection" }, { x: 0.8, y: 0.4, label: "Bond pads" }, { x: 0.9, y: 0.95, label: "Seal ring" }] },
  },
};
